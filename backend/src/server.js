// SopPe Fake uses the original Express / JavaScript / MySQL stack.
const path = require('path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const express = require('express');
const { protectPage, marketplacePage, loginPage } = require('./middleware/auth.middleware');
const app = express();
const FRONTEND = path.join(__dirname,'../../frontend');
app.disable('x-powered-by');
// Enable only when deployed behind one trusted reverse proxy. This lets the
// same-origin guard use the original HTTPS scheme without trusting arbitrary clients.
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use((req,res,next) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  // Cookie-authenticated mutations must originate from this website.
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin) {
    let sameOrigin = false;
    try { const origin = new URL(req.headers.origin); sameOrigin = ['http:','https:'].includes(origin.protocol) && origin.host === req.get('host'); } catch {}
    if (!sameOrigin) return res.status(403).json({success:false,message:'Yêu cầu từ nguồn không được phép.'});
  }
  next();
});
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use((req,res,next)=>{req.body ||= {};next();});
app.use('/products',express.static(path.join(__dirname,'../public/products')));
app.get('/api/health',(req,res)=>res.json({message:'SopPe API running',status:'OK'}));
app.use('/api/auth',require('./routes/auth.route'));
app.use('/api/categories',require('./routes/category.route'));
app.use('/api/products',require('./routes/product.route'));
app.use('/api/shipping',require('./routes/shipping.route'));
app.use('/api/seller',require('./routes/seller.route'));
app.use('/api/admin',require('./routes/admin.route'));
app.use('/api/cart',require('./routes/cart.route'));
app.use('/api/orders',require('./routes/order.route'));
const send = name => (req,res) => res.sendFile(path.join(FRONTEND,name));
app.get(['/','/index.html'],marketplacePage,(req,res)=>res.redirect(req.user?'/user-panel.html':'/guest-panel.html'));
app.get('/guest-panel.html',marketplacePage,send('guest-panel.html'));
app.get('/user-panel.html',protectPage('customer'),send('user-panel.html'));
app.get('/product-list.html',marketplacePage,send('product-list.html'));
app.get('/product-detail.html',marketplacePage,send('product-detail.html'));
app.get('/cart.html',protectPage('customer'),send('cart.html'));
app.get('/seller-panel.html',protectPage('seller'),send('seller-panel.html'));
app.get('/admin-panel.html',protectPage('admin'),send('admin-panel.html'));
app.get('/login.html',loginPage,send('login.html'));
// Serve only asset folders: static aliases cannot bypass the guarded page routes.
for (const folder of ['css','js','assets','images','components']) app.use('/'+folder,express.static(path.join(FRONTEND,folder),{index:false}));
app.use((req,res)=>res.status(404).json({success:false,message:'Không tìm thấy tài nguyên.'}));
app.use((err,req,res,next)=>{
  const status = err.status || (err.code === 'P2025' ? 404 : err.code === 'P2002' ? 409 : err.code === 'P2003' ? 400 : 500);
  if(status===500) console.error(err);
  const message = err.code === 'P2002' ? 'Tên đăng nhập, email hoặc SKU đã tồn tại.' : err.code === 'P2025' ? 'Không tìm thấy dữ liệu.' : err.code === 'P2003' ? 'Dữ liệu liên kết không hợp lệ.' : status===500 ? 'Có lỗi máy chủ. Vui lòng thử lại.' : err.message;
  res.status(status).json({success:false,message});
});
if(require.main===module){const port=Number(process.env.PORT||3000);app.listen(port,'0.0.0.0',()=>console.log(`SopPe Fake running on port ${port}`));}
module.exports=app;
