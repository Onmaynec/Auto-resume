import test from 'node:test'; import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8'); const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
test('locale selector and translation attributes are present', () => { assert.match(html, /id="localeSelect"/); assert.match(html, /data-i18n="hero\.title"/); assert.match(html, /data-i18n-placeholder="vacancy\.placeholder"/); });
test('service worker includes the i18n module', () => { assert.match(worker, /js\/i18n\.mjs/); assert.match(worker, /v\$\{APP_VERSION\}-shell/); });
