const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { secret } = require('../config/auth');
function decode(req) {
  try {
    const authorization = req.headers.authorization || '';
    const match = (req.headers.cookie || '').match(/(?:^|;\s*)soppe_token=([^;]+)/);
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : match ? decodeURIComponent(match[1]) : null;
    return token ? jwt.verify(token, secret, { algorithms: ['HS256'] }) : null;
  } catch { return null; }
}
async function currentUser(req) {
  const token = decode(req);
  if (!token || !Number.isSafeInteger(token.userId) || token.userId < 1) return null;
  const user = await prisma.users.findUnique({ where: { user_id: token.userId }, include: { sellers: true } });
  if (!user || user.status !== 'active') return null;
  if (user.role === 'seller' && (!user.sellers || user.sellers.status !== 'active')) return null;
  return { userId: user.user_id, role: user.role, sellerId: user.sellers?.seller_id || null };
}
async function requireAuth(req, res, next) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để thực hiện chức năng này.', code: 'AUTH_REQUIRED' });
    req.user = user;
    next();
  } catch (e) { next(e); }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này.', code: 'FORBIDDEN' });
    next();
  };
}
function pageForRole(role) { return role === 'admin' ? '/admin-panel.html' : role === 'seller' ? '/seller-panel.html' : '/user-panel.html'; }
function protectPage(role) {
  return async (req, res, next) => {
    try {
      const user = await currentUser(req);
      if (!user) return res.redirect('/login.html?next=' + encodeURIComponent(req.originalUrl));
      if (user.role !== role) return res.redirect(pageForRole(user.role));
      req.user = user;
      next();
    } catch (e) { next(e); }
  };
}
async function marketplacePage(req, res, next) {
  try {
    const user = await currentUser(req);
    if (user && user.role !== 'customer') return res.redirect(pageForRole(user.role));
    if (user) req.user = user;
    next();
  } catch (e) { next(e); }
}
async function loginPage(req, res, next) {
  try {
    const user = await currentUser(req);
    if (user) return res.redirect(pageForRole(user.role));
    next();
  } catch (e) { next(e); }
}
module.exports = { requireAuth, requireRole, protectPage, marketplacePage, loginPage, pageForRole };
