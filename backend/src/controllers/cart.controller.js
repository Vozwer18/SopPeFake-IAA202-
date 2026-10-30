const prisma = require('../config/database');
const { action, id, integer, HttpError } = require('../lib/validation');
const { lockCustomer } = require('../lib/cart-lock');
const visibleShop={status:'active',sellers:{status:'active',users:{status:'active',role:'seller'}}};
async function availableVariant(tx,product_id,variant_id,quantity) {
  const variant=await tx.product_variants.findFirst({where:{variant_id,product_id,status:'active',products:{status:'active',shops:visibleShop}},include:{inventories:true}});
  if(!variant) throw new HttpError(404,'Sản phẩm không tồn tại hoặc không còn được bán.');
  const stock=variant.inventories.reduce((sum,x)=>sum+Math.max(0,Number(x.quantity||0)-Number(x.reserved_quantity||0)),0);
  if(quantity>stock) throw new HttpError(400,'Số lượng vượt quá tồn kho.');
  return variant;
}
exports.getCart=action(async(req,res)=>{
  const cart=await prisma.carts.findFirst({where:{user_id:req.user.userId,status:'active'},orderBy:{cart_id:'asc'},include:{cart_items:{include:{products:true,product_variants:true}}}});
  res.json({success:true,data:cart||null,message:cart?'OK':'Cart empty'});
});
exports.addToCart=action(async(req,res)=>{
  const product_id=id(req.body.product_id),variant_id=id(req.body.variant_id),quantity=integer(req.body.quantity??1,'Số lượng',1,10000);
  await prisma.$transaction(async tx=>{
    await lockCustomer(tx,req.user.userId);
    let cart=await tx.carts.findFirst({where:{user_id:req.user.userId,status:'active'},orderBy:{cart_id:'asc'}});
    if(!cart) cart=await tx.carts.create({data:{user_id:req.user.userId,status:'active'}});
    const exist=await tx.cart_items.findFirst({where:{cart_id:cart.cart_id,product_id,variant_id}});
    const total=integer(quantity+Number(exist?.quantity||0),'Số lượng',1,10000);
    const variant=await availableVariant(tx,product_id,variant_id,total);
    if(exist) await tx.cart_items.update({where:{cart_item_id:exist.cart_item_id},data:{quantity:total}});
    else await tx.cart_items.create({data:{cart_id:cart.cart_id,product_id,variant_id,quantity,added_price:variant.price}});
  });
  res.json({success:true,message:'Đã thêm vào giỏ hàng.'});
});
exports.updateItem=action(async(req,res)=>{
  const cart_item_id=id(req.params.id),quantity=integer(req.body.quantity,'Số lượng',1,10000);
  await prisma.$transaction(async tx=>{
    await lockCustomer(tx,req.user.userId);
    const item=await tx.cart_items.findFirst({where:{cart_item_id,carts:{user_id:req.user.userId,status:'active'}}});
    if(!item) throw new HttpError(404,'Không tìm thấy sản phẩm trong giỏ hàng của bạn.');
    await availableVariant(tx,item.product_id,item.variant_id,quantity);
    await tx.cart_items.update({where:{cart_item_id},data:{quantity}});
  });
  res.json({success:true});
});
exports.removeItem=action(async(req,res)=>{
  const cart_item_id=id(req.params.id);
  await prisma.$transaction(async tx=>{
    await lockCustomer(tx,req.user.userId);
    const item=await tx.cart_items.findFirst({where:{cart_item_id,carts:{user_id:req.user.userId,status:'active'}}});
    if(!item) throw new HttpError(404,'Không tìm thấy sản phẩm trong giỏ hàng của bạn.');
    await tx.cart_items.delete({where:{cart_item_id}});
  });
  res.json({success:true,message:'Đã xóa khỏi giỏ hàng.'});
});
