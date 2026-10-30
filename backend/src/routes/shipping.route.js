const router=require('express').Router();const c=require('../controllers/shipping.controller');
const {requireAuth,requireRole}=require('../middleware/auth.middleware');
router.get('/options',c.getOptions);
router.get('/config',requireAuth,requireRole('seller','admin'),c.getConfig);
module.exports=router;
