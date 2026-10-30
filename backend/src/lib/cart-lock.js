const { HttpError } = require('./validation');
// Serialize a customer's cart changes and checkout without relying on a
// process-local lock; this also covers two browser tabs and multiple servers.
async function lockCustomer(tx, userId) {
  const users = await tx.$queryRaw`SELECT user_id, role, status FROM users WHERE user_id = ${userId} FOR UPDATE`;
  if (!users[0] || users[0].role !== 'customer' || users[0].status !== 'active') throw new HttpError(403, 'Tài khoản không có quyền mua hàng.');
}
module.exports = { lockCustomer };
