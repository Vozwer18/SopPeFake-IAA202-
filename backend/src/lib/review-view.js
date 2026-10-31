function sellerReply(review) {
  return review.seller_reply ? { text: review.seller_reply, createdAt: review.seller_reply_at, updatedAt: review.seller_reply_updated_at } : null;
}
module.exports = { sellerReply };
