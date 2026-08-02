import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const html = read('index.html');
const worker = read('sw.js');
const versionModule = read('js/version.mjs');
const updateModule = read('js/update.mjs');
const updateCss = read('update.css');
const releaseWorkflow = read('.github/workflows/release.yml');

test('v3.3 version metadata is consistent', () => {
  assert.equal(packageJson.version, '3.3.0');
  assert.match(versionModule, /APP_VERSION = '3\.3\.0'/);
  assert.match(versionModule, /syncVersionMetadata/);
  assert.match(versionModule, /brandVersion\.textContent/);
  assert.match(worker, /APP_VERSION = '3\.3\.0'/);
  assert.match(read('CHANGELOG.md'), /## v3\.3\.0 — 2026-08-02/);
  assert.match(read('README.md'), /Auto Resume v3\.3/);
});

test('update UI and browser module are connected safely', () => {
  for (const id of ['updateBanner', 'updateMessage', 'updateNotes', 'updateApplyBtn', 'updateLaterBtn', 'updateStatus']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /js\/update\.mjs/);
  assert.match(html, /update\.css/);
  assert.match(updateModule, /textContent/);
  assert.doesNotMatch(updateModule, /innerHTML/);
  assert.match(versionModule, /releases\/latest/);
  assert.match(updateCss, /prefers-reduced-motion/);
});

test('service worker waits for confirmation and caches the update manager and template system', () => {
  assert.match(worker, /auto-resume-v\$\{APP_VERSION\}-shell/);
  assert.match(worker, /js\/update\.mjs/);
  assert.match(worker, /js\/version\.mjs/);
  assert.match(worker, /js\/template-system\.mjs/);
  assert.match(worker, /update\.css/);
  assert.match(worker, /SKIP_WAITING/);
  const installBlock = worker.match(/self\.addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] || '';
  assert.ok(installBlock);
  assert.doesNotMatch(installBlock, /skipWaiting/);
  assert.match(worker, /pathname\.startsWith\('\/api\/'\)/);
});

test('release workflow is verified, idempotent and manually runnable', () => {
  assert.match(releaseWorkflow, /workflow_dispatch:/);
  assert.match(releaseWorkflow, /contents: write/);
  assert.match(releaseWorkflow, /npm run verify/);
  assert.match(releaseWorkflow, /git ls-remote/);
  assert.match(releaseWorkflow, /gh release view/);
  assert.match(releaseWorkflow, /gh release create/);
  assert.match(releaseWorkflow, /\^\(0\|\[1-9\]\[0-9\]\*\)/);
});
