const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('crypto');
const prisma = require('../config/database');
const { secret, cookie } = require('../config/auth');
const { pageForRole } = require('../middleware/auth.middleware');
const { action, HttpError } = require('../lib/validation');
const { accountInput, createAccount } = require('../lib/accounts');
function publicUser(user, seller) {
  return { id: user.user_id, username: user.username, fullName: user.full_name, email: user.email, role: user.role, sellerId: seller?.seller_id || null, sellerStatus: seller?.status || null };
}
exports.login = action(async (req, res) => {
  const login = String(req.body.login || req.body.email || req.body.username || '').trim();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!login || !password) throw new HttpError(400, 'Vui lòng nhập tài khoản/email và mật khẩu.');
  if (login.length > 100 || Buffer.byteLength(password) > 72) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng.');
  const user = await prisma.users.findFirst({ where: { OR: [{ email: login }, { username: login }] }, include: { sellers: true } });
  if (!user) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng.');
  let valid;
  if (user.password_hash.startsWith('$2')) valid = await bcrypt.compare(password, user.password_hash);
  else {
    // Migrate only authenticated legacy seed passwords; all new accounts use bcrypt.
    const supplied = Buffer.from(password), saved = Buffer.from(user.password_hash);
    valid = supplied.length === saved.length && timingSafeEqual(supplied, saved);
    if (valid) await prisma.users.update({ where: { user_id: user.user_id }, data: { password_hash: await bcrypt.hash(password, 12) } });
  }
  if (!valid) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng.');
  if (user.status !== 'active') throw new HttpError(403, 'Tài khoản hiện không hoạt động.');
  if (user.role === 'seller' && (!user.sellers || user.sellers.status !== 'active')) throw new HttpError(403, 'Tài khoản người bán đang chờ duyệt hoặc bị tạm khóa.');
  const payload = publicUser(user, user.sellers);
  const token = jwt.sign({ userId: payload.id }, secret, { algorithm: 'HS256', expiresIn: '7d' });
  res.cookie('soppe_token', token, { ...cookie, maxAge: 7 * 24 * 60 * 60 * 1000 });
  await prisma.users.update({ where: { user_id: user.user_id }, data: { last_login: new Date() } });
  res.json({ success: true, data: payload, redirect: pageForRole(payload.role) });
});
exports.me = action(async (req, res) => {
  const user = await prisma.users.findUnique({ where: { user_id: req.user.userId }, include: { sellers: true } });
  if (!user || user.status !== 'active') throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ.');
  res.json({ success: true, data: publicUser(user, user.sellers) });
});
exports.logout = (req, res) => {
  res.clearCookie('soppe_token', cookie);
  res.json({ success: true, message: 'Đã đăng xuất.' });
};
exports.register = action(async (req, res) => {
  const input = await accountInput(req.body, ['customer', 'seller']);
  const account = await prisma.$transaction(tx => createAccount(tx, input, 'pending'));
  res.status(201).json({ success: true, data: account, message: input.role === 'seller' ? 'Đăng ký thành công. Tài khoản người bán đang chờ Admin duyệt.' : 'Đăng ký thành công. Bạn có thể đăng nhập.' });
});
