import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.6 resume audit is connected to source checks and offline shell', async () => {
  const [packageSource, versionSource, serviceWorker] = await Promise.all([
    read('package.json'),
    read('js/version.mjs'),
    read('sw.js'),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.equal(packageJson.version, '3.6.0');
  for (const file of ['js/resume-audit.mjs', 'js/resume-audit-ui.mjs', 'js/resume-audit-bootstrap.mjs']) {
    assert.ok(packageJson.scripts.check.includes(`node --check ${file}`), `${file} must be syntax checked`);
    assert.ok(serviceWorker.includes(`./${file}`), `${file} must be cached`);
  }
  assert.match(serviceWorker, /\.\/resume-audit\.css/);
  assert.match(versionSource, /APP_VERSION = '3\.6\.0'/);
  assert.match(versionSource, /import\('\.\/resume-audit-bootstrap\.mjs'\)/);
});

test('audit report remains memory-only and outside drafts and public payloads', async () => {
  const [engine, ui, bootstrap, workspace, share] = await Promise.all([
    read('js/resume-audit.mjs'),
    read('js/resume-audit-ui.mjs'),
    read('js/resume-audit-bootstrap.mjs'),
    read('js/workspace.mjs'),
    read('js/share.mjs'),
  ]);

  assert.doesNotMatch(`${engine}\n${ui}\n${bootstrap}`, /\bfetch\s*\(/);
  assert.doesNotMatch(`${ui}\n${bootstrap}`, /\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(`${workspace}\n${share}`, /resumeAudit|auditReport|resume-audit/i);
  assert.match(bootstrap, /state\.vacancyAnalysis\?\.requirements/);
  assert.doesNotMatch(bootstrap, /vacancyText/);
});

test('audit UI is editable-safe, accessible and exportable', async () => {
  const [ui, css, docs] = await Promise.all([
    read('js/resume-audit-ui.mjs'),
    read('resume-audit.css'),
    read('docs/RESUME_AUDIT.md'),
  ]);

  assert.match(ui, /id = 'resumeAuditPanel'/);
  assert.match(ui, /aria-labelledby/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /data-audit-action="copy"/);
  assert.match(ui, /data-audit-action="markdown"/);
  assert.match(ui, /data-audit-action="text"/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(docs, /Stable issue codes/);
  assert.match(docs, /Privacy boundary/);
});

test('release documentation describes the v3.6 privacy boundary', async () => {
  const [readme, changelog] = await Promise.all([read('README.md'), read('CHANGELOG.md')]);

  assert.match(readme, /Auto Resume v3\.6/);
  assert.match(readme, /Resume Quality Audit/);
  assert.match(readme, /docs\/RESUME_AUDIT\.md/);
  assert.match(changelog, /## v3\.6\.0/);
  assert.match(changelog, /audit report/i);
});
