const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const databaseUrl = process.env.TEST_DATABASE_URL;

test('seller multi-SKU lifecycle preserves identity, reserved stock and cart isolation', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to a dedicated MySQL database ending in _test.', timeout: 90000,
}, async t => {
  const parsed = new URL(databaseUrl);
  assert.equal(parsed.protocol, 'mysql:');
  assert.match(parsed.pathname, /_test$/u);
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET ||= randomUUID() + randomUUID();
  const prisma = require('../src/config/database');
  const bcrypt = require('bcrypt');
  const app = require('../src/server');
  const marker = 'sku_' + randomUUID().replaceAll('-', '').slice(0, 12), password = 'Multi-SKU-only-test-123!';
  const hash = await bcrypt.hash(password, 12);
  const userIds = [], shopIds = [], productIds = [];
  let server, category;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    const carts = await prisma.carts.findMany({ where: { user_id: { in: userIds } } });
    await prisma.cart_items.deleteMany({ where: { cart_id: { in: carts.map(cart => cart.cart_id) } } });
    await prisma.carts.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.product_media.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.product_category_map.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.inventories.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.product_variants.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.products.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.shops.deleteMany({ where: { shop_id: { in: shopIds } } });
    await prisma.sellers.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.users.deleteMany({ where: { user_id: { in: userIds } } });
    if (category) await prisma.categories.delete({ where: { category_id: category.category_id } });
    await prisma.$disconnect();
  });
  async function seed(suffix, role) {
    const user = await prisma.users.create({ data: { username: marker + suffix, full_name: marker, email: marker + suffix + '@example.test', password_hash: hash, role, status: 'active' } });
    userIds.push(user.user_id);
    if (role === 'seller') {
      const seller = await prisma.sellers.create({ data: { user_id: user.user_id, seller_name: marker, status: 'active' } });
      user.shop = await prisma.shops.create({ data: { seller_id: seller.seller_id, shop_name: marker + suffix, status: 'active' } });
      shopIds.push(user.shop.shop_id);
    }
    return user;
  }
  const admin = await seed('_admin', 'admin'), seller = await seed('_seller', 'seller'), other = await seed('_other', 'seller'), customer = await seed('_customer', 'customer');
  category = await prisma.categories.create({ data: { name: marker, status: 'active' } });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(url, cookie, method = 'GET', body) {
    const response = await fetch(base + url, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json(), response };
  }
  async function login(user) {
    const result = await request('/api/auth/login', null, 'POST', { email: user.email, password });
    assert.equal(result.status, 200);
    return result.response.headers.get('set-cookie').split(';')[0];
  }
  const adminCookie = await login(admin), sellerCookie = await login(seller), otherCookie = await login(other), customerCookie = await login(customer);
  const productBody = { name: marker, description: 'Multiple SKUs', shopId: seller.shop.shop_id, categoryId: category.category_id };
  let productId, firstId, secondId, thirdId, foreignVariant;
  const endpoint = () => '/api/seller/products/' + productId;
  async function owned() { return (await request('/api/seller/products', sellerCookie)).data.data.find(item => item.id === productId); }
  async function approve() { assert.equal((await request('/api/admin/products/' + productId + '/status', adminCookie, 'PATCH', { status: 'active' })).status, 200); }
  const rows = product => product.variants.map(variant => ({ id: variant.id, sku: variant.sku, price: variant.price, stock: variant.stock, status: variant.status }));

  await t.test('create several SKUs with independent prices and inventories in one product', async () => {
    const result = await request('/api/seller/products', sellerCookie, 'POST', { ...productBody, variants: [
      { sku: marker + '-M', price: 150000, stock: 10 },
      { sku: marker + '-L', price: 200000, stock: 8 },
      { sku: marker + '-XL', price: 180000, stock: 5 },
    ] });
    assert.equal(result.status, 201, JSON.stringify(result.data));
    productId = result.data.data.id; productIds.push(productId);
    const item = await owned();
    assert.equal(item.variants.length, 3);
    assert.equal(item.stock, 23); assert.equal(item.price, 150000); assert.equal(item.maxPrice, 200000);
    [firstId, secondId, thirdId] = item.variants.map(variant => variant.id);
    assert.deepEqual(item.variants.map(variant => variant.stock), [10, 8, 5]);
    assert.equal(item.status, 'draft');
  });
  await t.test('public detail and cart use the exact selected SKU and stock', async () => {
    await approve();
    const detail = await request('/api/products/' + productId);
    assert.equal(detail.data.data.variants.length, 3);
    assert.deepEqual(detail.data.data.variants.map(variant => Number(variant.price)), [150000, 200000, 180000]);
    const listed = (await request('/api/products?q=' + marker)).data.data.find(item => item.id === productId);
    assert.equal(Number(listed.price), 150000); assert.equal(Number(listed.maxPrice), 200000);
    for (const variantId of [firstId, secondId]) assert.equal((await request('/api/cart', customerCookie, 'POST', { product_id: productId, variant_id: variantId, quantity: 2 })).status, 200);
    const cart = (await request('/api/cart', customerCookie)).data.data;
    assert.equal(cart.cart_items.length, 2);
    assert.deepEqual(cart.cart_items.map(item => item.variant_id), [firstId, secondId]);
    assert.deepEqual(cart.cart_items.map(item => Number(item.added_price)), [150000, 200000]);
    assert.equal((await request('/api/cart', customerCookie, 'POST', { product_id: productId, variant_id: firstId, quantity: 20 })).status, 400);
  });
  await t.test('reject invalid, empty, duplicate and oversized SKU lists without partial product creation', async () => {
    const good = { sku: marker + '-INVALID', price: 10, stock: 1 };
    for (const variants of [[], null, {}, [good, { ...good, sku: good.sku.toLowerCase() }], [{ ...good, price: 0 }], [{ ...good, stock: -1 }], [{ ...good, status: 'inactive' }], Array.from({ length: 33 }, (_, i) => ({ ...good, sku: good.sku + i }))]) {
      assert.equal((await request('/api/seller/products', sellerCookie, 'POST', { ...productBody, name: marker + '_invalid', variants })).status, 400);
    }
    assert.equal(await prisma.products.count({ where: { name: marker + '_invalid' } }), 0);
  });
  await t.test('failed stock reduction rolls back metadata and SKU changes, preserving reserved stock', async () => {
    const inv = await prisma.inventories.findFirst({ where: { variant_id: firstId } });
    await prisma.inventories.update({ where: { inventory_id: inv.inventory_id }, data: { reserved_quantity: 3 } });
    const item = await owned(), changes = rows(item); changes[0].stock = 2; changes[0].price = 1;
    const result = await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, name: 'Must roll back', variants: changes });
    assert.equal(result.status, 400);
    const after = await owned();
    assert.equal(after.name, marker); assert.equal(after.status, 'active');
    assert.equal(after.variants[0].price, 150000); assert.equal(after.variants[0].stock, 10); assert.equal(after.variants[0].reserved, 3);
  });
  await t.test('edit existing SKUs, add an auto-generated code and stop one SKU without replacing IDs', async () => {
    const item = await owned(), changes = rows(item);
    changes[0].price = 160000; changes[0].stock = 5; changes[1].stock = 7; changes[2].status = 'inactive';
    changes.push({ sku: '', price: 220000, stock: 4 });
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: changes })).status, 200);
    const after = await owned();
    assert.equal(after.status, 'draft'); assert.equal(after.variants.length, 4);
    assert.deepEqual(after.variants.slice(0, 3).map(variant => variant.id), [firstId, secondId, thirdId]);
    assert.match(after.variants[3].sku, new RegExp('^SKU-' + productId + '-'));
    assert.equal(after.variants[0].reserved, 3);
    await approve();
    const detail = (await request('/api/products/' + productId)).data.data;
    assert.equal(detail.variants.length, 3);
    assert.ok(!detail.variants.some(variant => variant.variant_id === thirdId));
    assert.equal(detail.variants.find(variant => variant.variant_id === firstId).stock, 2);
    assert.equal(detail.stock, 13);
  });
  await t.test('omitting a saved SKU retires it while retaining the existing cart item', async () => {
    const item = await owned();
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: rows(item).filter(variant => variant.id !== secondId) })).status, 200);
    await approve();
    const retired = await prisma.product_variants.findUnique({ where: { variant_id: secondId } });
    assert.equal(retired.status, 'inactive');
    const cart = (await request('/api/cart', customerCookie)).data.data;
    const itemInCart = cart.cart_items.find(item => item.variant_id === secondId);
    assert.ok(itemInCart); assert.equal(itemInCart.available, false);
    assert.equal((await request('/api/cart', customerCookie, 'POST', { product_id: productId, variant_id: secondId, quantity: 1 })).status, 404);
    const again = await owned(), restored = rows(again); restored.find(variant => variant.id === secondId).status = 'active';
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: restored })).status, 200);
  });
  await t.test('SKU code swaps preserve IDs and legacy single-SKU updates do not retire other variants', async () => {
    const item = await owned(), changes = rows(item), originalCodes = changes.slice(0, 2).map(row => row.sku);
    [changes[0].sku, changes[1].sku] = [changes[1].sku, changes[0].sku];
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: changes })).status, 200);
    const afterSwap = await owned();
    assert.deepEqual(afterSwap.variants.slice(0, 2).map(row => row.sku), originalCodes.reverse());
    const activeIds = afterSwap.variants.filter(row => row.status === 'active').map(row => row.id);
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, price: 165000, stock: 5, sku: '' })).status, 200);
    const afterLegacy = await owned();
    assert.deepEqual(afterLegacy.variants.filter(row => row.status === 'active').map(row => row.id), activeIds);
    assert.equal(afterLegacy.variants[0].price, 165000);
    assert.equal(afterLegacy.variants[0].sku, afterSwap.variants[0].sku);
  });
  await t.test('foreign variant IDs, duplicate IDs and global SKU collisions cannot cross product ownership', async () => {
    const created = await request('/api/seller/products', otherCookie, 'POST', { name: marker + '_foreign', shopId: other.shop.shop_id, price: 100, stock: 1, sku: marker + '-FOREIGN' });
    assert.equal(created.status, 201); productIds.push(created.data.data.id);
    foreignVariant = await prisma.product_variants.findFirst({ where: { product_id: created.data.data.id } });
    const item = await owned(), changes = rows(item);
    for (const variants of [[{ ...changes[0], id: foreignVariant.variant_id }], [changes[0], changes[0]]]) {
      assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants })).status, 400);
    }
    assert.equal((await request(endpoint(), otherCookie, 'PATCH', { ...productBody, variants: changes })).status, 404);
    changes[0].sku = foreignVariant.sku;
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: changes })).status, 409);
    const after = await owned();
    assert.equal(after.variants[0].sku, item.variants[0].sku);
    assert.equal((await prisma.product_variants.findUnique({ where: { variant_id: foreignVariant.variant_id } })).sku, foreignVariant.sku);
  });
  await t.test('multiple inventory rows retain their reservations when total stock is edited', async () => {
    await prisma.inventories.create({ data: { product_id: productId, variant_id: firstId, quantity: 9, reserved_quantity: 4 } });
    const item = await owned(), changes = rows(item); changes[0].stock = 8;
    assert.equal(item.variants[0].stock, 14); assert.equal(item.variants[0].reserved, 7);
    assert.equal((await request(endpoint(), sellerCookie, 'PATCH', { ...productBody, variants: changes })).status, 200);
    const inventories = await prisma.inventories.findMany({ where: { variant_id: firstId } });
    assert.equal(inventories.reduce((sum, row) => sum + row.quantity, 0), 8);
    assert.equal(inventories.reduce((sum, row) => sum + row.reserved_quantity, 0), 7);
    assert.ok(inventories.every(row => row.quantity >= row.reserved_quantity));
  });
});
