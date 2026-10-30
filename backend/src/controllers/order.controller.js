const { randomUUID } = require('crypto');
const prisma = require('../config/database');
const { action, id, text, integer, HttpError } = require('../lib/validation');
const { lockCustomer } = require('../lib/cart-lock');
const activeShop = { status:'active', sellers:{ status:'active', users:{ status:'active',role:'seller' } } };
const include = { order_items:{include:{shops:{select:{shop_name:true}}},orderBy:{order_item_id:'asc'}}, addresses:true,payments:true };
const transitions = { pending:['confirmed','cancelled'], confirmed:['packing','cancelled'], packing:['shipping','cancelled'], shipping:['completed'], completed:[], cancelled:[], refund:[] };
function publicOrder(order, sellerOnly=false) {
  const items = order.order_items.map(item => ({ id:item.order_item_id,productId:item.product_id,name:item.product_name,sku:item.variant_name,quantity:item.quantity,price:Number(item.price),subtotal:Number(item.subtotal) }));
  const subtotal = sellerOnly ? items.reduce((sum,item)=>sum+item.subtotal,0) : Number(order.subtotal);
  return {
    id:order.order_id,code:order.order_code,status:order.status,createdAt:order.created_at,
    subtotal,shippingFee:sellerOnly?0:Number(order.shipping_fee),total:sellerOnly?subtotal:Number(order.total_amount),
    paymentMethod:order.payments?.payment_method||'COD',paymentStatus:order.payments?.payment_status||'pending',
    shopName:order.order_items[0]?.shops?.shop_name||'',note:order.note,items,
    address:order.addresses?{receiverName:order.addresses.receiver_name,receiverPhone:order.addresses.receiver_phone,province:order.addresses.province,district:order.addresses.district,ward:order.addresses.ward,detailAddress:order.addresses.detail_address}:null,
  };
}
function delivery(body) {
  const receiver_phone = text(body.receiverPhone,'Số điện thoại',20);
  if (!/^[+\d][\d\s().-]{6,19}$/.test(receiver_phone)) throw new HttpError(400,'Số điện thoại nhận hàng không hợp lệ.');
  return { receiver_name:text(body.receiverName,'Tên người nhận',100),receiver_phone,province:text(body.province,'Tỉnh/thành phố',100),district:text(body.district,'Quận/huyện',100),ward:text(body.ward,'Phường/xã',100),detail_address:text(body.detailAddress,'Địa chỉ chi tiết',255) };
}
async function lockStock(tx, variantId) {
  return tx.$queryRaw`SELECT inventory_id, product_id, variant_id, quantity, reserved_quantity FROM inventories WHERE variant_id = ${variantId} ORDER BY inventory_id FOR UPDATE`;
}
async function takeStock(tx, variantId, quantity) {
  const stock = await lockStock(tx,variantId);
  const available = stock.reduce((sum,row)=>sum+Math.max(0,Number(row.quantity||0)-Number(row.reserved_quantity||0)),0);
  if (quantity>available) throw new HttpError(409,'Tồn kho đã thay đổi. Vui lòng cập nhật giỏ hàng.');
  let remaining=quantity;
  for(const row of stock){
    const take=Math.min(remaining,Math.max(0,Number(row.quantity||0)-Number(row.reserved_quantity||0)));
    if(take) await tx.inventories.update({where:{inventory_id:row.inventory_id},data:{quantity:{decrement:take}}});
    remaining-=take;
    if(!remaining) break;
  }
}
exports.checkout = action(async(req,res)=>{
  const address=delivery(req.body),note=req.body.note?text(req.body.note,'Ghi chú',2000):null;
  const orders=await prisma.$transaction(async tx=>{
    await lockCustomer(tx,req.user.userId);
    const cart=await tx.carts.findFirst({where:{user_id:req.user.userId,status:'active'},orderBy:{cart_id:'asc'},include:{cart_items:{orderBy:{variant_id:'asc'}}}});
    if(!cart?.cart_items.length) throw new HttpError(400,'Giỏ hàng đang trống.');
    if(cart.cart_items.length>100) throw new HttpError(400,'Tối đa 100 dòng sản phẩm cho một lần đặt hàng.');
    const lines=[];
    for(const item of cart.cart_items){
      const quantity=integer(item.quantity,'Số lượng',1,10000);
      const variant=await tx.product_variants.findFirst({where:{variant_id:item.variant_id,product_id:item.product_id,status:'active',products:{status:'active',shops:activeShop}},include:{products:{include:{shops:true}}}});
      if(!variant) throw new HttpError(409,'Có sản phẩm không còn được bán. Vui lòng cập nhật giỏ hàng.');
      const price=integer(Number(variant.price),'Giá sản phẩm',1,999999999999);
      if(price*quantity>999999999999) throw new HttpError(400,'Giá trị đơn hàng vượt giới hạn.');
      await takeStock(tx,variant.variant_id,quantity);
      lines.push({shopId:variant.products.shop_id,productId:variant.product_id,variantId:variant.variant_id,name:variant.products.name,sku:variant.sku,quantity,price,subtotal:price*quantity});
    }
    const savedAddress=await tx.addresses.create({data:{user_id:req.user.userId,...address}});
    const groups=new Map();
    for(const line of lines){if(!groups.has(line.shopId)) groups.set(line.shopId,[]);groups.get(line.shopId).push(line);}
    const created=[];
    for(const shopLines of groups.values()){
      const subtotal=shopLines.reduce((sum,line)=>sum+line.subtotal,0);
      if(subtotal>999999999999) throw new HttpError(400,'Giá trị đơn hàng vượt giới hạn.');
      const order=await tx.orders.create({data:{order_code:'SP-'+randomUUID(),user_id:req.user.userId,address_id:savedAddress.address_id,subtotal:String(subtotal),shipping_fee:'0',discount_amount:'0',total_amount:String(subtotal),status:'pending',note}});
      await tx.order_items.createMany({data:shopLines.map(line=>({order_id:order.order_id,shop_id:line.shopId,product_id:line.productId,variant_id:line.variantId,product_name:line.name,variant_name:line.sku,quantity:line.quantity,price:String(line.price),subtotal:String(line.subtotal)}))});
      await tx.payments.create({data:{order_id:order.order_id,payment_method:'COD',amount:String(subtotal),payment_status:'pending'}});
      await tx.order_status_history.create({data:{order_id:order.order_id,new_status:'pending',note:'Đặt hàng COD từ giỏ hàng.'}});
      created.push(publicOrder(await tx.orders.findUnique({where:{order_id:order.order_id},include})));
    }
    await tx.cart_items.deleteMany({where:{cart_id:cart.cart_id}});
    return created;
  },{maxWait:10000,timeout:20000});
  res.status(201).json({success:true,data:orders,message:'Đặt hàng thành công. Thanh toán khi nhận hàng.'});
});
exports.customerOrders=action(async(req,res)=>{
  const orders=await prisma.orders.findMany({where:{user_id:req.user.userId},include,orderBy:{order_id:'desc'}});
  res.json({success:true,data:orders.map(order=>publicOrder(order))});
});
exports.sellerOrders=action(async(req,res)=>{
  const where={shops:{seller_id:req.user.sellerId}};
  const orders=await prisma.orders.findMany({where:{order_items:{some:where}},include:{...include,order_items:{where,include:{shops:{select:{shop_name:true}}},orderBy:{order_item_id:'asc'}}},orderBy:{order_id:'desc'}});
  res.json({success:true,data:orders.map(order=>publicOrder(order,true))});
});
exports.adminOrders=action(async(req,res)=>{
  const orders=await prisma.orders.findMany({include,orderBy:{order_id:'desc'}});
  res.json({success:true,data:orders.map(order=>publicOrder(order))});
});
async function changeStatus(req,desired,customerOnly=false){
  const orderId=id(req.params.id);
  if(!Object.hasOwn(transitions,desired)) throw new HttpError(400,'Trạng thái đơn hàng không hợp lệ.');
  return prisma.$transaction(async tx=>{
    if(customerOnly) await lockCustomer(tx,req.user.userId);
    await tx.$queryRaw`SELECT order_id FROM orders WHERE order_id = ${orderId} FOR UPDATE`;
    const order=await tx.orders.findUnique({where:{order_id:orderId},include:{order_items:{include:{shops:true}},payments:true}});
    if(!order || (customerOnly&&order.user_id!==req.user.userId)) throw new HttpError(404,'Không tìm thấy đơn hàng của bạn.');
    if(req.user.role==='seller'&&order.order_items.some(item=>item.shops.seller_id!==req.user.sellerId)) throw new HttpError(404,'Không tìm thấy đơn hàng của cửa hàng bạn.');
    if(req.user.role==='seller'&&!order.order_items.length) throw new HttpError(404,'Không tìm thấy đơn hàng của cửa hàng bạn.');
    if(customerOnly&&order.status!=='pending') throw new HttpError(409,'Chỉ có thể hủy đơn hàng đang chờ xác nhận.');
    if(!transitions[order.status]?.includes(desired)) throw new HttpError(409,'Không thể chuyển trạng thái đơn hàng này.');
    if(desired==='cancelled'){
      for(const item of [...order.order_items].sort((a,b)=>(a.variant_id||0)-(b.variant_id||0))){
        if(!item.variant_id) throw new HttpError(409,'Đơn hàng cũ cần được quản trị viên xử lý tồn kho.');
        const rows=await lockStock(tx,item.variant_id);
        if(rows[0]) await tx.inventories.update({where:{inventory_id:rows[0].inventory_id},data:{quantity:{increment:Number(item.quantity||0)}}});
        else await tx.inventories.create({data:{product_id:item.product_id,variant_id:item.variant_id,quantity:Number(item.quantity||0)}});
      }
      if(order.payments) await tx.payments.update({where:{order_id:orderId},data:{payment_status:'failed'}});
    }
    if(desired==='completed'){
      for(const item of order.order_items) await tx.products.update({where:{product_id:item.product_id},data:{sold_quantity:{increment:Number(item.quantity||0)}}});
      if(order.payments?.payment_method==='COD') await tx.payments.update({where:{order_id:orderId},data:{payment_status:'paid',paid_at:new Date()}});
    }
    await tx.orders.update({where:{order_id:orderId},data:{status:desired,updated_at:new Date()}});
    await tx.order_status_history.create({data:{order_id:orderId,old_status:order.status,new_status:desired,note:customerOnly?'Khách hàng hủy đơn.':`Cập nhật bởi ${req.user.role}.`}});
    return publicOrder(await tx.orders.findUnique({where:{order_id:orderId},include}));
  },{maxWait:10000,timeout:20000});
}
exports.cancel=action(async(req,res)=>res.json({success:true,data:await changeStatus(req,'cancelled',true)}));
exports.status=action(async(req,res)=>res.json({success:true,data:await changeStatus(req,req.body.status)}));
