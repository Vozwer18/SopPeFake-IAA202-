const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL, fileURLToPath} = require('node:url');
const frontend = path.resolve(__dirname, '../../frontend');

test('HTML assets and local page links resolve beside the downloaded HTML files', () => {
  for (const name of fs.readdirSync(frontend).filter(name => name.endsWith('.html'))) {
    const base = pathToFileURL(path.join(frontend, name));
    const html = fs.readFileSync(fileURLToPath(base), 'utf8');
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|#)/.test(reference)) continue;
      const target = new URL(reference, base);
      assert.ok(fs.existsSync(fileURLToPath(target)), `${name}: missing ${reference}`);
      assert.ok(fileURLToPath(target).startsWith(frontend + path.sep), `${name}: escapes frontend: ${reference}`);
    }
  }
});

test('panel brand links open the storefront instead of reloading the panel', () => {
  for (const name of ['admin-panel.html', 'seller-panel.html']) {
    const html = fs.readFileSync(path.join(frontend, name), 'utf8');
    assert.match(html, /class="brand" href="index.html"/);
  }
});
