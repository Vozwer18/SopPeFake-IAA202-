const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const databaseUrl = process.env.TEST_DATABASE_URL;
test('QR checkout, stock reservations, seller confirmations, receipt and verified reviews', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to a dedicated MySQL database ending in _test.', timeout: 90000,
}, async t => {
  assert.match(new URL(databaseUrl).pathname, /_test$/u);
  assert.equal(new URL(databaseUrl).protocol, 'mysql:');
  process.env.DATABASE_URL = databaseUrl; process.env.MEDIA_STORAGE = 'database'; process.env.NODE_ENV = 'development';
  process.env.JWT_SECRET ||= randomUUID() + randomUUID();
  const prisma = require('../src/config/database'), app = require('../src/server'), bcrypt = require('bcrypt');
  const marker = 'order_' + randomUUID().replaceAll('-', '').slice(0, 10), password = 'QR-order-only-test-123!';
  const userIds = [], shopIds = [], productIds = [], imageNames = [];
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    const orders = await prisma.orders.findMany({ where: { user_id: { in: userIds } } }), ids = orders.map(order => order.order_id);
    await prisma.reviews.deleteMany({ where: { order_id: { in: ids } } });
    await prisma.payments.deleteMany({ where: { order_id: { in: ids } } });
    await prisma.order_status_history.deleteMany({ where: { order_id: { in: ids } } });
    await prisma.order_items.deleteMany({ where: { order_id: { in: ids } } });
    await prisma.orders.deleteMany({ where: { order_id: { in: ids } } });
    await prisma.addresses.deleteMany({ where: { user_id: { in: userIds } } });
    const carts = await prisma.carts.findMany({ where: { user_id: { in: userIds } } });
    await prisma.cart_items.deleteMany({ where: { cart_id: { in: carts.map(cart => cart.cart_id) } } });
    await prisma.carts.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.inventories.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.product_variants.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.products.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.shops.deleteMany({ where: { shop_id: { in: shopIds } } });
    await prisma.sellers.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.users.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.uploaded_images.deleteMany({ where: { filename: { in: imageNames } } });
    await prisma.$disconnect();
  });
  const hash = await bcrypt.hash(password, 10);
  async function seed(role, suffix) {
    const user = await prisma.users.create({ data: { username: marker + suffix, full_name: marker + suffix, email: marker + suffix + '@example.test', password_hash: hash, role, status: 'active' } });
    userIds.push(user.user_id);
    if (role === 'seller') {
      user.seller = await prisma.sellers.create({ data: { user_id: user.user_id, seller_name: marker + suffix, status: 'active' } });
      user.shop = await prisma.shops.create({ data: { seller_id: user.seller.seller_id, shop_name: marker + suffix, status: 'active' } });
      shopIds.push(user.shop.shop_id);
    }
    return user;
  }
  const sellerA = await seed('seller', '_sa'), sellerB = await seed('seller', '_sb'), buyer = await seed('customer', '_buyer'), other = await seed('customer', '_other'), admin = await seed('admin', '_admin');
  const noQrShop = await prisma.shops.create({ data: { seller_id: sellerB.seller.seller_id, shop_name: marker + '_noqr', status: 'active' } }); shopIds.push(noQrShop.shop_id);
  async function product(shop, suffix, price, stock, reserved = 0) {
    const p = await prisma.products.create({ data: { shop_id: shop.shop_id, name: marker + suffix, status: 'active', sold_quantity: null } }); productIds.push(p.product_id);
    const v = await prisma.product_variants.create({ data: { product_id: p.product_id, sku: marker + suffix, price: String(price), status: 'active' } });
    const inventory = await prisma.inventories.create({ data: { product_id: p.product_id, variant_id: v.variant_id, quantity: stock, reserved_quantity: reserved } });
    return { ...p, variant: v, inventory };
  }
  const a = await product(sellerA.shop, '_a', 100, 12, 1), b = await product(sellerB.shop, '_b', 200, 10), unready = await product(noQrShop, '_noqr', 10, 5), limited = await product(sellerA.shop, '_last', 70, 1), costly = await product(sellerA.shop, '_costly', 999999999999, 3);
  server = app.listen(0, '127.0.0.1'); await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(url, cookie, method = 'GET', body) {
    const response = await fetch(base + url, { method, redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null, response };
  }
  async function login(user) {
    const r = await request('/api/auth/login', null, 'POST', { email: user.email, password }); assert.equal(r.status, 200);
    return r.response.headers.get('set-cookie').split(';')[0];
  }
  const sa = await login(sellerA), sb = await login(sellerB), bc = await login(buyer), oc = await login(other), ac = await login(admin);
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=';
  async function qr(cookie, shop) {
    const r = await request('/api/seller/shops/' + shop.shop_id + '/payment-qr', cookie, 'PUT', { image }); assert.equal(r.status, 200, JSON.stringify(r.data));
    imageNames.push(require('node:path').basename(r.data.data.qrUrl)); return r.data.data.qrUrl;
  }
  async function add(cookie, p, quantity = 1) { const r = await request('/api/cart', cookie, 'POST', { product_id: p.product_id, variant_id: p.variant.variant_id, quantity }); assert.equal(r.status, 200, JSON.stringify(r.data)); }
  const address = { name: 'Test recipient', phone: '0900000000', province: 'Test province', district: 'Test district', ward: 'Test ward', detail: '123 Test street' };
  async function body(cookie) { return { cartId: (await request('/api/cart', cookie)).data.data.cart_id, checkoutKey: randomUUID(), address, total: 1, shippingFee: -500 }; }
  async function stock(p) { return prisma.inventories.findUnique({ where: { inventory_id: p.inventory.inventory_id } }); }
  async function transition(cookie, orderId, action, seller = false) { return request(`${seller ? '/api/seller/orders' : '/api/orders'}/${orderId}/${action}`, cookie, 'POST'); }
  async function finish(cookie, sellerCookie, order) {
    assert.equal((await transition(sellerCookie, order.id, 'paid', true)).status, 200);
    assert.equal((await transition(sellerCookie, order.id, 'shipped', true)).status, 200);
    assert.equal((await transition(cookie, order.id, 'received')).status, 200);
  }
  async function clear(cookie) { const r = await request('/api/cart', cookie); for (const item of r.data.data?.cart_items || []) await request('/api/cart/item/' + item.cart_item_id, cookie, 'DELETE'); }
  let qrA, qrB, firstBody, orderA, orderB;

  await t.test('only an owning seller uploads validated QR images; orders endpoints enforce roles', async () => {
    for (const cookie of [bc, ac]) assert.equal((await request('/api/seller/shops/' + sellerA.shop.shop_id + '/payment-qr', cookie, 'PUT', { image })).status, 403);
    assert.equal((await request('/api/seller/shops/' + sellerB.shop.shop_id + '/payment-qr', sa, 'PUT', { image })).status, 404);
    assert.equal((await request('/api/seller/shops/' + sellerA.shop.shop_id + '/payment-qr', sa, 'PUT', { image: 'data:image/png;base64,PGh0bWw+' })).status, 400);
    qrA = await qr(sa, sellerA.shop); qrB = await qr(sb, sellerB.shop);
    assert.equal((await fetch(base + qrA)).status, 200);
    assert.equal((await request('/api/orders')).status, 401);
    for (const cookie of [sa, ac]) assert.equal((await request('/api/orders', cookie)).status, 403);
    assert.equal((await request('/api/seller/orders', bc)).status, 403);
    assert.equal((await request('/orders.html', sa)).status, 302);
  });
  await t.test('missing QR rolls back an entire multi-shop checkout without reserving any goods', async () => {
    await add(oc, a); await add(oc, unready);
    const r = await request('/api/orders/checkout', oc, 'POST', await body(oc)); assert.equal(r.status, 409);
    assert.equal(await prisma.orders.count({ where: { user_id: other.user_id } }), 0);
    assert.equal(await prisma.addresses.count({ where: { user_id: other.user_id } }), 0);
    assert.equal((await stock(a)).reserved_quantity, 1); await clear(oc);
  });
  await t.test('checkout splits shops, snapshots QR/prices, ignores forged totals and reserves exact SKU stock', async () => {
    await add(bc, a, 2); await add(bc, b);
    firstBody = await body(bc);
    const r = await request('/api/orders/checkout', bc, 'POST', firstBody); assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(r.data.data.orders.length, 2);
    orderA = r.data.data.orders.find(order => order.items.some(item => item.productId === a.product_id));
    orderB = r.data.data.orders.find(order => order.items.some(item => item.productId === b.product_id));
    assert.equal(orderA.total, 200); assert.equal(orderB.total, 200); assert.equal(orderA.shippingFee, 0);
    assert.equal(orderA.qrUrl, qrA); assert.equal(orderB.qrUrl, qrB); assert.equal(orderA.paymentStatus, 'pending');
    assert.equal((await stock(a)).quantity, 12); assert.equal((await stock(a)).reserved_quantity, 3);
    assert.equal((await stock(b)).reserved_quantity, 1);
    assert.equal((await request('/api/cart', bc)).data.data, null);
  });
  await t.test('parallel retries do not duplicate orders or reservations; private orders cannot be accessed by others', async () => {
    const retries = await Promise.all([request('/api/orders/checkout', bc, 'POST', firstBody), request('/api/orders/checkout', bc, 'POST', firstBody)]);
    assert.ok(retries.every(r => r.status === 200 && r.data.data.replayed));
    assert.equal(await prisma.orders.count({ where: { user_id: buyer.user_id } }), 2); assert.equal((await stock(a)).reserved_quantity, 3);
    assert.equal((await request('/api/orders/checkout', oc, 'POST', firstBody)).status, 404);
    assert.equal((await request('/api/orders/checkout', bc, 'POST', { ...firstBody, checkoutKey: randomUUID() })).status, 409);
    assert.equal((await request('/api/orders', oc)).data.data.length, 0);
    assert.equal((await transition(sb, orderA.id, 'paid', true)).status, 404);
    assert.equal((await transition(oc, orderA.id, 'received')).status, 404);
    assert.equal((await transition(bc, orderA.id, 'received')).status, 409);
    assert.equal((await request('/api/orders/' + orderA.id + '/reviews', bc, 'POST', { productId: a.product_id, rating: 5 })).status, 403);
  });
  await t.test('QR changes affect future orders only; cancelling unpaid orders releases stock exactly once', async () => {
    const nextQr = await qr(sa, sellerA.shop); assert.notEqual(nextQr, qrA);
    assert.equal((await request('/api/orders', bc)).data.data.find(order => order.id === orderA.id).qrUrl, qrA);
    assert.equal((await fetch(base + qrA)).status, 200);
    await add(oc, a);
    const r = await request('/api/orders/checkout', oc, 'POST', await body(oc)); assert.equal(r.status, 201);
    const order = r.data.data.orders[0]; assert.equal(order.qrUrl, nextQr);
    assert.equal((await stock(a)).reserved_quantity, 4);
    assert.equal((await transition(oc, order.id, 'cancel')).status, 200);
    assert.equal((await transition(oc, order.id, 'cancel')).status, 200);
    assert.equal((await stock(a)).reserved_quantity, 3); assert.equal((await stock(a)).quantity, 12);
    assert.equal((await transition(sa, order.id, 'paid', true)).status, 409);
  });
  await t.test('seller must confirm payment before shipment; repeated actions never consume stock twice', async () => {
    assert.equal((await transition(sa, orderA.id, 'shipped', true)).status, 409);
    assert.equal((await transition(sa, orderA.id, 'paid', true)).status, 200);
    assert.equal((await transition(sa, orderA.id, 'paid', true)).status, 200);
    assert.equal((await transition(bc, orderA.id, 'cancel')).status, 409);
    assert.equal((await transition(sa, orderA.id, 'shipped', true)).status, 200);
    assert.equal((await transition(sa, orderA.id, 'shipped', true)).status, 200);
    assert.equal((await stock(a)).quantity, 10); assert.equal((await stock(a)).reserved_quantity, 1);
    assert.equal((await transition(bc, orderA.id, 'received')).status, 200);
    assert.equal((await transition(bc, orderA.id, 'received')).status, 200);
    assert.equal((await prisma.products.findUnique({ where: { product_id: a.product_id } })).sold_quantity, 2);
    assert.equal(await prisma.order_status_history.count({ where: { order_id: orderA.id } }), 4);
    assert.equal((await request('/api/orders', bc)).data.data.find(order => order.id === orderB.id).status, 'pending');
  });
  await t.test('only the receiving buyer can review purchased products once; ratings are public', async () => {
    for (const rating of [0, 6, 1.5]) assert.equal((await request('/api/orders/' + orderA.id + '/reviews', bc, 'POST', { productId: a.product_id, rating })).status, 400);
    assert.equal((await request('/api/orders/' + orderA.id + '/reviews', oc, 'POST', { productId: a.product_id, rating: 5 })).status, 404);
    assert.equal((await request('/api/orders/' + orderA.id + '/reviews', bc, 'POST', { productId: b.product_id, rating: 5 })).status, 403);
    const review = await request('/api/orders/' + orderA.id + '/reviews', bc, 'POST', { productId: a.product_id, rating: 5, comment: 'Received <b>great</b> goods' }); assert.equal(review.status, 201);
    assert.equal((await request('/api/orders/' + orderA.id + '/reviews', bc, 'POST', { productId: a.product_id, rating: 1 })).status, 409);
    const detail = (await request('/api/products/' + a.product_id)).data.data;
    assert.equal(Number(detail.rating), 5); assert.equal(detail.reviewCount, 1); assert.equal(detail.reviews[0].comment, 'Received <b>great</b> goods');
  });
  await t.test('simultaneous review submissions create only one review', async () => {
    await finish(bc, sb, orderB);
    const r = await Promise.all([4, 2].map(rating => request('/api/orders/' + orderB.id + '/reviews', bc, 'POST', { productId: b.product_id, rating })));
    assert.deepEqual(r.map(item => item.status).sort(), [201, 409]);
    assert.equal(await prisma.reviews.count({ where: { order_id: orderB.id } }), 1);
  });
  await t.test('another verified purchase updates average ratings and completed revenue', async () => {
    await add(oc, a);
    const r = await request('/api/orders/checkout', oc, 'POST', await body(oc)); assert.equal(r.status, 201);
    const order = r.data.data.orders[0]; await finish(oc, sa, order);
    assert.equal((await request('/api/orders/' + order.id + '/reviews', oc, 'POST', { productId: a.product_id, rating: 3 })).status, 201);
    const detail = (await request('/api/products/' + a.product_id)).data.data;
    assert.equal(Number(detail.rating), 4); assert.equal(detail.reviewCount, 2);
    assert.equal(Number((await prisma.shops.findUnique({ where: { shop_id: sellerA.shop.shop_id } })).rating), 4);
    assert.equal((await request('/api/seller/dashboard', sa)).data.data.stats.revenue, 300);
  });
  await t.test('concurrent checkout of the last unit cannot oversell', async () => {
    await add(bc, limited); await add(oc, limited);
    const left = await body(bc), right = await body(oc);
    const r = await Promise.all([request('/api/orders/checkout', bc, 'POST', left), request('/api/orders/checkout', oc, 'POST', right)]);
    assert.deepEqual(r.map(item => item.status).sort(), [201, 409]);
    assert.equal((await stock(limited)).reserved_quantity, 1); assert.equal((await stock(limited)).quantity, 1);
    const winner = r.findIndex(item => item.status === 201);
    assert.equal((await transition(winner === 0 ? bc : oc, r[winner].data.data.orders[0].id, 'cancel')).status, 200);
    assert.equal((await stock(limited)).reserved_quantity, 0);
    await clear(bc); await clear(oc);
  });
  await t.test('oversized totals fail before any order/address/stock write', async () => {
    await add(bc, costly, 2); const before = await prisma.orders.count({ where: { user_id: buyer.user_id } });
    assert.equal((await request('/api/orders/checkout', bc, 'POST', await body(bc))).status, 400);
    assert.equal(await prisma.orders.count({ where: { user_id: buyer.user_id } }), before);
    assert.equal((await stock(costly)).reserved_quantity, 0);
  });
  await t.test('legacy orders without a checkout token cannot consume reservations of new orders', async () => {
    const legacy = await prisma.orders.create({ data: {
      order_code: marker + '_legacy', user_id: buyer.user_id, address_id: (await prisma.orders.findUnique({ where: { order_id: orderA.id } })).address_id,
      subtotal: '100', total_amount: '100', status: 'pending',
      payments: { create: { amount: '100', payment_method: 'BANK', payment_status: 'pending' } },
      order_items: { create: { product_id: a.product_id, variant_id: a.variant.variant_id, shop_id: sellerA.shop.shop_id, product_name: a.name, quantity: 1, price: '100', subtotal: '100' } },
    } });
    const before = await stock(a);
    assert.equal((await transition(sa, legacy.order_id, 'paid', true)).status, 409);
    assert.equal((await transition(bc, legacy.order_id, 'cancel')).status, 409);
    assert.equal((await stock(a)).reserved_quantity, before.reserved_quantity);
    const view = (await request('/api/orders', bc)).data.data.find(order => order.id === legacy.order_id);
    assert.equal(view.canCancel, false); assert.equal(view.canConfirmPayment, false);
  });
});
