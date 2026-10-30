const r=require('express').Router(),c=require('../controllers/admin.controller');
const {requireAuth,requireRole}=require('../middleware/auth.middleware');
r.use(requireAuth,requireRole('admin'));
r.get('/users',c.users);r.post('/users',c.createUser);r.patch('/users/:id',c.updateUser);r.get('/shops',c.shops);r.patch('/shops/:id',c.updateShop);
r.get('/overview',c.overview);r.get('/products',c.products);r.patch('/products/:id/status',c.productStatus);r.post('/products/:id/images',c.uploadImages);r.get('/sellers',c.sellers);r.patch('/sellers/:id/status',c.sellerStatus);r.post('/shipping/providers',c.addProvider);r.post('/shipping/services',c.addService);r.post('/shipping/price-rules',c.addPriceRule);module.exports=r;
