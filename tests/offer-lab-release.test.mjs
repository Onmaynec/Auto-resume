import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.9 offer lab is connected to release metadata and offline shell', async () => {
  const [packageSource, versionSource, serviceWorker, changelog] = await Promise.all([
    read('package.json'), read('js/version.mjs'), read('sw.js'), read('CHANGELOG.md'),
  ]);
  const packageJson = JSON.parse(packageSource);
  assert.equal(packageJson.version, '3.9.0');
  for (const file of ['js/offer-lab.mjs', 'js/offer-lab-ui.mjs']) {
    assert.ok(packageJson.scripts.check.includes(`node --check ${file}`), `${file} must be syntax checked`);
    assert.ok(serviceWorker.includes(`./${file}`), `${file} must be cached`);
  }
  assert.match(serviceWorker, /\.\/offer-lab\.css/);
  assert.match(versionSource, /APP_VERSION = '3\.9\.0'/);
  assert.match(versionSource, /import\('\.\/offer-lab-ui\.mjs'\)/);
  assert.match(changelog, /## v3\.9\.0 — 2026-08-03/);
});

test('offer data has a dedicated local schema and privacy boundary', async () => {
  const [engine, ui, workspace, share, api, docs] = await Promise.all([
    read('js/offer-lab.mjs'), read('js/offer-lab-ui.mjs'), read('js/workspace.mjs'), read('js/share.mjs'), read('api/github.js'), read('docs/OFFER_LAB.md'),
  ]);
  assert.match(engine, /OFFER_LAB_KEY = 'auto-resume:offer-lab:v1'/);
  assert.match(ui, /localStorage|storageRef/);
  assert.doesNotMatch(ui, /\bfetch\s*\(|\bsessionStorage\b/);
  assert.doesNotMatch(`${workspace}\n${share}\n${api}`, /offer-lab|offerLab|OFFER_LAB_KEY/);
  assert.match(docs, /never converts currencies/i);
  assert.match(docs, /public read-only mode/i);
});

test('offer UI is localized, accessible and exportable', async () => {
  const [ui, css] = await Promise.all([read('js/offer-lab-ui.mjs'), read('offer-lab.css')]);
  assert.match(ui, /id = 'offerLabPanel'/);
  assert.match(ui, /aria-labelledby/);
  assert.match(ui, /role=\"status\"/);
  assert.match(ui, /data-offer-export=\"comparison\"/);
  assert.match(ui, /data-offer-export=\"json\"/);
  assert.match(ui, /ru:/);
  assert.match(ui, /en:/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
