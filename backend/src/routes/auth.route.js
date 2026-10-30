const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
router.post('/login', c.login);
router.post('/register', c.register);
router.get('/me', requireAuth, c.me);
router.post('/logout', c.logout);
module.exports = router;
