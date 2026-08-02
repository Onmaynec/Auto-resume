import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.8 interview prep is connected to syntax checks and offline shell', async () => {
  const [packageSource, versionSource, serviceWorker] = await Promise.all([read('package.json'), read('js/version.mjs'), read('sw.js')]);
  const packageJson = JSON.parse(packageSource);
  assert.equal(packageJson.version, '3.8.0');
  for (const file of ['js/interview-prep.mjs', 'js/interview-prep-ui.mjs', 'js/interview-prep-sync.mjs']) {
    assert.ok(packageJson.scripts.check.includes(`node --check ${file}`), `${file} must be syntax checked`);
    assert.ok(serviceWorker.includes(`./${file}`), `${file} must be cached`);
  }
  assert.match(serviceWorker, /\.\/interview-prep\.css/);
  assert.match(versionSource, /APP_VERSION = '3\.8\.0'/);
  assert.match(versionSource, /import\('\.\/interview-prep-ui\.mjs'\)/);
  assert.match(versionSource, /import\('\.\/interview-prep-sync\.mjs'\)/);
});

test('prep data has its own local schema and stays outside public payloads and APIs', async () => {
  const [engine, ui, sync, workspace, share, api] = await Promise.all([read('js/interview-prep.mjs'), read('js/interview-prep-ui.mjs'), read('js/interview-prep-sync.mjs'), read('js/workspace.mjs'), read('js/share.mjs'), read('api/github.js')]);
  assert.match(engine, /INTERVIEW_PREP_KEY = 'auto-resume:interview-prep:v1'/);
  assert.match(ui, /localStorage/);
  assert.doesNotMatch(`${ui}\n${sync}`, /\bfetch\s*\(|\bsessionStorage\b/);
  assert.doesNotMatch(`${workspace}\n${share}\n${api}`, /interviewPrep|interview-prep|starStories/i);
  assert.doesNotMatch(`${engine}\n${ui}`, /state\.resumeDraft|vacancyText|applicationKit|auditReport/);
  assert.match(ui, /application: application \? \{ id: application\.id, company: application\.company, role: application\.role \} : null/);
  assert.match(sync, /#applicationTrackerPanel/);
  assert.match(sync, /#interviewPrepApplication/);
  assert.match(sync, /TRACKER_KEY/);
  assert.doesNotMatch(sync, /StorageEvent|dispatchEvent/);
});

test('interview prep UI is localized, accessible and exportable', async () => {
  const [ui, css, docs] = await Promise.all([read('js/interview-prep-ui.mjs'), read('interview-prep.css'), read('docs/INTERVIEW_PREP.md')]);
  assert.match(ui, /id = 'interviewPrepPanel'/);
  assert.match(ui, /aria-labelledby/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /data-prep-export="md"/);
  assert.match(ui, /data-prep-export="json"/);
  assert.match(ui, /parseInterviewPrepBackup/);
  assert.match(ui, /shared-view/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(docs, /Privacy boundary/);
  assert.match(docs, /Readiness model/);
});

test('release documentation describes v3.8 interview preparation', async () => {
  const [readme, changelog] = await Promise.all([read('README.md'), read('CHANGELOG.md')]);
  assert.match(readme, /Auto Resume v3\.8/);
  assert.match(readme, /Interview Prep Lab/);
  assert.match(readme, /docs\/INTERVIEW_PREP\.md/);
  assert.match(changelog, /## v3\.8\.0/);
  assert.match(changelog, /STAR/i);
});
