const r=require('express').Router();
const c=require('../controllers/order.controller');
const {requireAuth,requireRole}=require('../middleware/auth.middleware');
r.use(requireAuth,requireRole('customer'));
r.get('/',c.customerOrders);r.post('/',c.checkout);r.patch('/:id/cancel',c.cancel);
module.exports=r;
