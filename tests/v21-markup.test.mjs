import test from 'node:test'; import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8'); const css = await readFile(new URL('../v21.css', import.meta.url), 'utf8');
test('theme, history and comparison controls remain present', () => { for (const id of ['themeSelect', 'recentProfiles', 'clearRecentBtn', 'compareForm', 'compareUsername', 'compareResult']) assert.match(html, new RegExp(`id="${id}"`)); assert.match(html, /data-i18n="skip"/); assert.match(html, /v2\.4/); });
test('accessibility and reduced-motion styles exist', () => { assert.match(css, /focus-visible/); assert.match(css, /prefers-reduced-motion/); assert.match(css, /data-theme="light"/); });
