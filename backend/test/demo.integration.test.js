const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const databaseUrl = process.env.TEST_DATABASE_URL;

test('free demo bootstraps safely and database images survive a fresh process', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to a dedicated MySQL database ending in _test.',
  timeout: 60000,
}, async t => {
  const selected = new URL(databaseUrl);
  assert.equal(selected.protocol, 'mysql:');
  assert.match(selected.pathname, /_test$/u);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const marker = randomUUID();
  const email = marker + '@example.test';
  const password = 'Demo-test-password-' + marker;
  const filename = marker + '.png';
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=';
  const expected = Buffer.from(image.split(',')[1], 'base64');
  let child;
  let storedName = filename;
  let sharedPrisma;
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const current = child;
    const exited = once(current, 'exit');
    current.kill('SIGTERM');
    await exited;
    child = null;
  }
  t.after(async () => {
    await stop();
    await prisma.uploaded_images.deleteMany({ where: { filename: storedName } });
    await prisma.users.deleteMany({ where: { email } });
    await prisma.$disconnect();
    if (sharedPrisma) await sharedPrisma.$disconnect();
  });
  async function start(adminPassword = password, extraEnv = {}) {
    child = spawn(process.execPath, ['scripts/start-demo.js'], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: databaseUrl, JWT_SECRET: marker + marker,
        NODE_ENV: 'development', PORT: '0', MEDIA_STORAGE: 'database', BOOTSTRAP_ADMIN: '1',
        ADMIN_EMAIL: email, ADMIN_PASSWORD: adminPassword, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Demo startup timed out: ' + output)), 25000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Demo exited (${code}): ${output}`)); });
      const collect = chunk => {
        output += chunk.toString();
        const match = output.match(/SopPe Fake demo running on port (\d+)/);
        if (match) { clearTimeout(timer); resolve('http://127.0.0.1:' + match[1]); }
      };
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
    });
  }
  let base = await start();
  const first = await prisma.users.findUnique({ where: { email } });
  assert.equal(first.role, 'admin');
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  process.env.DATABASE_URL = databaseUrl;
  process.env.MEDIA_STORAGE = 'database';
  sharedPrisma = require('../src/config/database');
  const { saveImages } = require('../src/controllers/media.util');
  await assert.rejects(saveImages([image, 'data:image/png;base64,PGh0bWw+']), { status: 400 });
  const urls = await saveImages([image]);
  storedName = path.basename(urls[0]);
  assert.equal(fs.existsSync(path.join(__dirname, '../public/products', storedName)), false);
  const before = await fetch(base + urls[0]);
  assert.equal(before.status, 200);
  assert.deepEqual(Buffer.from(await before.arrayBuffer()), expected);
  await stop();

  base = await start('A-different-password-that-must-not-replace-the-original');
  const second = await prisma.users.findUnique({ where: { email } });
  assert.equal(second.password_hash, first.password_hash);
  const after = await fetch(base + urls[0]);
  assert.equal(after.status, 200);
  assert.equal(after.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await after.arrayBuffer()), expected);
  assert.equal((await fetch(base + '/products/' + filename)).status, 404);
  await stop();

  // A failed migration must keep the HTTP server offline.
  await assert.rejects(start(password, { DATABASE_URL: 'mysql://invalid:invalid@127.0.0.1:1/not_running_test?connect_timeout=1' }), /Demo exited/);
});
