// Render Free has no pre-deploy hook or shell. Prepare the demo at startup.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const backend = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backend, '.env'), quiet: true });

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: backend, env: process.env, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Demo preparation failed; the web server was not started.');
}

try {
  require('../src/config/auth');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured.');
  if (!['filesystem', 'database'].includes(process.env.MEDIA_STORAGE || 'filesystem')) throw new Error('MEDIA_STORAGE must be filesystem or database.');
  if (process.env.BOOTSTRAP_ADMIN === '1' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD for BOOTSTRAP_ADMIN=1.');
  }
  run(require.resolve('prisma/build/index.js'), ['migrate', 'deploy']);
  if (process.env.BOOTSTRAP_ADMIN === '1') run(path.join(__dirname, 'create-admin.js'));
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_EMAIL;
  const app = require('../src/server');
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, '0.0.0.0', () => console.log(`SopPe Fake demo running on port ${server.address().port}`));
  process.once('SIGTERM', () => {
    server.close(async () => { await require('../src/config/database').$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(0), 10000).unref();
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
