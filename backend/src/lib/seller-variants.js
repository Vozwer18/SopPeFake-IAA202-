const { randomUUID } = require('node:crypto');
const { id, integer, text, HttpError } = require('./validation');

function variantInput(body, existing = []) {
  const replace = body.variants !== undefined;
  const first = existing.find(variant => variant.status === 'active') || existing[0];
  const source = replace ? body.variants : [{ ...body, id: first?.variant_id, status: first?.status || 'active' }];
  if (!Array.isArray(source) || source.length < 1 || source.length > 32) throw new HttpError(400, 'Sản phẩm cần từ 1 đến 32 SKU.');
  const ids = new Set(), skus = new Set();
  const rows = source.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new HttpError(400, 'Dòng SKU không hợp lệ.');
    const variantId = row.id == null || row.id === '' ? null : id(row.id, 'ID phân loại');
    if (variantId && ids.has(variantId)) throw new HttpError(400, 'Một phân loại không được xuất hiện hai lần.');
    if (variantId) ids.add(variantId);
    const sku = row.sku == null || row.sku === '' ? null : text(row.sku, 'SKU', 100);
    if (sku && skus.has(sku.toLowerCase())) throw new HttpError(400, 'Các mã SKU không được trùng nhau.');
    if (sku) skus.add(sku.toLowerCase());
    const status = row.status ?? 'active';
    if (!['active', 'inactive'].includes(status)) throw new HttpError(400, 'Trạng thái SKU không hợp lệ.');
    return { id: variantId, sku, price: integer(row.price, `Giá SKU ${index + 1}`, 1, 999999999999), stock: integer(row.stock ?? 0, `Tồn kho SKU ${index + 1}`), status };
  });
  if (replace && !rows.some(row => row.status === 'active')) throw new HttpError(400, 'Cần giữ ít nhất một SKU đang bán. Muốn ngừng cả sản phẩm, hãy chọn Ẩn.');
  return { rows, replace };
}

async function updateStock(tx, productId, variant, stock) {
  const inventories = variant.inventories;
  const reserved = inventories.reduce((sum, row) => sum + Number(row.reserved_quantity || 0), 0);
  if (stock < reserved) throw new HttpError(400, `Tồn kho SKU ${variant.sku || variant.variant_id} không được thấp hơn ${reserved} sản phẩm đang giữ chỗ.`);
  if (!inventories.length) {
    await tx.inventories.create({ data: { product_id: productId, variant_id: variant.variant_id, quantity: stock } });
    return;
  }
  let delta = stock - inventories.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  if (delta >= 0) {
    if (delta) await tx.inventories.update({ where: { inventory_id: inventories[0].inventory_id }, data: { quantity: { increment: delta }, updated_at: new Date() } });
  } else {
    for (const row of inventories) {
      const decrease = Math.min(-delta, Math.max(0, Number(row.quantity || 0) - Number(row.reserved_quantity || 0)));
      if (decrease) await tx.inventories.update({ where: { inventory_id: row.inventory_id }, data: { quantity: { decrement: decrease }, updated_at: new Date() } });
      delta += decrease;
      if (delta === 0) break;
    }
    if (delta !== 0) throw new HttpError(400, 'Không thể giảm tồn kho của hàng đang giữ chỗ.');
  }
}

// Caller holds the product row lock on updates. Retired SKUs keep their IDs so
// existing cart/order references remain valid, while public APIs omit them.
async function saveVariants(tx, productId, input, isNew = false) {
  if (!isNew) await tx.$queryRaw`SELECT inventory_id FROM inventories WHERE product_id = ${productId} ORDER BY inventory_id FOR UPDATE`;
  const current = await tx.product_variants.findMany({ where: { product_id: productId }, orderBy: { variant_id: 'asc' }, include: { inventories: { orderBy: { inventory_id: 'asc' } } } });
  const byId = new Map(current.map(variant => [variant.variant_id, variant]));
  for (const row of input.rows) if (row.id && !byId.has(row.id)) throw new HttpError(400, 'SKU không thuộc sản phẩm này.');
  if (current.length + input.rows.filter(row => !row.id).length > 32) throw new HttpError(400, 'Sản phẩm tối đa 32 SKU, gồm cả SKU đã ngừng bán. Bạn có thể bật lại SKU cũ.');
  // Release only renamed codes inside this transaction, allowing code swaps
  // without changing variant identity or relaxing the global unique constraint.
  for (const row of input.rows) {
    const previous = byId.get(row.id);
    if (previous && row.sku && row.sku !== previous.sku) await tx.product_variants.update({ where: { variant_id: row.id }, data: { sku: null } });
  }
  for (const row of input.rows) {
    const previous = byId.get(row.id);
    const data = { sku: row.sku || previous?.sku || `SKU-${productId}-${randomUUID()}`, price: String(row.price), status: row.status };
    if (previous) {
      await tx.product_variants.update({ where: { variant_id: row.id }, data });
      await updateStock(tx, productId, previous, row.stock);
    } else {
      const variant = await tx.product_variants.create({ data: { product_id: productId, ...data } });
      await tx.inventories.create({ data: { product_id: productId, variant_id: variant.variant_id, quantity: row.stock } });
    }
  }
  if (input.replace && current.length) {
    const retained = new Set(input.rows.map(row => row.id).filter(Boolean));
    const retired = current.filter(variant => !retained.has(variant.variant_id)).map(variant => variant.variant_id);
    if (retired.length) await tx.product_variants.updateMany({ where: { product_id: productId, variant_id: { in: retired } }, data: { status: 'inactive' } });
  }
}

module.exports = { variantInput, saveVariants };
