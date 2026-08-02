import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.7 application tracker is connected to syntax checks and offline shell', async () => {
  const [packageSource, versionSource, serviceWorker] = await Promise.all([
    read('package.json'),
    read('js/version.mjs'),
    read('sw.js'),
  ]);
  const packageJson = JSON.parse(packageSource);
  assert.equal(packageJson.version, '3.7.0');
  for (const file of ['js/application-tracker.mjs', 'js/application-tracker-ui.mjs']) {
    assert.ok(packageJson.scripts.check.includes(`node --check ${file}`), `${file} must be syntax checked`);
    assert.ok(serviceWorker.includes(`./${file}`), `${file} must be cached`);
  }
  assert.match(serviceWorker, /\.\/application-tracker\.css/);
  assert.match(versionSource, /APP_VERSION = '3\.7\.0'/);
  assert.match(versionSource, /import\('\.\/application-tracker-ui\.mjs'\)/);
});

test('tracker keeps a separate local schema and stays outside public payloads and APIs', async () => {
  const [engine, ui, workspace, share, api] = await Promise.all([
    read('js/application-tracker.mjs'),
    read('js/application-tracker-ui.mjs'),
    read('js/workspace.mjs'),
    read('js/share.mjs'),
    read('api/github.js'),
  ]);
  assert.match(engine, /APPLICATION_TRACKER_KEY = 'auto-resume:application-tracker:v1'/);
  assert.match(ui, /localStorage/);
  assert.doesNotMatch(ui, /\bfetch\s*\(|\bsessionStorage\b/);
  assert.doesNotMatch(`${workspace}\n${share}\n${api}`, /applicationTracker|application-tracker|jobApplications/i);
  assert.doesNotMatch(ui, /state\.resumeDraft|vacancyText|applicationKit|auditReport/);
  assert.match(ui, /draft: draft \? \{ id: draft\.id, name: draft\.name \} : null/);
});

test('tracker UI is localized, accessible and supports local lifecycle operations', async () => {
  const [ui, css, docs] = await Promise.all([
    read('js/application-tracker-ui.mjs'),
    read('application-tracker.css'),
    read('docs/APPLICATION_TRACKER.md'),
  ]);
  assert.match(ui, /id = 'applicationTrackerPanel'/);
  assert.match(ui, /aria-labelledby/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /data-tracker-export="json"/);
  assert.match(ui, /data-tracker-export="csv"/);
  assert.match(ui, /parseApplicationTrackerBackup/);
  assert.match(ui, /shared-view/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(docs, /Privacy boundary/);
  assert.match(docs, /CSV injection/);
});

test('release documentation describes v3.7 tracker behavior', async () => {
  const [readme, changelog] = await Promise.all([read('README.md'), read('CHANGELOG.md')]);
  assert.match(readme, /Auto Resume v3\.7/);
  assert.match(readme, /Application Tracker/);
  assert.match(readme, /docs\/APPLICATION_TRACKER\.md/);
  assert.match(changelog, /## v3\.7\.0/);
  assert.match(changelog, /follow-up/i);
});
