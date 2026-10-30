const bcrypt = require('bcrypt');
const { text, HttpError } = require('./validation');
async function accountInput(body, roles = ['customer', 'seller', 'admin']) {
  const username = text(body.username, 'Tên đăng nhập', 50);
  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) throw new HttpError(400, 'Tên đăng nhập cần ít nhất 3 ký tự và không chứa khoảng trắng.');
  const email = text(body.email, 'Email', 100).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email không hợp lệ.');
  if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password) > 72) throw new HttpError(400, 'Mật khẩu cần ít nhất 8 ký tự, tối đa 72 byte.');
  const role = body.role || 'customer';
  if (!roles.includes(role)) throw new HttpError(400, 'Vai trò không hợp lệ.');
  return { username, email, full_name: text(body.fullName, 'Họ và tên', 100), password_hash: await bcrypt.hash(body.password, 12), role, status: 'active' };
}
async function createAccount(tx, data, sellerStatus = 'active') {
  const user = await tx.users.create({ data });
  if (data.role === 'seller') await tx.sellers.create({ data: { user_id: user.user_id, seller_name: user.full_name, email_business: user.email, status: sellerStatus } });
  return { user_id: user.user_id, username: user.username, full_name: user.full_name, email: user.email, role: user.role, status: user.status };
}
module.exports = { accountInput, createAccount };
