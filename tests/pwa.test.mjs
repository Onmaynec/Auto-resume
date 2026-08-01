import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');

test('PWA manifest is connected and install controls exist', () => {
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /id="installBtn"/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.length > 0);
});

test('service worker caches the shell but bypasses GitHub API proxy', () => {
  assert.match(worker, /APP_SHELL/);
  assert.match(worker, /pathname\.startsWith\('\/api\/'\)/);
  assert.match(worker, /fetch\(request\)/);
  assert.match(worker, /CLEAR_RUNTIME_CACHE/);
});

test('workspace controls are present', () => {
  for (const id of ['draftName', 'saveDraftBtn', 'draftList', 'exportBackupBtn', 'importBackupInput', 'clearProfileCacheBtn']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
