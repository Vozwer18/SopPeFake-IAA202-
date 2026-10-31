const prisma = require('../config/database');
const { action, id, text, HttpError } = require('../lib/validation');
const { sellerReply } = require('../lib/review-view');

exports.eligibility = action(async (req, res) => {
  const productId = id(req.query.productId, 'Sản phẩm');
  const purchased = { user_id: req.user.userId, order_items: { some: { product_id: productId } } };
  const [eligible, pending, reviewed] = await Promise.all([
    prisma.orders.findMany({ where: { ...purchased, status: 'completed', payments: { payment_status: 'paid' }, reviews: { none: { product_id: productId, user_id: req.user.userId } } }, orderBy: { order_id: 'desc' }, take: 50, select: { order_id: true, order_code: true, created_at: true } }),
    prisma.orders.findFirst({ where: { ...purchased, status: { in: ['pending', 'confirmed', 'packing', 'shipping'] } }, orderBy: { order_id: 'desc' }, select: { order_id: true, order_code: true, status: true } }),
    prisma.reviews.count({ where: { product_id: productId, user_id: req.user.userId, orders: { status: 'completed' } } }),
  ]);
  res.json({ success: true, data: { eligible: eligible.map(order => ({ id: order.order_id, code: order.order_code, createdAt: order.created_at })), pendingOrder: pending ? { id: pending.order_id, code: pending.order_code, status: pending.status } : null, hasReviewed: reviewed > 0 } });
});
exports.sellerReviews = action(async (req, res) => {
  const reviews = await prisma.reviews.findMany({ where: { status: 'visible', products: { shops: { seller_id: req.user.sellerId } } }, orderBy: { review_id: 'desc' },
    include: { users: { select: { full_name: true, username: true } }, products: { select: { product_id: true, name: true, shops: { select: { shop_name: true } } } } },
  });
  res.json({ success: true, data: reviews.map(review => ({ id: review.review_id, productId: review.product_id, productName: review.products.name, shop: review.products.shops.shop_name, userName: review.users.full_name || review.users.username || 'Người mua', rating: review.rating, comment: review.comment, createdAt: review.created_at, sellerReply: sellerReply(review) })) });
});
exports.reply = action(async (req, res) => {
  const reviewId = id(req.params.id, 'Đánh giá'), reply = text(req.body.reply, 'Phản hồi', 2000);
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT review_id FROM reviews WHERE review_id = ${reviewId} FOR UPDATE`;
    const review = await tx.reviews.findFirst({ where: { review_id: reviewId, status: 'visible', products: { shops: { seller_id: req.user.sellerId } } } });
    if (!review) throw new HttpError(404, 'Không tìm thấy đánh giá thuộc shop của bạn.');
    const now = new Date();
    const updated = await tx.reviews.update({ where: { review_id: reviewId }, data: { seller_reply: reply, seller_reply_at: review.seller_reply_at || now, seller_reply_updated_at: now } });
    return { id: updated.review_id, sellerReply: sellerReply(updated) };
  }, { isolationLevel: 'ReadCommitted' });
  res.json({ success: true, data: result });
});
