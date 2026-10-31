const { Prisma } = require('@prisma/client');
const { HttpError } = require('./validation');

async function lockCustomer(tx, userId) {
  const users = await tx.$queryRaw`SELECT user_id, role, status FROM users WHERE user_id = ${userId} FOR UPDATE`;
  if (!users.length || users[0].role !== 'customer' || users[0].status !== 'active') throw new HttpError(401, 'Tài khoản người mua không còn hoạt động.');
}
async function lockStock(tx, productIds, variantIds) {
  const products = [...new Set(productIds)].sort((a, b) => a - b);
  const variants = [...new Set(variantIds)].sort((a, b) => a - b);
  if (products.length) await tx.$queryRaw`SELECT product_id FROM products WHERE product_id IN (${Prisma.join(products)}) ORDER BY product_id FOR UPDATE`;
  if (variants.length) {
    await tx.$queryRaw`SELECT variant_id FROM product_variants WHERE variant_id IN (${Prisma.join(variants)}) ORDER BY variant_id FOR UPDATE`;
    await tx.$queryRaw`SELECT inventory_id FROM inventories WHERE variant_id IN (${Prisma.join(variants)}) ORDER BY inventory_id FOR UPDATE`;
  }
}
// Reservations are tracked per SKU across inventory rows. Ship consumes both
// the reservation and physical stock; cancel releases only the reservation.
async function releaseReserved(tx, variantId, quantity, shipped = false) {
  const rows = await tx.inventories.findMany({ where: { variant_id: variantId }, orderBy: { inventory_id: 'asc' } });
  let left = quantity;
  for (const row of rows) {
    const take = Math.min(left, Number(row.reserved_quantity || 0));
    if (!take) continue;
    if (shipped && Number(row.quantity || 0) < take) throw new HttpError(409, 'Tồn kho không khớp số hàng giữ chỗ.');
    await tx.inventories.update({ where: { inventory_id: row.inventory_id }, data: {
      reserved_quantity: Number(row.reserved_quantity || 0) - take, ...(shipped ? { quantity: Number(row.quantity || 0) - take } : {}), updated_at: new Date(),
    } });
    left -= take;
    if (!left) break;
  }
  if (left) throw new HttpError(409, 'Số hàng giữ chỗ không đủ để cập nhật đơn.');
}
module.exports = { lockCustomer, lockStock, releaseReserved };
