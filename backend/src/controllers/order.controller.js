const { randomBytes } = require('node:crypto');
const prisma = require('../config/database');
const { action, id, text, integer, HttpError } = require('../lib/validation');
const { availableStock } = require('../lib/catalogue');
const { lockCustomer, lockStock, releaseReserved } = require('../lib/order-workflow');
const { sellerReply } = require('../lib/review-view');
const includeOrder = {
  addresses: true, payments: true, reviews: true,
  order_items: { orderBy: { order_item_id: 'asc' }, include: { shops: { select: { shop_id: true, shop_name: true, seller_id: true } } } },
};
function present(order) {
  const reviewed = new Map(order.reviews.map(review => [review.product_id, review]));
  const paid = order.payments?.payment_status === 'paid';
  const qrOrder = Boolean(order.checkout_token);
  const address = order.addresses;
  return {
    id: order.order_id, code: order.order_code, status: order.status, createdAt: order.created_at,
    shop: order.order_items[0]?.shops?.shop_name || '', total: Number(order.total_amount), subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee || 0), note: order.note, qrUrl: order.payment_qr_url,
    paymentStatus: order.payments?.payment_status || 'pending', paidAt: order.payments?.paid_at,
    address: { name: address.receiver_name, phone: address.receiver_phone, province: address.province, district: address.district, ward: address.ward, detail: address.detail_address },
    canCancel: qrOrder && order.status === 'pending' && !paid,
    canReceive: qrOrder && order.status === 'shipping' && paid,
    canConfirmPayment: qrOrder && order.status === 'pending' && !paid,
    canShip: qrOrder && paid && ['confirmed', 'packing'].includes(order.status),
    items: order.order_items.map(item => {
      const review = reviewed.get(item.product_id);
      return { id: item.order_item_id, productId: item.product_id, variantId: item.variant_id, name: item.product_name, sku: item.variant_name, quantity: item.quantity, price: Number(item.price), subtotal: Number(item.subtotal), canReview: order.status === 'completed' && paid && !review, review: review ? { id: review.review_id, rating: review.rating, comment: review.comment, sellerReply: sellerReply(review) } : null };
    }),
  };
}
async function ownedOrder(tx, orderId, actor, seller = false) {
  await tx.$queryRaw`SELECT order_id FROM orders WHERE order_id = ${orderId} FOR UPDATE`;
  const order = await tx.orders.findUnique({ where: { order_id: orderId }, include: includeOrder });
  const allowed = order && (seller
    ? order.order_items.length > 0 && order.order_items.every(item => item.shops.seller_id === actor.sellerId)
    : order.user_id === actor.userId);
  if (!allowed) throw new HttpError(404, 'Không tìm thấy đơn hàng của bạn.');
  return order;
}
function shippingAddress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Nhập địa chỉ nhận hàng.');
  const phone = text(value.phone, 'Số điện thoại', 20);
  if (!/^[+0-9][0-9 .()-]{7,19}$/.test(phone)) throw new HttpError(400, 'Số điện thoại không hợp lệ.');
  return { receiver_name: text(value.name, 'Tên người nhận', 100), receiver_phone: phone,
    province: text(value.province, 'Tỉnh/thành phố', 100), district: text(value.district, 'Quận/huyện', 100),
    ward: text(value.ward, 'Phường/xã', 100), detail_address: text(value.detail, 'Địa chỉ cụ thể', 255) };
}

exports.checkout = action(async (req, res) => {
  const cartId = id(req.body.cartId, 'Giỏ hàng'), key = text(req.body.checkoutKey, 'Mã đặt hàng', 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) throw new HttpError(400, 'Mã đặt hàng không hợp lệ.');
  const address = shippingAddress(req.body.address), note = req.body.note ? text(req.body.note, 'Ghi chú', 1000) : null;
  const prefix = `${req.user.userId}:${key}:`;
  const result = await prisma.$transaction(async tx => {
    await lockCustomer(tx, req.user.userId);
    const cart = await tx.carts.findFirst({ where: { cart_id: cartId, user_id: req.user.userId }, include: { cart_items: { orderBy: { cart_item_id: 'asc' } } } });
    if (!cart) throw new HttpError(404, 'Không tìm thấy giỏ hàng của bạn.');
    const previous = await tx.orders.findMany({ where: { user_id: req.user.userId, checkout_token: { startsWith: prefix } }, include: includeOrder, orderBy: { order_id: 'asc' } });
    if (previous.length) return { orders: previous.map(present), replayed: true };
    if (cart.status !== 'active') throw new HttpError(409, 'Giỏ hàng này đã được đặt. Hãy xem mục Đơn hàng.');
    if (!cart.cart_items.length || cart.cart_items.length > 100) throw new HttpError(400, 'Giỏ hàng cần từ 1 đến 100 dòng sản phẩm.');
    const selected = new Map();
    for (const item of cart.cart_items) {
      const variantId = id(item.variant_id, 'SKU'), quantity = integer(item.quantity, 'Số lượng', 1, 10000);
      const existing = selected.get(variantId);
      if (existing && existing.productId !== item.product_id) throw new HttpError(409, 'Sản phẩm trong giỏ không hợp lệ.');
      selected.set(variantId, { variantId, productId: item.product_id, quantity: integer(quantity + (existing?.quantity || 0), 'Tổng số lượng SKU', 1, 10000) });
    }
    const chosen = [...selected.values()];
    await lockStock(tx, chosen.map(item => item.productId), chosen.map(item => item.variantId));
    const variants = await tx.product_variants.findMany({ where: { variant_id: { in: chosen.map(item => item.variantId) } }, include: {
      inventories: { orderBy: { inventory_id: 'asc' } },
      products: { include: { shops: { include: { sellers: { include: { users: { select: { role: true, status: true } } } } } } } },
    } });
    const byId = new Map(variants.map(variant => [variant.variant_id, variant])), groups = new Map();
    for (const item of chosen) {
      const variant = byId.get(item.variantId), product = variant?.products, shop = product?.shops;
      if (!variant || variant.product_id !== item.productId || variant.status !== 'active' || product.status !== 'active' || shop.status !== 'active' || shop.sellers.status !== 'active' || shop.sellers.users.status !== 'active' || shop.sellers.users.role !== 'seller') throw new HttpError(409, 'Một sản phẩm trong giỏ đã ngừng bán. Hãy cập nhật giỏ hàng.');
      if (availableStock(variant.inventories) < item.quantity) throw new HttpError(409, `SKU ${variant.sku || variant.variant_id} không đủ tồn kho.`);
      if (!shop.payment_qr_url) throw new HttpError(409, `Shop ${shop.shop_name} chưa cập nhật QR thanh toán.`);
      const price = BigInt(variant.price.toFixed(0));
      if (price < 1n || price > 999999999999n) throw new HttpError(409, 'Giá SKU không hợp lệ, hãy liên hệ shop cập nhật.');
      const subtotal = price * BigInt(item.quantity);
      const group = groups.get(shop.shop_id) || { shop, items: [], total: 0n };
      group.total += subtotal;
      if (group.total > 999999999999n) throw new HttpError(400, 'Tổng tiền đơn hàng vượt giới hạn cho phép.');
      group.items.push({ ...item, variant, product, subtotal }); groups.set(shop.shop_id, group);
    }
    const delivery = await tx.addresses.create({ data: { user_id: req.user.userId, ...address } });
    const created = [];
    for (const [shopId, group] of groups) {
      const code = `SP-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const order = await tx.orders.create({ data: { order_code: code, user_id: req.user.userId, address_id: delivery.address_id,
        subtotal: group.total.toString(), total_amount: group.total.toString(), shipping_fee: '0', status: 'pending', note,
        payment_qr_url: group.shop.payment_qr_url, checkout_token: prefix + shopId,
        payments: { create: { payment_method: 'BANK', payment_status: 'pending', amount: group.total.toString() } },
        order_items: { create: group.items.map(item => ({ product_id: item.productId, variant_id: item.variantId, shop_id: shopId,
          product_name: item.product.name, variant_name: item.variant.sku, quantity: item.quantity, price: item.variant.price, subtotal: item.subtotal.toString() })) },
        order_status_history: { create: { old_status: null, new_status: 'pending', note: 'Đặt hàng, chờ shop xác nhận chuyển khoản QR.' } },
      } });
      for (const item of group.items) {
        let left = item.quantity;
        for (const inventory of item.variant.inventories) {
          const take = Math.min(left, Math.max(0, Number(inventory.quantity || 0) - Number(inventory.reserved_quantity || 0)));
          if (take) await tx.inventories.update({ where: { inventory_id: inventory.inventory_id }, data: { reserved_quantity: Number(inventory.reserved_quantity || 0) + take, updated_at: new Date() } });
          left -= take; if (!left) break;
        }
        if (left) throw new HttpError(409, 'Không đủ tồn kho để giữ hàng.');
      }
      created.push(present(await tx.orders.findUnique({ where: { order_id: order.order_id }, include: includeOrder })));
    }
    await tx.carts.update({ where: { cart_id: cartId }, data: { status: 'checked_out', updated_at: new Date() } });
    return { orders: created, replayed: false };
  }, { isolationLevel: 'ReadCommitted', timeout: 20000 });
  res.status(result.replayed ? 200 : 201).json({ success: true, data: result });
});

exports.customerOrders = action(async (req, res) => {
  const orders = await prisma.orders.findMany({ where: { user_id: req.user.userId }, orderBy: { order_id: 'desc' }, take: 100, include: includeOrder });
  res.json({ success: true, data: orders.map(present) });
});
exports.sellerOrders = action(async (req, res) => {
  const own = { shops: { seller_id: req.user.sellerId } };
  const orders = await prisma.orders.findMany({ where: { order_items: { some: own, every: own } }, orderBy: { order_id: 'desc' }, take: 100, include: includeOrder });
  res.json({ success: true, data: orders.map(present) });
});
exports.sellerAction = action(async (req, res) => {
  const orderId = id(req.params.id), command = req.params.action;
  if (!['paid', 'shipped'].includes(command)) throw new HttpError(400, 'Thao tác đơn hàng không hợp lệ.');
  const result = await prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, orderId, req.user, true);
    if (!order.checkout_token) throw new HttpError(409, 'Đơn cũ không thuộc luồng QR mới; không tự thay đổi thanh toán hoặc tồn kho.');
    if (['cancelled', 'refund'].includes(order.status)) throw new HttpError(409, 'Không thể cập nhật đơn đã hủy/hoàn tiền.');
    const paid = order.payments?.payment_status === 'paid';
    if (command === 'paid' && paid) return present(order);
    if (command === 'shipped' && ['shipping', 'completed'].includes(order.status) && paid) return present(order);
    const next = command === 'paid' ? 'confirmed' : 'shipping';
    if (command === 'paid') {
      if (order.status !== 'pending' || !order.payments) throw new HttpError(409, 'Đơn không ở trạng thái chờ thanh toán.');
      await tx.payments.update({ where: { order_id: orderId }, data: { payment_status: 'paid', paid_at: new Date() } });
    } else {
      if (!paid || !['confirmed', 'packing'].includes(order.status)) throw new HttpError(409, 'Cần xác nhận đã nhận thanh toán trước khi gửi hàng.');
      if (order.order_items.some(item => !item.variant_id)) throw new HttpError(409, 'Đơn cũ thiếu SKU, không thể tự cập nhật tồn kho.');
      await lockStock(tx, order.order_items.map(item => item.product_id), order.order_items.map(item => item.variant_id));
      for (const item of order.order_items) await releaseReserved(tx, item.variant_id, item.quantity, true);
    }
    await tx.orders.update({ where: { order_id: orderId }, data: { status: next, updated_at: new Date() } });
    await tx.order_status_history.create({ data: { order_id: orderId, old_status: order.status, new_status: next, note: command === 'paid' ? 'Shop xác nhận đã nhận thanh toán.' : 'Shop xác nhận hàng đã gửi.' } });
    return present(await tx.orders.findUnique({ where: { order_id: orderId }, include: includeOrder }));
  }, { isolationLevel: 'ReadCommitted' });
  res.json({ success: true, data: result });
});
exports.customerAction = action(async (req, res) => {
  const orderId = id(req.params.id), command = req.params.action;
  if (!['received', 'cancel'].includes(command)) throw new HttpError(400, 'Thao tác đơn hàng không hợp lệ.');
  const result = await prisma.$transaction(async tx => {
    await lockCustomer(tx, req.user.userId);
    const order = await ownedOrder(tx, orderId, req.user);
    if (!order.checkout_token) throw new HttpError(409, 'Đơn cũ không thuộc luồng QR mới; không tự thay đổi tồn kho.');
    const next = command === 'received' ? 'completed' : 'cancelled';
    if (order.status === next) return present(order);
    if (command === 'received') {
      if (order.status !== 'shipping' || order.payments?.payment_status !== 'paid') throw new HttpError(409, 'Chỉ xác nhận nhận hàng sau khi shop đã nhận thanh toán và gửi hàng.');
      for (const item of [...order.order_items].sort((a, b) => a.product_id - b.product_id)) await tx.$executeRaw`UPDATE products SET sold_quantity = COALESCE(sold_quantity, 0) + ${item.quantity} WHERE product_id = ${item.product_id}`;
    } else {
      if (order.status !== 'pending' || order.payments?.payment_status === 'paid') throw new HttpError(409, 'Chỉ hủy đơn chưa được xác nhận thanh toán.');
      if (order.order_items.some(item => !item.variant_id)) throw new HttpError(409, 'Đơn cũ thiếu SKU, không thể tự cập nhật tồn kho.');
      await lockStock(tx, order.order_items.map(item => item.product_id), order.order_items.map(item => item.variant_id));
      for (const item of order.order_items) await releaseReserved(tx, item.variant_id, item.quantity);
    }
    await tx.orders.update({ where: { order_id: orderId }, data: { status: next, updated_at: new Date() } });
    await tx.order_status_history.create({ data: { order_id: orderId, old_status: order.status, new_status: next, note: command === 'received' ? 'Người mua xác nhận đã nhận hàng.' : 'Người mua hủy đơn chưa thanh toán.' } });
    return present(await tx.orders.findUnique({ where: { order_id: orderId }, include: includeOrder }));
  }, { isolationLevel: 'ReadCommitted' });
  res.json({ success: true, data: result });
});
exports.review = action(async (req, res) => {
  const orderId = id(req.params.id), productId = id(req.body.productId), rating = integer(req.body.rating, 'Số sao', 1, 5);
  const comment = req.body.comment ? text(req.body.comment, 'Đánh giá', 2000) : null;
  const result = await prisma.$transaction(async tx => {
    await lockCustomer(tx, req.user.userId);
    const order = await ownedOrder(tx, orderId, req.user);
    if (order.status !== 'completed' || order.payments?.payment_status !== 'paid') throw new HttpError(403, 'Bạn chỉ được đánh giá sau khi xác nhận đã nhận hàng.');
    const item = order.order_items.find(item => item.product_id === productId);
    if (!item) throw new HttpError(403, 'Sản phẩm không thuộc đơn hàng đã nhận.');
    if (order.reviews.some(review => review.product_id === productId)) throw new HttpError(409, 'Bạn đã đánh giá sản phẩm trong đơn này.');
    await tx.$queryRaw`SELECT product_id FROM products WHERE product_id = ${productId} FOR UPDATE`;
    await tx.$queryRaw`SELECT shop_id FROM shops WHERE shop_id = ${item.shop_id} FOR UPDATE`;
    const review = await tx.reviews.create({ data: { user_id: req.user.userId, product_id: productId, order_id: orderId, rating, comment, status: 'visible' } });
    const productRating = await tx.reviews.aggregate({ where: { product_id: productId, status: 'visible' }, _avg: { rating: true } });
    const shopRating = await tx.reviews.aggregate({ where: { products: { shop_id: item.shop_id }, status: 'visible' }, _avg: { rating: true } });
    await tx.products.update({ where: { product_id: productId }, data: { rating: productRating._avg.rating.toFixed(1) } });
    await tx.shops.update({ where: { shop_id: item.shop_id }, data: { rating: shopRating._avg.rating.toFixed(1) } });
    return { id: review.review_id, rating: review.rating, comment: review.comment };
  }, { isolationLevel: 'ReadCommitted' });
  res.status(201).json({ success: true, data: result });
});
