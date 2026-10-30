const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const databaseUrl = process.env.TEST_DATABASE_URL;

// The suite touches only its own generated fixtures in an explicitly selected test DB.
test('marketplace roles, seller ownership, moderation, and data-driven categories', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to an initialized MySQL database ending in _test.',
  timeout: 90000,
}, async t => {
  const selected = new URL(databaseUrl);
  assert.equal(selected.protocol, 'mysql:');
  assert.match(selected.pathname, /_test$/u, 'Refusing to run against a non-test database');
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET ||= randomUUID() + randomUUID();
  const bcrypt = require('bcrypt');
  const prisma = require('../src/config/database');
  const app = require('../src/server');
  const marker = 'test_' + randomUUID().replaceAll('-', '').slice(0, 12);
  const password = 'OnlyForThisTest123!';
  const users = [];
  const categoryIds = [];
  const shopIds = [];
  const productIds = [];
  const uploadedFiles = [];
  let server;
  let base;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    try {
      const userIds = users.map(user => user.user_id);
      const relatedCarts = await prisma.carts.findMany({where:{user_id:{in:userIds}},select:{cart_id:true}});
      await prisma.cart_items.deleteMany({where:{cart_id:{in:relatedCarts.map(cart=>cart.cart_id)}}});
      await prisma.carts.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.product_category_map.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.product_media.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.inventories.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.product_variants.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.products.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.shops.deleteMany({where:{shop_id:{in:shopIds}}});
      await prisma.categories.deleteMany({where:{category_id:{in:categoryIds}}});
      await prisma.sellers.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.users.deleteMany({where:{user_id:{in:userIds}}});
    } finally {
      for (const url of uploadedFiles) {
        const name = require('node:path').basename(url);
        await require('node:fs/promises').rm(require('node:path').join(__dirname,'../public/products',name),{force:true});
      }
      await prisma.$disconnect();
    }
  });

  const hash = await bcrypt.hash(password, 10);
  async function seed(role, suffix) {
    const user = await prisma.users.create({data:{username:marker+suffix,full_name:'Integration '+suffix,email:marker+suffix+'@example.test',password_hash:hash,role,status:'active'}});
    users.push(user);
    if (role === 'seller') user.seller = await prisma.sellers.create({data:{user_id:user.user_id,seller_name:'Shop '+suffix,status:'active'}});
    return user;
  }
  const admin = await seed('admin', 'admin');
  const customer = await seed('customer', 'customer');
  const otherCustomer = await seed('customer', 'othercustomer');
  const seller = await seed('seller', 'seller');
  const otherSeller = await seed('seller', 'other');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = 'http://127.0.0.1:' + server.address().port;

  async function request(path, {method='GET', cookie, body, headers={}} = {}) {
    const response = await fetch(base+path,{method,redirect:'manual',headers:{...headers,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    return {response,status:response.status,data};
  }
  async function login(user) {
    const result = await request('/api/auth/login',{method:'POST',body:{login:user.username,password}});
    assert.equal(result.status,200,JSON.stringify(result.data));
    assert.match(result.response.headers.get('set-cookie'), /HttpOnly/i);
    assert.equal(result.data.redirect, user.role==='customer'?'/user-panel.html':'/'+user.role+'-panel.html');
    return result.response.headers.get('set-cookie').split(';')[0];
  }
  const adminCookie = await login(admin);
  const customerCookie = await login(customer);
  const otherCustomerCookie = await login(otherCustomer);
  const sellerCookie = await login(seller);
  const otherCookie = await login(otherSeller);
  let ownShop;
  let otherShop;
  let category;
  let product;
  const productBody = {name:marker+' product',description:'A database-backed product',price:125000,stock:7};

  await t.test('guests can browse but cannot call protected APIs or mutate categories', async () => {
    assert.equal((await request('/api/products')).status,200);
    assert.equal((await request('/api/categories')).status,200);
    for (const path of ['/api/cart','/api/seller/products','/api/admin/users']) assert.equal((await request(path)).status,401,path);
    assert.equal((await request('/api/categories',{method:'POST',body:{name:marker}})).status,401);
    assert.equal((await request('/api/cart',{method:'POST',body:{product_id:1,variant_id:1}})).status,401);
    const before = await prisma.categories.count({where:{name:marker}});
    assert.equal(before,0);
  });

  await t.test('page routes enforce roles even when opened directly', async () => {
    assert.equal((await request('/guest-panel.html')).status,200);
    for (const page of ['/user-panel.html','/seller-panel.html','/admin-panel.html']) {
      const result=await request(page);
      assert.equal(result.status,302,page);
      assert.match(result.response.headers.get('location'), /^\/login\.html\?next=/);
    }
    for (const [cookie,ownPage] of [[customerCookie,'user'],[sellerCookie,'seller'],[adminCookie,'admin']]) {
      assert.equal((await request('/'+ownPage+'-panel.html',{cookie})).status,200);
      for (const panel of ['user','seller','admin'].filter(p=>p!==ownPage)) {
        const result = await request('/'+panel+'-panel.html',{cookie});
        assert.equal(result.status,302);
        assert.equal(result.response.headers.get('location'),'/'+ownPage+'-panel.html');
      }
    }
  });

  await t.test('customer, seller, and admin APIs reject cross-role access', async () => {
    for (const path of ['/api/seller/products','/api/admin/users']) assert.equal((await request(path,{cookie:customerCookie})).status,403);
    assert.equal((await request('/api/categories',{method:'POST',cookie:customerCookie,body:{name:marker}})).status,403);
    assert.equal((await request('/api/admin/users',{cookie:sellerCookie})).status,403);
    assert.equal((await request('/api/cart',{cookie:sellerCookie})).status,403);
    assert.equal((await request('/api/seller/shops',{cookie:adminCookie})).status,403);
  });

  await t.test('seller creates persistent shops and categories with validated input', async () => {
    const makeShop=async(cookie,suffix)=>{
      const result=await request('/api/seller/shops',{method:'POST',cookie,body:{shopName:marker+suffix,description:'Owned by this seller'}});
      assert.equal(result.status,201,JSON.stringify(result.data));
      shopIds.push(result.data.data.shop_id);
      return result.data.data;
    };
    ownShop=await makeShop(sellerCookie,' shop');
    otherShop=await makeShop(otherCookie,' other shop');
    assert.equal(ownShop.seller_id,seller.seller.seller_id);
    assert.equal((await request('/api/categories',{method:'POST',cookie:sellerCookie,body:{name:' '}})).status,400);
    const result=await request('/api/categories',{method:'POST',cookie:sellerCookie,body:{name:marker+' category'}});
    assert.equal(result.status,201,JSON.stringify(result.data));
    category=result.data.data;
    categoryIds.push(category.id);
    assert.equal((await prisma.categories.findUnique({where:{category_id:category.id}})).name,category.name);
    const catalogue=await request('/api/categories');
    assert.ok(catalogue.data.data.some(item=>item.id===category.id&&item.name===category.name));
    assert.equal((await request('/api/categories',{method:'POST',cookie:sellerCookie,body:{name:category.name}})).status,409);
  });

  await t.test('seller cannot edit another store or publish products in another store', async () => {
    assert.equal((await request('/api/seller/shops/'+otherShop.shop_id,{method:'PATCH',cookie:sellerCookie,body:{shopName:'Illicit edit'}})).status,404);
    assert.equal((await request('/api/seller/products',{method:'POST',cookie:sellerCookie,body:{...productBody,shopId:otherShop.shop_id,categoryId:category.id}})).status,404);
    assert.equal((await prisma.shops.findUnique({where:{shop_id:otherShop.shop_id}})).shop_name,otherShop.shop_name);
    const updated=await request('/api/seller/shops/'+ownShop.shop_id,{method:'PATCH',cookie:sellerCookie,body:{shopName:marker+' updated shop'}});
    assert.equal(updated.status,200);
    assert.equal(updated.data.data.shop_name,marker+' updated shop');
  });

  await t.test('new seller products persist as drafts with a database category', async () => {
    const result=await request('/api/seller/products',{method:'POST',cookie:sellerCookie,body:{...productBody,shopId:ownShop.shop_id,categoryId:category.id}});
    assert.equal(result.status,201,JSON.stringify(result.data));
    product=result.data.data;
    productIds.push(product.id);
    const stored=await prisma.products.findUnique({where:{product_id:product.id},include:{product_category_map:true,product_variants:true,inventories:true}});
    assert.equal(stored.status,'draft');
    assert.equal(stored.shop_id,ownShop.shop_id);
    assert.equal(stored.product_category_map[0].category_id,category.id);
    assert.equal(Number(stored.product_variants[0].price),productBody.price);
    assert.equal(stored.inventories[0].quantity,productBody.stock);
    assert.equal((await request('/api/products/'+product.id)).status,404);
    assert.equal((await request('/api/seller/products/'+product.id,{method:'PATCH',cookie:otherCookie,body:productBody})).status,404);
  });

  await t.test('admin moderation controls public visibility and category filtering', async () => {
    assert.equal((await request('/api/admin/products/'+product.id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
    const visible=await request('/api/products/'+product.id);
    assert.equal(visible.status,200,JSON.stringify(visible.data));
    assert.equal(visible.data.data.name,productBody.name);
    const filtered=await request('/api/products?categoryId='+category.id);
    assert.ok(filtered.data.data.some(p=>p.id===product.id));
    assert.equal((await request('/api/products?categoryId=bad')).status,400);
    for (const status of ['hidden','banned']) {
      assert.equal((await request('/api/admin/products/'+product.id+'/status',{method:'PATCH',cookie:adminCookie,body:{status}})).status,200);
      assert.equal((await request('/api/products/'+product.id)).status,404);
    }
    assert.equal((await request('/api/seller/products/'+product.id,{method:'PATCH',cookie:sellerCookie,body:productBody})).status,403);
    assert.equal((await request('/api/admin/products/'+product.id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
  });

  await t.test('admin store bans cannot be bypassed by sellers and hide active products', async () => {
    assert.equal((await request('/api/admin/shops/'+ownShop.shop_id,{method:'PATCH',cookie:adminCookie,body:{status:'banned'}})).status,200);
    assert.equal((await request('/api/products/'+product.id)).status,404);
    assert.equal((await request('/api/seller/shops/'+ownShop.shop_id,{method:'PATCH',cookie:sellerCookie,body:{status:'active'}})).status,403);
    assert.equal((await request('/api/seller/products',{method:'POST',cookie:sellerCookie,body:{...productBody,shopId:ownShop.shop_id}})).status,404);
    assert.equal((await request('/api/admin/shops/'+ownShop.shop_id,{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
    assert.equal((await request('/api/products/'+product.id)).status,200);
  });

  await t.test('seller edits require reapproval and cannot self-publish', async () => {
    const secondVariant=await prisma.product_variants.create({data:{product_id:product.id,sku:marker+'-secondary',price:'149000',status:'active'}});
    await prisma.inventories.create({data:{product_id:product.id,variant_id:secondVariant.variant_id,quantity:5}});
    const listed=await request('/api/seller/products',{cookie:sellerCookie});
    const selected=listed.data.data.find(item=>item.id===product.id);
    assert.equal(selected.stock,12);
    assert.equal(selected.variantStock,7);
    const edited=await request('/api/seller/products/'+product.id,{method:'PATCH',cookie:sellerCookie,body:{...productBody,name:marker+' revised product',categoryId:category.id}});
    assert.equal(edited.status,200,JSON.stringify(edited.data));
    const quantities=await prisma.inventories.findMany({where:{product_id:product.id}});
    assert.equal(quantities.reduce((sum,row)=>sum+row.quantity,0),12,'Editing one variant must preserve other variant stock');
    assert.equal((await prisma.products.findUnique({where:{product_id:product.id}})).status,'draft');
    assert.equal((await request('/api/products/'+product.id)).status,404);
    assert.equal((await request('/api/seller/products/'+product.id+'/status',{method:'PATCH',cookie:sellerCookie,body:{status:'active'}})).status,400);
    assert.equal((await request('/api/admin/products/'+product.id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
    assert.equal((await request('/api/products/'+product.id)).data.data.name,marker+' revised product');
  });

  await t.test('seller image uploads persist, validate image bytes, and require moderation', async () => {
    const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfFdEY3hyH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYB+gXBS7Myj5EAAAAASUVORK5CYII=';
    const endpoint='/api/seller/products/'+product.id+'/images';
    assert.equal((await request(endpoint,{method:'POST',cookie:otherCookie,body:{images:[image]}})).status,404);
    assert.equal((await request(endpoint,{method:'POST',cookie:sellerCookie,body:{images:['data:image/png;base64,PGh0bWw+']}})).status,400);
    const uploaded=await request(endpoint,{method:'POST',cookie:sellerCookie,body:{images:[image]}});
    assert.equal(uploaded.status,200,JSON.stringify(uploaded.data));
    uploadedFiles.push(...uploaded.data.data);
    assert.equal(uploaded.data.data.length,1);
    const served=await fetch(base+uploaded.data.data[0]);
    assert.equal(served.status,200);
    assert.match(served.headers.get('content-type'),/^image\/png/);
    assert.equal((await prisma.products.findUnique({where:{product_id:product.id}})).status,'draft');
    assert.equal((await request('/api/products/'+product.id)).status,404);
    assert.equal((await request('/api/admin/products/'+product.id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
  });

  await t.test('customer cart writes work only after login', async () => {
    const variant=await prisma.product_variants.findFirst({where:{product_id:product.id}});
    const result=await request('/api/cart',{method:'POST',cookie:customerCookie,body:{product_id:product.id,variant_id:variant.variant_id,quantity:2}});
    assert.equal(result.status,200,JSON.stringify(result.data));
    const cart=await request('/api/cart',{cookie:customerCookie});
    assert.equal(cart.status,200);
    assert.equal(cart.data.data.cart_items.length,1);
    assert.equal(cart.data.data.cart_items[0].quantity,2);
    const itemId=cart.data.data.cart_items[0].cart_item_id;
    assert.equal((await request('/api/cart/item/'+itemId,{method:'PUT',cookie:otherCustomerCookie,body:{quantity:3}})).status,404);
    assert.equal((await request('/api/cart/item/'+itemId,{method:'DELETE',cookie:otherCustomerCookie})).status,404);
    assert.equal((await request('/api/cart',{cookie:otherCustomerCookie})).data.data,null);
  });

  await t.test('admin account and seller status changes revoke live session permissions', async () => {
    const listed=await request('/api/admin/users',{cookie:adminCookie});
    assert.equal(listed.status,200);
    assert.ok(listed.data.data.some(user=>user.user_id===customer.user_id));
    assert.ok(listed.data.data.every(user=>!Object.hasOwn(user,'password_hash')));
    assert.equal((await request('/api/admin/users/'+customer.user_id,{method:'PATCH',cookie:adminCookie,body:{status:'blocked'}})).status,200);
    assert.equal((await request('/api/cart',{cookie:customerCookie})).status,401);
    assert.equal((await request('/api/admin/users/'+customer.user_id,{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
    assert.equal((await request('/api/admin/users/'+admin.user_id,{method:'PATCH',cookie:adminCookie,body:{role:'customer'}})).status,400);
    assert.equal((await request('/api/admin/sellers/'+seller.seller.seller_id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'suspended'}})).status,200);
    assert.equal((await request('/api/seller/products',{cookie:sellerCookie})).status,401);
    assert.equal((await request('/api/products/'+product.id)).status,404);
    assert.equal((await request('/api/admin/sellers/'+seller.seller.seller_id+'/status',{method:'PATCH',cookie:adminCookie,body:{status:'active'}})).status,200);
  });

  await t.test('admin can provision a seller account with a hashed password', async () => {
    const input={username:marker+'managed',fullName:'Managed seller',email:marker+'managed@example.test',password,role:'seller'};
    const result=await request('/api/admin/users',{method:'POST',cookie:adminCookie,body:input});
    assert.equal(result.status,201,JSON.stringify(result.data));
    const stored=await prisma.users.findUnique({where:{email:input.email},include:{sellers:true}});
    users.push(stored);
    assert.equal(stored.role,'seller');
    assert.equal(stored.sellers.status,'active');
    assert.ok(await bcrypt.compare(password,stored.password_hash));
    assert.ok(!Object.hasOwn(result.data.data,'password_hash'));
  });

  await t.test('registration hashes passwords and prevents public admin registration', async () => {
    const input={username:marker+'registered',fullName:'Registered customer',email:marker+'registered@example.test',password,role:'customer'};
    assert.equal((await request('/api/auth/register',{method:'POST',body:{...input,role:'admin'}})).status,400);
    const registered=await request('/api/auth/register',{method:'POST',body:input});
    assert.equal(registered.status,201,JSON.stringify(registered.data));
    const stored=await prisma.users.findUnique({where:{email:input.email}});
    users.push(stored);
    assert.equal(stored.role,'customer');
    assert.notEqual(stored.password_hash,password);
    assert.ok(await bcrypt.compare(password,stored.password_hash));
    const pendingInput={...input,username:marker+'pending',email:marker+'pending@example.test',role:'seller'};
    const pending=await request('/api/auth/register',{method:'POST',body:pendingInput});
    assert.equal(pending.status,201,JSON.stringify(pending.data));
    const storedPending=await prisma.users.findUnique({where:{email:pendingInput.email},include:{sellers:true}});
    users.push(storedPending);
    assert.equal(storedPending.sellers.status,'pending');
    assert.equal((await request('/api/auth/login',{method:'POST',body:{login:pendingInput.username,password}})).status,403);
  });

  await t.test('cross-origin cookie mutations are rejected', async () => {
    assert.equal((await request('/api/categories',{method:'POST',cookie:sellerCookie,headers:{Origin:'https://untrusted.example'},body:{name:marker+' forbidden'}})).status,403);
    assert.equal(await prisma.categories.count({where:{name:marker+' forbidden'}}),0);
  });

  await t.test('simultaneous administrator demotions preserve an active administrator', async () => {
    const secondAdmin=await seed('admin','admin2');
    const secondCookie=await login(secondAdmin);
    const results=await Promise.all([
      request('/api/admin/users/'+secondAdmin.user_id,{method:'PATCH',cookie:adminCookie,body:{role:'customer'}}),
      request('/api/admin/users/'+admin.user_id,{method:'PATCH',cookie:secondCookie,body:{role:'customer'}}),
    ]);
    assert.equal(results.filter(result=>result.status===200).length,1,JSON.stringify(results.map(result=>({status:result.status,data:result.data}))));
    assert.ok(results.every(result=>[200,401,403].includes(result.status)));
    const remaining=await prisma.users.count({where:{user_id:{in:[admin.user_id,secondAdmin.user_id]},role:'admin',status:'active'}});
    assert.equal(remaining,1);
  });
});
