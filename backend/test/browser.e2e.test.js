const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {randomUUID} = require('node:crypto');

const databaseUrl = process.env.TEST_DATABASE_URL;
test('real browser marketplace workflow', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to an initialized MySQL database ending in _test.',
  timeout: 180000,
}, async t => {
  assert.match(new URL(databaseUrl).pathname, /_test$/u, 'Refusing to use a non-test database');
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET ||= randomUUID()+randomUUID();
  const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
  const prisma = require('../src/config/database');
  const app = require('../src/server');
  const marker = 'e2e_' + randomUUID().replaceAll('-','').slice(0,12);
  const password = randomUUID() + '!Aa9';
  const users = [];
  const failures = [];
  let server, browser;
  const output = process.env.E2E_OUTPUT_DIR;
  if(output) await fs.mkdir(output,{recursive:true});
  t.after(async () => {
    if(browser) await browser.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    try {
      const fixtureUsers=await prisma.users.findMany({where:{username:{startsWith:marker}},select:{user_id:true}});
      const userIds=fixtureUsers.map(user=>user.user_id);
      const sellers=await prisma.sellers.findMany({where:{user_id:{in:userIds}},select:{seller_id:true}});
      const shops=await prisma.shops.findMany({where:{seller_id:{in:sellers.map(s=>s.seller_id)}},select:{shop_id:true}});
      const products=await prisma.products.findMany({where:{shop_id:{in:shops.map(s=>s.shop_id)}},select:{product_id:true}});
      const productIds=products.map(p=>p.product_id);
      const media=await prisma.product_media.findMany({where:{product_id:{in:productIds}},select:{url:true}});
      const carts=await prisma.carts.findMany({where:{user_id:{in:userIds}},select:{cart_id:true}});
      const orders=await prisma.orders.findMany({where:{user_id:{in:userIds}},select:{order_id:true}});
      const orderIds=orders.map(o=>o.order_id);
      await prisma.cart_items.deleteMany({where:{cart_id:{in:carts.map(c=>c.cart_id)}}});
      await prisma.carts.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.order_status_history.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.payments.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.order_items.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.orders.deleteMany({where:{order_id:{in:orderIds}}});
      await prisma.addresses.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.product_category_map.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.product_media.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.inventory_transactions.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.inventories.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.product_variants.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.products.deleteMany({where:{product_id:{in:productIds}}});
      await prisma.shops.deleteMany({where:{shop_id:{in:shops.map(s=>s.shop_id)}}});
      await prisma.categories.deleteMany({where:{name:{startsWith:marker}}});
      await prisma.sellers.deleteMany({where:{user_id:{in:userIds}}});
      await prisma.users.deleteMany({where:{user_id:{in:userIds}}});
      for(const {url} of media) if(/^\/products\/[a-f0-9-]+\.(?:png|jpg|webp)$/.test(url)) await fs.rm(path.join(__dirname,'../public',url),{force:true});
    } finally {await prisma.$disconnect();}
  });
  const admin=await prisma.users.create({data:{username:marker+'admin',full_name:marker+' Admin',email:marker+'admin@example.test',password_hash:await require('bcrypt').hash(password,10),role:'admin',status:'active'}});
  users.push(admin);
  server=app.listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  async function createPage(viewport={width:1440,height:1000}) {
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror',error=>failures.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    return page;
  }
  async function screenshot(page,name) {if(output) await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});}
  async function login(page,username,target) {
    await page.goto(base+'/login.html');
    await page.locator('#login-form [name=login]').fill(username);
    await page.locator('#login-form [name=password]').fill(password);
    await page.locator('#login-form button[type=submit],#login-btn').click();
    await page.waitForURL(base+'/'+target+'-panel.html');
  }
  async function register(page,suffix,role) {
    await page.goto(base+'/login.html');
    await page.locator('#tab-register').click();
    const form=page.locator('#register-form');
    const username=marker+suffix;
    await form.locator('[name=fullName]').fill(marker+' '+suffix);
    await form.locator('[name=username]').fill(username);
    await form.locator('[name=email]').fill(username+'@example.test');
    await form.locator('[name=password]').fill(password);
    await form.locator('[name=role]').selectOption(role);
    const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/register')&&r.request().method()==='POST');
    await form.locator('button').click();
    assert.equal((await response).status(),201);
    await form.waitFor({state:'hidden'});
    return username;
  }
  const adminPage=await createPage();
  const sellerPage=await createPage();
  const customerPage=await createPage();
  const guestPage=await createPage();
  let sellerUsername,customerUsername,shopId,categoryId,productId;
  const categoryName=marker+' Category';
  const productName=marker+' Product';

  await t.test('guest sees public panel and protected URLs require login',async()=>{
    await guestPage.goto(base+'/');
    await guestPage.waitForURL(base+'/guest-panel.html');
    await guestPage.locator('#category-grid').waitFor();
    await guestPage.locator('#browse-mode').filter({hasText:'Guest panel'}).waitFor();
    assert.equal(await guestPage.locator('#cart-link').isVisible(),false);
    await guestPage.goto(base+'/seller-panel.html');
    await guestPage.waitForURL(/\/login\.html\?next=/);
  });

  await t.test('seller registers and admin approves in the admin panel',async()=>{
    sellerUsername=await register(sellerPage,'seller','seller');
    const stored=await prisma.users.findUnique({where:{username:sellerUsername},include:{sellers:true}});
    assert.equal(stored.sellers.status,'pending');
    await login(adminPage,admin.username,'admin');
    await adminPage.locator('[data-view=sellers]').click();
    const row=adminPage.locator('#admin-sellers tr').filter({hasText:sellerUsername+'@example.test'});
    await row.waitFor();
    const response=adminPage.waitForResponse(r=>r.url().endsWith('/api/admin/sellers/'+stored.sellers.seller_id+'/status')&&r.request().method()==='PATCH');
    await row.locator('.status-select').selectOption('active');
    assert.equal((await response).status(),200);
    await row.locator('.status.active').waitFor();
    await login(sellerPage,sellerUsername,'seller');
    await sellerPage.locator('#seller-name').filter({hasText:marker}).waitFor();
  });

  await t.test('seller creates a shop and a data-driven category through forms',async()=>{
    await sellerPage.locator('[data-view=shops]').click();
    await sellerPage.locator('#shop-name').fill(marker+' Shop');
    await sellerPage.locator('#shop-description').fill('Created through a real browser');
    const shopResponse=sellerPage.waitForResponse(r=>r.url().endsWith('/api/seller/shops')&&r.request().method()==='POST');
    await sellerPage.locator('#shop-form button').filter({hasText:'Lưu cửa hàng'}).click();
    const created=await shopResponse;
    assert.equal(created.status(),201);
    shopId=(await created.json()).data.shop_id;
    await sellerPage.locator('#seller-shops h3').filter({hasText:marker+' Shop'}).waitFor();
    await sellerPage.locator('[data-view=categories]').click();
    await sellerPage.locator('#category-name').fill(categoryName);
    await sellerPage.locator('#category-description').fill('Seller-created category; no hardcoded HTML');
    const categoryResponse=sellerPage.waitForResponse(r=>r.url().endsWith('/api/categories')&&r.request().method()==='POST');
    await sellerPage.locator('#category-form button').click();
    const category=await categoryResponse;
    assert.equal(category.status(),201);
    categoryId=(await category.json()).data.id;
    await sellerPage.locator('#seller-categories h3').filter({hasText:categoryName}).waitFor();
  });

  await t.test('seller uploads product image and submits a persistent draft',async()=>{
    await sellerPage.locator('[data-view=products]').click();
    await sellerPage.locator('#view-products .add-product').click();
    await sellerPage.locator('#product-name').fill(productName);
    await sellerPage.locator('#product-shop').selectOption(String(shopId));
    await sellerPage.locator('#product-category').selectOption(String(categoryId));
    await sellerPage.locator('#product-price').fill('199000');
    await sellerPage.locator('#product-stock').fill('10');
    await sellerPage.locator('#product-description').fill('Blue and white marketplace browser test');
    await sellerPage.locator('#seller-images').setInputFiles({name:'test-product.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfFdEY3hyH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYB+gXBS7Myj5EAAAAASUVORK5CYII=','base64')});
    await sellerPage.locator('#seller-preview img').waitFor();
    const response=sellerPage.waitForResponse(r=>r.url().endsWith('/api/seller/products')&&r.request().method()==='POST');
    await sellerPage.locator('#save-product').click();
    const created=await response;
    assert.equal(created.status(),201,await created.text());
    productId=(await created.json()).data.id;
    await sellerPage.locator('#product-modal').waitFor({state:'hidden'});
    await sellerPage.locator('#seller-products tr').filter({hasText:productName}).waitFor();
    const stored=await prisma.products.findUnique({where:{product_id:productId},include:{product_media:true,product_category_map:true}});
    assert.equal(stored.status,'draft');
    assert.equal(stored.product_media.length,1);
    assert.equal(stored.product_category_map[0].category_id,categoryId);
    await screenshot(sellerPage,'seller-products');
  });

  await t.test('admin publishes the product through moderation controls',async()=>{
    await adminPage.reload();
    await adminPage.locator('[data-view=products]').click();
    const row=adminPage.locator('#admin-products tr').filter({hasText:productName});
    await row.waitFor();
    const response=adminPage.waitForResponse(r=>r.url().endsWith('/api/admin/products/'+productId+'/status')&&r.request().method()==='PATCH');
    await row.locator('.status-select').selectOption('active');
    assert.equal((await response).status(),200);
    await row.locator('.status.active').waitFor();
    await screenshot(adminPage,'admin-products');
  });

  await t.test('guest discovers database category and product with no shopping actions',async()=>{
    await guestPage.goto(base+'/guest-panel.html');
    await guestPage.locator('#category-grid a').filter({hasText:categoryName}).click();
    await guestPage.waitForURL(new RegExp('categoryId='+categoryId));
    await guestPage.locator('#product-list .product-card').filter({hasText:productName}).click();
    await guestPage.waitForURL(base+'/product-detail.html?id='+productId);
    await guestPage.locator('#product-detail h1').filter({hasText:productName}).waitFor();
    await guestPage.waitForFunction(()=>document.querySelector('#main-image img')?.naturalWidth>0);
    assert.equal(await guestPage.locator('#add-cart').count(),0);
    assert.equal(await guestPage.locator('#cart-link').isVisible(),false);
    const colours=await guestPage.locator('.brand').first().evaluate(el=>({soppe:getComputedStyle(el.querySelector('span')).color,fake:getComputedStyle(el.querySelector('strong')).color}));
    assert.equal(colours.fake,'rgb(255, 255, 255)');
    assert.notEqual(colours.soppe,colours.fake);
    await screenshot(guestPage,'guest-product-desktop');
  });

  await t.test('customer registers, signs in to user panel, and adds a product to cart',async()=>{
    customerUsername=await register(customerPage,'customer','customer');
    await login(customerPage,customerUsername,'user');
    await customerPage.locator('#user-heading').filter({hasText:marker}).waitFor();
    await customerPage.goto(base+'/product-detail.html?id='+productId);
    await customerPage.locator('#add-cart').waitFor();
    const added=customerPage.waitForResponse(r=>r.url().endsWith('/api/cart')&&r.request().method()==='POST');
    await customerPage.locator('#qty').fill('2');
    await customerPage.locator('#add-cart').click();
    assert.equal((await added).status(),200);
    await customerPage.goto(base+'/cart.html');
    await customerPage.locator('.cart-item').filter({hasText:productName}).waitFor();
    assert.equal(await customerPage.locator('.cart-item .qty span').textContent(),'2');
    await screenshot(customerPage,'customer-cart');
  });

  await t.test('customer checks out with COD and seller/admin process the order',async()=>{
    await customerPage.locator('#checkout-form').waitFor();
    await customerPage.locator('#receiver-name').fill(marker+' Receiver');
    await customerPage.locator('#receiver-phone').fill('0901234567');
    await customerPage.locator('#address-province').fill('Hồ Chí Minh');
    await customerPage.locator('#address-district').fill('Quận 1');
    await customerPage.locator('#address-ward').fill('Bến Nghé');
    await customerPage.locator('#address-detail').fill('123 Test Street');
    await customerPage.locator('#order-note').fill('Real browser test delivery');
    const checkout=customerPage.waitForResponse(r=>r.url().endsWith('/api/orders')&&r.request().method()==='POST');
    await customerPage.locator('#checkout-btn').click();
    const created=await checkout;
    assert.equal(created.status(),201,await created.text());
    const [order]=(await created.json()).data;
    assert.equal(Number(order.total),398000);
    await customerPage.locator('#checkout-success').waitFor();
    assert.equal((await prisma.inventories.findFirst({where:{product_id:productId}})).quantity,8);
    await customerPage.locator('#checkout-success a').click();
    await customerPage.locator(`.order-card[data-order-id="${order.id}"][data-order-status=pending]`).waitFor();
    await screenshot(customerPage,'customer-order-pending');

    await sellerPage.reload();
    await sellerPage.locator('[data-view=orders]').click();
    for(const status of ['confirmed','packing']) {
      const row=sellerPage.locator('#seller-orders tr').filter({hasText:order.code});
      await row.waitFor();
      const changed=sellerPage.waitForResponse(r=>r.url().endsWith('/api/seller/orders/'+order.id+'/status')&&r.request().method()==='PATCH');
      await row.locator('.order-status-select').selectOption(status);
      assert.equal((await changed).status(),200);
      await row.locator('.status.'+status).waitFor();
    }
    await screenshot(sellerPage,'seller-orders');
    await adminPage.reload();
    await adminPage.locator('[data-view=orders]').click();
    for(const status of ['shipping','completed']) {
      const row=adminPage.locator('#admin-orders tr').filter({hasText:order.code});
      await row.waitFor();
      const changed=adminPage.waitForResponse(r=>r.url().endsWith('/api/admin/orders/'+order.id+'/status')&&r.request().method()==='PATCH');
      await row.locator('.order-status-select').selectOption(status);
      assert.equal((await changed).status(),200);
      await row.locator('.status.'+status).waitFor();
    }
    await customerPage.locator('#refresh-orders').click();
    await customerPage.locator(`.order-card[data-order-id="${order.id}"][data-order-status=completed]`).waitFor();
    const stored=await prisma.orders.findUnique({where:{order_id:order.id},include:{payments:true}});
    assert.equal(stored.status,'completed');
    assert.equal(stored.payments.payment_status,'paid');
    await screenshot(customerPage,'customer-order-completed');
  });

  await t.test('mobile guest and seller panels fit the viewport',async()=>{
    await guestPage.setViewportSize({width:390,height:844});
    await guestPage.goto(base+'/guest-panel.html');
    await guestPage.locator('#category-grid a').filter({hasText:categoryName}).waitFor();
    await screenshot(guestPage,'guest-mobile');
    assert.ok(await guestPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Guest page overflows mobile viewport');
    await sellerPage.setViewportSize({width:390,height:844});
    await sellerPage.locator('[data-view=products]').click();
    await screenshot(sellerPage,'seller-mobile');
    assert.ok(await sellerPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Seller page overflows mobile viewport');
  });
  assert.deepEqual(failures,[],'Browser page errors: '+failures.join('; '));
});
