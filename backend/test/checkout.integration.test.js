const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const databaseUrl = process.env.TEST_DATABASE_URL;

test('COD checkout, stock transactions, and order ownership', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to an initialized MySQL database ending in _test.',
  timeout: 120000,
}, async t => {
  const selected = new URL(databaseUrl);
  assert.equal(selected.protocol,'mysql:');
  assert.match(selected.pathname,/_test$/u,'Refusing to run against a non-test database');
  process.env.DATABASE_URL=databaseUrl;
  process.env.JWT_SECRET ||= randomUUID()+randomUUID();
  const bcrypt=require('bcrypt');
  const prisma=require('../src/config/database');
  const app=require('../src/server');
  const marker='checkout_'+randomUUID().replaceAll('-','').slice(0,10);
  const password='CheckoutTestPassword123!';
  const users=[],shops=[],products=[];
  let server,base;
  t.after(async()=>{
    if(server) await new Promise(resolve=>server.close(resolve));
    try{
      const userIds=users.map(u=>u.user_id),shopIds=shops.map(s=>s.shop_id),productIds=products.map(p=>p.product_id);
      const orders=await prisma.orders.findMany({where:{user_id:{in:userIds}},select:{order_id:true}});
      const orderIds=orders.map(o=>o.order_id);
      await prisma.payments.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.order_status_history.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.order_items.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.packages.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.orders.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.addresses.deleteMany({where:{user_id:{in:userIds}}});
      const carts=await prisma.carts.findMany({where:{user_id:{in:userIds}},select:{cart_id:true}});
      await prisma.cart_items.deleteMany({where:{cart_id:{in:carts.map(c=>c.cart_id)}}});
      await prisma.carts.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.inventories.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.product_variants.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.products.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.shops.deleteMany({where:{shop_id:{in:shopIds}}});
      await prisma.sellers.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.users.deleteMany({where:{user_id:{in:userIds}}});
    }finally{await prisma.$disconnect();}
  });
  const hash=await bcrypt.hash(password,10);
  async function account(role,suffix){
    const u=await prisma.users.create({data:{username:marker+suffix,full_name:marker+suffix,email:marker+suffix+'@example.test',password_hash:hash,role,status:'active'}});
    users.push(u);
    if(role==='seller'){
      u.seller=await prisma.sellers.create({data:{user_id:u.user_id,status:'active',seller_name:marker+suffix}});
      u.shop=await prisma.shops.create({data:{seller_id:u.seller.seller_id,shop_name:marker+suffix,status:'active'}});
      shops.push(u.shop);
    }
    return u;
  }
  const admin=await account('admin','admin'),a=await account('customer','buyerA'),b=await account('customer','buyerB'),s1=await account('seller','seller1'),s2=await account('seller','seller2');
  async function product(shop,suffix,price,quantity){
    const p=await prisma.products.create({data:{shop_id:shop.shop_id,name:marker+suffix,status:'active'}});
    products.push(p);
    p.variant=await prisma.product_variants.create({data:{product_id:p.product_id,sku:marker+suffix,price:String(price),status:'active'}});
    p.inventory=await prisma.inventories.create({data:{product_id:p.product_id,variant_id:p.variant.variant_id,quantity,reserved_quantity:0}});
    return p;
  }
  const p1=await product(s1.shop,'product1',125000,10),p2=await product(s2.shop,'product2',90000,10),last=await product(s1.shop,'limited',50000,2);
  server=app.listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  base='http://127.0.0.1:'+server.address().port;
  async function request(path,{method='GET',cookie,body}={}){
    const response=await fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  for(const u of users){const r=await request('/api/auth/login',{method:'POST',body:{login:u.username,password}});assert.equal(r.status,200,JSON.stringify(r.data));u.cookie=r.cookie;}
  async function add(u,p,quantity){const r=await request('/api/cart',{method:'POST',cookie:u.cookie,body:{product_id:p.product_id,variant_id:p.variant.variant_id,quantity}});assert.equal(r.status,200,JSON.stringify(r.data));}
  async function clearCart(u){const carts=await prisma.carts.findMany({where:{user_id:u.user_id}});await prisma.cart_items.deleteMany({where:{cart_id:{in:carts.map(c=>c.cart_id)}}});}
  async function stock(p){return (await prisma.inventories.findUnique({where:{inventory_id:p.inventory.inventory_id}})).quantity;}
  const address={receiverName:'Test Recipient',receiverPhone:'0901234567',province:'Ho Chi Minh City',district:'District 1',ward:'Ben Nghe',detailAddress:'123 Test Street',note:'Integration fixture'};
  let order1,order2;
  await t.test('order APIs enforce role boundaries and validate delivery address',async()=>{
    assert.equal((await request('/api/orders')).status,401);
    assert.equal((await request('/api/orders',{cookie:s1.cookie})).status,403);
    assert.equal((await request('/api/admin/orders',{cookie:a.cookie})).status,403);
    assert.equal((await request('/api/seller/orders',{cookie:a.cookie})).status,403);
    assert.equal((await request('/api/orders',{method:'POST',cookie:a.cookie,body:{...address,receiverPhone:'invalid'}})).status,400);
    assert.equal((await request('/api/orders',{method:'POST',cookie:a.cookie,body:address})).status,400);
  });
  await t.test('checkout splits shops, uses server prices, persists COD and address, and clears cart atomically',async()=>{
    await add(a,p1,2);await add(a,p2,1);
    const result=await request('/api/orders',{method:'POST',cookie:a.cookie,body:{...address,total:1,price:1,paymentMethod:'BANK'}});
    assert.equal(result.status,201,JSON.stringify(result.data));assert.equal(result.data.data.length,2);
    order1=result.data.data.find(o=>o.items.some(i=>i.productId===p1.product_id));order2=result.data.data.find(o=>o.items.some(i=>i.productId===p2.product_id));
    assert.equal(order1.total,250000);assert.equal(order2.total,90000);
    assert.equal(order1.shippingFee,0);assert.equal(order1.paymentMethod,'COD');assert.equal(order1.paymentStatus,'pending');
    assert.deepEqual(order1.address,{receiverName:address.receiverName,receiverPhone:address.receiverPhone,province:address.province,district:address.district,ward:address.ward,detailAddress:address.detailAddress});
    assert.equal(await stock(p1),8);assert.equal(await stock(p2),9);
    assert.equal((await request('/api/cart',{cookie:a.cookie})).data.data.cart_items.length,0);
    const saved=await prisma.orders.findUnique({where:{order_id:order1.id},include:{payments:true,order_items:true,order_status_history:true}});
    assert.equal(saved.payments.payment_method,'COD');assert.equal(saved.order_items.length,1);assert.equal(saved.order_status_history[0].new_status,'pending');
  });
  await t.test('customer and seller order views and mutations remain isolated',async()=>{
    assert.ok((await request('/api/orders',{cookie:a.cookie})).data.data.some(o=>o.id===order1.id));
    assert.equal((await request('/api/orders',{cookie:b.cookie})).data.data.length,0);
    assert.equal((await request('/api/orders/'+order1.id+'/cancel',{method:'PATCH',cookie:b.cookie})).status,404);
    const first=(await request('/api/seller/orders',{cookie:s1.cookie})).data.data;
    assert.ok(first.some(o=>o.id===order1.id));assert.equal(first.some(o=>o.id===order2.id),false);
    assert.equal((await request('/api/seller/orders/'+order1.id+'/status',{method:'PATCH',cookie:s2.cookie,body:{status:'confirmed'}})).status,404);
    assert.ok((await request('/api/admin/orders',{cookie:admin.cookie})).data.data.some(o=>o.id===order2.id));
  });
  await t.test('cancellation restores stock once and terminal order transitions are rejected',async()=>{
    assert.equal((await request('/api/seller/orders/'+order1.id+'/status',{method:'PATCH',cookie:s1.cookie,body:{status:'completed'}})).status,409);
    assert.equal((await request('/api/orders/'+order1.id+'/cancel',{method:'PATCH',cookie:a.cookie})).status,200);
    assert.equal(await stock(p1),10);
    assert.equal((await request('/api/orders/'+order1.id+'/cancel',{method:'PATCH',cookie:a.cookie})).status,409);
    assert.equal(await stock(p1),10);
    const stored=await prisma.payments.findUnique({where:{order_id:order1.id}});assert.equal(stored.payment_status,'failed');
  });
  await t.test('seller fulfillment follows ordered transitions and records paid COD on completion',async()=>{
    const endpoint='/api/seller/orders/'+order2.id+'/status';
    assert.equal((await request(endpoint,{method:'PATCH',cookie:s2.cookie,body:{status:'confirmed'}})).status,200);
    assert.equal((await request('/api/orders/'+order2.id+'/cancel',{method:'PATCH',cookie:a.cookie})).status,409);
    for(const status of ['packing','shipping','completed']) assert.equal((await request(endpoint,{method:'PATCH',cookie:s2.cookie,body:{status}})).status,200);
    assert.equal((await request(endpoint,{method:'PATCH',cookie:s2.cookie,body:{status:'cancelled'}})).status,409);
    const stored=await prisma.payments.findUnique({where:{order_id:order2.id}});assert.equal(stored.payment_status,'paid');assert.ok(stored.paid_at);
    assert.equal((await prisma.products.findUnique({where:{product_id:p2.product_id}})).sold_quantity,1);
  });
  await t.test('stale unavailable products roll back checkout without stock, orders, or address changes',async()=>{
    await add(a,p1,1);await add(a,p2,1);
    await prisma.products.update({where:{product_id:p2.product_id},data:{status:'hidden'}});
    const beforeOrders=await prisma.orders.count({where:{user_id:a.user_id}}),beforeAddresses=await prisma.addresses.count({where:{user_id:a.user_id}}),beforeStock=await stock(p1);
    const result=await request('/api/orders',{method:'POST',cookie:a.cookie,body:address});assert.equal(result.status,409,JSON.stringify(result.data));
    assert.equal(await stock(p1),beforeStock);assert.equal(await prisma.orders.count({where:{user_id:a.user_id}}),beforeOrders);assert.equal(await prisma.addresses.count({where:{user_id:a.user_id}}),beforeAddresses);
    assert.equal((await request('/api/cart',{cookie:a.cookie})).data.data.cart_items.length,2);
    await clearCart(a);await prisma.products.update({where:{product_id:p2.product_id},data:{status:'active'}});
  });
  await t.test('simultaneous buyers cannot oversell the last available stock',async()=>{
    await add(a,last,2);await add(b,last,2);
    const results=await Promise.all([a,b].map(u=>request('/api/orders',{method:'POST',cookie:u.cookie,body:address})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal(await stock(last),0);
    const winner=results.find(r=>r.status===201);assert.equal(winner.data.data[0].total,100000);
    const orderId=winner.data.data[0].id;
    const cancelled=await request('/api/admin/orders/'+orderId+'/status',{method:'PATCH',cookie:admin.cookie,body:{status:'cancelled'}});
    assert.equal(cancelled.status,200,JSON.stringify(cancelled.data));assert.equal(await stock(last),2);
    await clearCart(a);await clearCart(b);
  });
  await t.test('double checkout from one cart creates one order rather than duplicate purchases',async()=>{
    await add(a,last,1);
    const before=await prisma.orders.count({where:{user_id:a.user_id}});
    const results=await Promise.all([1,2].map(()=>request('/api/orders',{method:'POST',cookie:a.cookie,body:address})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,400]);
    assert.equal(await prisma.orders.count({where:{user_id:a.user_id}}),before+1);assert.equal(await stock(last),1);
  });
});
