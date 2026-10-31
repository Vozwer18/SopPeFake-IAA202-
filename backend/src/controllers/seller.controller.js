const prisma = require('../config/database');
const { saveImages } = require('./media.util');
const { action, id, text, integer, HttpError } = require('../lib/validation');

async function ownShop(sellerId, shopId, active = false) {
  const shop = await prisma.shops.findFirst({ where: { shop_id: id(shopId), seller_id: sellerId, ...(active ? { status: 'active' } : {}) } });
  if (!shop) throw new HttpError(404, 'Không tìm thấy cửa hàng của bạn hoặc cửa hàng không hoạt động.');
  return shop;
}
async function ownProduct(sellerId, productId) {
  const product = await prisma.products.findFirst({ where: { product_id: id(productId), shops: { seller_id: sellerId } }, include: { product_variants: { orderBy: { variant_id: 'asc' } } } });
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm của bạn.');
  return product;
}
async function categoryId(value) {
  if (value == null || value === '') return null;
  const category_id = id(value, 'Danh mục');
  if (!await prisma.categories.findFirst({ where: { category_id, status: 'active' } })) throw new HttpError(400, 'Danh mục không tồn tại.');
  return category_id;
}
function productInput(body) {
  return {
    name: text(body.name, 'Tên sản phẩm', 255),
    description: body.description ? text(body.description, 'Mô tả', 20000) : null,
    price: integer(body.price, 'Giá', 1, 999999999999),
    stock: integer(body.stock ?? 0, 'Tồn kho'),
    sku: body.sku ? text(body.sku, 'SKU', 100) : null,
  };
}
exports.dashboard = action(async (req, res) => {
  const seller = await prisma.sellers.findUnique({ where: { seller_id: req.user.sellerId }, include: { shops: { include: { shop_statistics: true } } } });
  if (!seller) throw new HttpError(404, 'Không tìm thấy người bán.');
  const ids = seller.shops.map(s => s.shop_id);
  const [products, orders] = await Promise.all([prisma.products.count({ where: { shop_id: { in: ids } } }), prisma.order_items.count({ where: { shop_id: { in: ids } } })]);
  res.json({ success: true, data: { seller, stats: { products, orders, shops: ids.length, revenue: seller.shops.reduce((sum, s) => sum + Number(s.shop_statistics?.[0]?.total_revenue || 0), 0) } } });
});
exports.shops = action(async (req, res) => {
  const data = await prisma.shops.findMany({ where: { seller_id: req.user.sellerId }, orderBy: { shop_id: 'asc' } });
  res.json({ success: true, data });
});
exports.createShop = action(async (req, res) => {
  const shop_name = text(req.body.shopName || req.body.shop_name || req.body.name, 'Tên cửa hàng', 150);
  const data = await prisma.shops.create({ data: { seller_id: req.user.sellerId, shop_name, description: req.body.description ? text(req.body.description, 'Mô tả', 10000) : null, status: 'active' } });
  res.status(201).json({ success: true, data });
});
exports.updateShop = action(async (req, res) => {
  const shop = await ownShop(req.user.sellerId, req.params.id);
  if (shop.status === 'banned') throw new HttpError(403, 'Cửa hàng đã bị khóa bởi quản trị viên.');
  const data = {};
  if (req.body.shopName !== undefined || req.body.shop_name !== undefined || req.body.name !== undefined) data.shop_name = text(req.body.shopName || req.body.shop_name || req.body.name, 'Tên cửa hàng', 150);
  if (req.body.description !== undefined) data.description = req.body.description ? text(req.body.description, 'Mô tả', 10000) : null;
  if (req.body.status !== undefined) {
    if (!['active', 'inactive'].includes(req.body.status)) throw new HttpError(400, 'Trạng thái cửa hàng không hợp lệ.');
    data.status = req.body.status;
  }
  const updated = await prisma.shops.update({ where: { shop_id: shop.shop_id }, data });
  res.json({ success: true, data: updated });
});
exports.products = action(async (req, res) => {
  const products = await prisma.products.findMany({ where: { shops: { seller_id: req.user.sellerId } }, orderBy: { created_at: 'desc' }, include: { shops: true, product_media: { orderBy: { sort_order: 'asc' } }, product_variants: { orderBy: { variant_id: 'asc' } }, inventories: {orderBy:{inventory_id:'asc'}}, product_category_map: { include: { categories: true } } } });
  res.json({ success: true, data: products.map(p => ({ id: p.product_id, name: p.name, description: p.description, shopId: p.shop_id, shop: p.shops.shop_name, status: p.status, price: Number(p.product_variants[0]?.price || 0), sku: p.product_variants[0]?.sku, variantId:p.product_variants[0]?.variant_id, variantStock:Number(p.inventories.find(inv=>inv.variant_id===p.product_variants[0]?.variant_id)?.quantity||0), stock: p.inventories.reduce((sum, inv) => sum + inv.quantity, 0), image: p.product_media[0]?.url || '', categoryIds: p.product_category_map.map(c => c.category_id), categories: p.product_category_map.map(c => c.categories.name) })) });
});
exports.createProduct = action(async (req, res) => {
  const input = productInput(req.body);
  const shop = req.body.shopId ? await ownShop(req.user.sellerId, req.body.shopId, true) : await prisma.shops.findFirst({ where: { seller_id: req.user.sellerId, status: 'active' } });
  if (!shop) throw new HttpError(400, 'Tạo cửa hàng hoạt động trước khi đăng sản phẩm.');
  const category_id = await categoryId(req.body.categoryId);
  const urls = await saveImages(req.body.images || []);
  const created = await prisma.$transaction(async tx => {
    const product = await tx.products.create({ data: { shop_id: shop.shop_id, name: input.name, description: input.description, status: 'draft' } });
    const variant = await tx.product_variants.create({ data: { product_id: product.product_id, sku: input.sku || `SKU-${product.product_id}-${Date.now()}`, price: String(input.price) } });
    await tx.inventories.create({ data: { product_id: product.product_id, variant_id: variant.variant_id, quantity: input.stock } });
    if (category_id) await tx.product_category_map.create({ data: { product_id: product.product_id, category_id } });
    if (urls.length) await tx.product_media.createMany({ data: urls.map((url, i) => ({ product_id: product.product_id, url, media_type: 'image', is_thumbnail: i === 0, sort_order: i })) });
    return product;
  });
  res.status(201).json({ success: true, data: { id: created.product_id, images: urls }, message: 'Sản phẩm đang chờ Admin duyệt.' });
});
exports.updateProduct = action(async (req, res) => {
  const product = await ownProduct(req.user.sellerId, req.params.id);
  await ownShop(req.user.sellerId, product.shop_id, true);
  if (product.status === 'banned') throw new HttpError(403, 'Sản phẩm đã bị khóa bởi quản trị viên.');
  const input = productInput(req.body);
  const category_id = await categoryId(req.body.categoryId);
  await prisma.$transaction(async tx => {
    await tx.products.update({ where: { product_id: product.product_id }, data: { name: input.name, description: input.description, status: 'draft', updated_at: new Date() } });
    const variant = product.product_variants[0];
    if (!variant) throw new HttpError(400, 'Sản phẩm chưa có phân loại.');
    await tx.product_variants.update({ where: { variant_id: variant.variant_id }, data: { price: String(input.price), ...(input.sku ? { sku: input.sku } : {}) } });
    const inventory = await tx.inventories.findFirst({ where: { variant_id: variant.variant_id },orderBy:{inventory_id:'asc'} });
    if (inventory) await tx.inventories.update({ where: { inventory_id: inventory.inventory_id }, data: { quantity: input.stock } });
    else await tx.inventories.create({ data: { product_id: product.product_id, variant_id: variant.variant_id, quantity: input.stock } });
    await tx.product_category_map.deleteMany({ where: { product_id: product.product_id } });
    if (category_id) await tx.product_category_map.create({ data: { product_id: product.product_id, category_id } });
  });
  res.json({ success: true, message: 'Đã cập nhật. Sản phẩm đang chờ duyệt lại.' });
});
exports.uploadImages = action(async (req, res) => {
  const product = await ownProduct(req.user.sellerId, req.params.productId);
  await ownShop(req.user.sellerId, product.shop_id, true);
  if (product.status === 'banned') throw new HttpError(403, 'Sản phẩm đã bị khóa.');
  const urls = await saveImages(req.body.images || []);
  const count = await prisma.product_media.count({ where: { product_id: product.product_id } });
  await prisma.$transaction(async tx => {
    if (urls.length) await tx.product_media.createMany({ data: urls.map((url, i) => ({ product_id: product.product_id, url, media_type: 'image', is_thumbnail: count === 0 && i === 0, sort_order: count + i })) });
    if (urls.length) await tx.products.update({ where: { product_id: product.product_id }, data: { status: 'draft', updated_at: new Date() } });
  });
  res.json({ success: true, data: urls });
});
exports.productVisibility = action(async (req,res) => {
  if(!['hidden','draft'].includes(req.body.status)) throw new HttpError(400,'Người bán chỉ có thể ẩn hoặc gửi duyệt sản phẩm.');
  const product=await ownProduct(req.user.sellerId,req.params.id);
  await ownShop(req.user.sellerId,product.shop_id,true);
  if(product.status==='banned') throw new HttpError(403,'Sản phẩm đã bị khóa bởi quản trị viên.');
  const data=await prisma.products.update({where:{product_id:product.product_id},data:{status:req.body.status,updated_at:new Date()}});
  res.json({success:true,data});
});
