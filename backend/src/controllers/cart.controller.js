const prisma = require('../config/database');
const { action, id, integer, HttpError } = require('../lib/validation');
const { visibleShop, availableStock, mediaOrder } = require('../lib/catalogue');
async function availableVariant(product_id, variant_id, quantity) {
  const variant = await prisma.product_variants.findFirst({
    where: {
      variant_id,
      product_id,
      status: 'active',
      products: { status: 'active', shops: visibleShop },
    },
    include: { inventories: true },
  });
  if (!variant) throw new HttpError(404, 'Sản phẩm không tồn tại hoặc không còn được bán.');
  const stock = availableStock(variant.inventories);
  if (quantity > stock) throw new HttpError(400, 'Số lượng vượt quá tồn kho.');
  return variant;
}
exports.getCart = action(async (req, res) => {
  const cart = await prisma.carts.findFirst({
    where: { user_id: req.user.userId, status: 'active' },
    include: {
      cart_items: {
        orderBy: { cart_item_id: 'asc' },
        include: {
          products: {
            include: {
              product_media: { where: { media_type: 'image' }, orderBy: mediaOrder, take: 1 },
              shops: {
                select: {
                  status: true,
                  sellers: {
                    select: { status: true, users: { select: { status: true, role: true } } },
                  },
                },
              },
            },
          },
          product_variants: { include: { inventories: true } },
        },
      },
    },
  });
  if (cart)
    cart.cart_items = cart.cart_items.map((item) => {
      const { product_media, shops, ...product } = item.products;
      const { inventories, ...variant } = item.product_variants || {};
      const available =
        product.status === 'active' &&
        variant.status === 'active' &&
        shops?.status === 'active' &&
        shops.sellers?.status === 'active' &&
        shops.sellers.users?.status === 'active' &&
        shops.sellers.users.role === 'seller';
      return {
        ...item,
        products: product,
        product_variants: item.product_variants ? variant : null,
        image: variant.image || product_media[0]?.url || '',
        available,
        stock: available ? availableStock(inventories) : 0,
      };
    });
  res.json({ success: true, data: cart || null, message: cart ? 'OK' : 'Cart empty' });
});
exports.addToCart = action(async (req, res) => {
  const product_id = id(req.body.product_id),
    variant_id = id(req.body.variant_id),
    quantity = integer(req.body.quantity ?? 1, 'Số lượng', 1, 10000);
  const variant = await availableVariant(product_id, variant_id, quantity);
  let cart = await prisma.carts.findFirst({
    where: { user_id: req.user.userId, status: 'active' },
  });
  if (!cart)
    cart = await prisma.carts.create({ data: { user_id: req.user.userId, status: 'active' } });
  const exist = await prisma.cart_items.findFirst({
    where: { cart_id: cart.cart_id, product_id, variant_id },
  });
  const total = quantity + Number(exist?.quantity || 0);
  await availableVariant(product_id, variant_id, total);
  if (exist)
    await prisma.cart_items.update({
      where: { cart_item_id: exist.cart_item_id },
      data: { quantity: total },
    });
  else
    await prisma.cart_items.create({
      data: { cart_id: cart.cart_id, product_id, variant_id, quantity, added_price: variant.price },
    });
  res.json({ success: true, message: 'Đã thêm vào giỏ hàng.' });
});
exports.updateItem = action(async (req, res) => {
  const cart_item_id = id(req.params.id),
    quantity = integer(req.body.quantity, 'Số lượng', 1, 10000);
  const item = await prisma.cart_items.findFirst({
    where: { cart_item_id, carts: { user_id: req.user.userId, status: 'active' } },
  });
  if (!item) throw new HttpError(404, 'Không tìm thấy sản phẩm trong giỏ hàng của bạn.');
  await availableVariant(item.product_id, item.variant_id, quantity);
  await prisma.cart_items.update({ where: { cart_item_id }, data: { quantity } });
  res.json({ success: true });
});
exports.removeItem = action(async (req, res) => {
  const cart_item_id = id(req.params.id);
  const item = await prisma.cart_items.findFirst({
    where: { cart_item_id, carts: { user_id: req.user.userId, status: 'active' } },
  });
  if (!item) throw new HttpError(404, 'Không tìm thấy sản phẩm trong giỏ hàng của bạn.');
  await prisma.cart_items.delete({ where: { cart_item_id } });
  res.json({ success: true, message: 'Đã xóa khỏi giỏ hàng.' });
});
