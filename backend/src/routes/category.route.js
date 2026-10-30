const r = require('express').Router();
const c = require('../controllers/category.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
r.get('/', c.list);
r.post('/', requireAuth, requireRole('seller', 'admin'), c.create);
module.exports = r;
