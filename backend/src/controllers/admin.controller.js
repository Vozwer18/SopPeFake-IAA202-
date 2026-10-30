const prisma = require('../config/database');
const { saveImages } = require('./media.util');
const { action, id, text, HttpError } = require('../lib/validation');
const { accountInput, createAccount } = require('../lib/accounts');
const userFields = { user_id:true, username:true, full_name:true, email:true, role:true, status:true, created_at:true };
exports.users = action(async (req, res) => {
  const data = await prisma.users.findMany({ select:userFields, orderBy:{user_id:'desc'} });
  res.json({success:true,data});
});
exports.createUser = action(async (req, res) => {
  const input = await accountInput(req.body);
  const data = await prisma.$transaction(tx => createAccount(tx,input));
  res.status(201).json({success:true,data});
});
exports.updateUser = action(async (req, res) => {
  const user_id = id(req.params.id);
  const existing = await prisma.users.findUnique({where:{user_id}});
  if (!existing) throw new HttpError(404,'Tài khoản không tồn tại.');
  const data = {};
  if (req.body.status !== undefined) {
    if (!['active','blocked','pending'].includes(req.body.status)) throw new HttpError(400,'Trạng thái không hợp lệ.');
    data.status = req.body.status;
  }
  if (req.body.role !== undefined) {
    if (!['customer','seller','admin'].includes(req.body.role)) throw new HttpError(400,'Vai trò không hợp lệ.');
    data.role = req.body.role;
  }
  if (user_id === req.user.userId && ((data.status && data.status !== 'active') || (data.role && data.role !== 'admin'))) throw new HttpError(400,'Không thể tự khóa hoặc hạ quyền tài khoản quản trị đang đăng nhập.');
  const updated = await prisma.$transaction(async tx => {
    // Serialize administrator changes so simultaneous mutual demotions cannot
    // remove every active administrator after both requests pass middleware.
    const admins = await tx.$queryRaw`SELECT user_id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY user_id FOR UPDATE`;
    if (!admins.some(user => user.user_id === req.user.userId)) throw new HttpError(403, 'Quyền quản trị của phiên này đã thay đổi.');
    const target = await tx.users.findUnique({where:{user_id}});
    if (!target) throw new HttpError(404, 'Tài khoản không tồn tại.');
    if (target.role === 'admin' && target.status === 'active' && ((data.status && data.status !== 'active') || (data.role && data.role !== 'admin')) && admins.length <= 1) throw new HttpError(400, 'Cần giữ ít nhất một quản trị viên hoạt động.');
    if (data.role === 'seller') {
      const seller = await tx.sellers.findUnique({where:{user_id}});
      if (!seller) await tx.sellers.create({data:{user_id,seller_name:existing.full_name,email_business:existing.email,status:'active'}});
    }
    return tx.users.update({where:{user_id},data,select:userFields});
  });
  res.json({success:true,data:updated});
});
exports.shops = action(async (req,res) => {
  const data = await prisma.shops.findMany({orderBy:{shop_id:'desc'},include:{sellers:{select:{seller_id:true,seller_name:true,status:true,users:{select:{user_id:true,username:true,email:true}}}}}});
  res.json({success:true,data});
});
exports.updateShop = action(async (req,res) => {
  const shop_id=id(req.params.id),data={};
  if (!await prisma.shops.findUnique({where:{shop_id}})) throw new HttpError(404,'Cửa hàng không tồn tại.');
  if (req.body.status !== undefined) {
    if (!['active','inactive','banned'].includes(req.body.status)) throw new HttpError(400,'Trạng thái cửa hàng không hợp lệ.');
    data.status=req.body.status;
  }
  if(req.body.shopName!==undefined) data.shop_name=text(req.body.shopName,'Tên cửa hàng',150);
  if(req.body.description!==undefined) data.description=req.body.description?text(req.body.description,'Mô tả',10000):null;
  const updated=await prisma.shops.update({where:{shop_id},data});
  res.json({success:true,data:updated});
});
exports.overview = action(async (req,res) => {
  const [users,sellers,products,orders,pending] = await Promise.all([prisma.users.count(),prisma.sellers.count(),prisma.products.count(),prisma.orders.count(),prisma.products.count({where:{status:'draft'}})]);
  res.json({success:true,data:{users,sellers,products,orders,pending}});
});
exports.products = action(async (req,res) => {
  const products=await prisma.products.findMany({orderBy:{created_at:'desc'},include:{shops:true,product_media:{take:1,orderBy:{sort_order:'asc'}},product_variants:{take:1,orderBy:{variant_id:'asc'}}}});
  res.json({success:true,data:products.map(p=>({id:p.product_id,name:p.name,shop:p.shops?.shop_name,status:p.status,price:Number(p.product_variants[0]?.price||0),image:p.product_media[0]?.url||'',createdAt:p.created_at}))});
});
exports.productStatus = action(async (req,res) => {
  if(!['draft','active','hidden','banned'].includes(req.body.status)) throw new HttpError(400,'Trạng thái sản phẩm không hợp lệ.');
  const data=await prisma.products.update({where:{product_id:id(req.params.id)},data:{status:req.body.status,updated_at:new Date()}});
  res.json({success:true,data});
});
exports.sellers = action(async (req,res) => {
  const data=await prisma.sellers.findMany({orderBy:{created_at:'desc'},include:{users:{select:{full_name:true,email:true}},shops:true}});
  res.json({success:true,data});
});
exports.sellerStatus = action(async (req,res) => {
  if(!['pending','active','suspended'].includes(req.body.status)) throw new HttpError(400,'Trạng thái người bán không hợp lệ.');
  const data=await prisma.sellers.update({where:{seller_id:id(req.params.id)},data:{status:req.body.status}});
  res.json({success:true,data});
});
exports.uploadImages = action(async (req,res) => {
  const product_id=id(req.params.id);
  if(!await prisma.products.findUnique({where:{product_id}})) throw new HttpError(404,'Sản phẩm không tồn tại.');
  const urls=saveImages(req.body.images||[]);
  const count=await prisma.product_media.count({where:{product_id}});
  if(urls.length) await prisma.product_media.createMany({data:urls.map((url,i)=>({product_id,url,media_type:'image',is_thumbnail:count===0&&i===0,sort_order:count+i}))});
  res.json({success:true,data:urls});
});
exports.addProvider = action(async (req,res) => {
  const data=await prisma.shipping_providers.create({data:{name:text(req.body.name,'Tên đơn vị vận chuyển',100),hotline:req.body.hotline?text(req.body.hotline,'Hotline',20):null,status:'active'}});
  res.status(201).json({success:true,data});
});
exports.addService = action(async (req,res) => {
  const {integer}=require('../lib/validation');
  const service_type=req.body.serviceType||'normal';
  if(!['normal','fast','express'].includes(service_type)) throw new HttpError(400,'Loại dịch vụ không hợp lệ.');
  const data=await prisma.shipping_services.create({data:{provider_id:id(req.body.providerId),service_name:text(req.body.serviceName,'Tên dịch vụ',100),service_type,base_fee:String(integer(req.body.baseFee??0,'Phí cơ bản',0,999999999999)),estimated_days:integer(req.body.estimatedDays??0,'Số ngày giao hàng',0,365)}});
  res.status(201).json({success:true,data});
});
exports.addPriceRule = action(async (req,res) => {
  const {integer}=require('../lib/validation');
  const min=Number(req.body.minWeight??0),max=Number(req.body.maxWeight??999);
  if(!Number.isFinite(min)||!Number.isFinite(max)||min<0||max<min||max>99999) throw new HttpError(400,'Khoảng trọng lượng không hợp lệ.');
  if(!['same','near','medium','far','very_far'].includes(req.body.distanceLevel)) throw new HttpError(400,'Khoảng cách không hợp lệ.');
  const data=await prisma.shipping_price_rules.create({data:{service_id:id(req.body.serviceId),distance_level:req.body.distanceLevel,min_weight:String(min),max_weight:String(max),price:String(integer(req.body.price??0,'Giá',0,999999999999))}});
  res.status(201).json({success:true,data});
});
