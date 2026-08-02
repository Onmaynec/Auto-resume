import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const worker = read('sw.js');
const versionModule = read('js/version.mjs');
const uiModule = read('js/application-kit-ui.mjs');
const workspace = read('js/workspace.mjs');
const share = read('js/share.mjs');

test('application kit remains connected to source checks and offline shell', () => {
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
  assert.match(packageJson.scripts.check, /js\/application-kit\.mjs/);
  assert.match(packageJson.scripts.check, /js\/application-kit-ui\.mjs/);
  assert.match(worker, /application-kit\.css/);
  assert.match(worker, /js\/application-kit\.mjs/);
  assert.match(worker, /js\/application-kit-ui\.mjs/);
  assert.match(worker, new RegExp(`APP_VERSION = '${packageJson.version.replaceAll('.', '\\.')}';`));
  assert.match(versionModule, new RegExp(`APP_VERSION = '${packageJson.version.replaceAll('.', '\\.')}';`));
  assert.match(versionModule, /application-kit-ui\.mjs/);
});

test('application kit stays in memory and does not enter draft or public payload modules', () => {
  assert.doesNotMatch(workspace, /applicationKit|vacancyText/i);
  assert.doesNotMatch(share, /applicationKit|vacancyText/i);
  assert.doesNotMatch(uiModule, /localStorage|sessionStorage|fetch\s*\(/);
  assert.match(uiModule, /navigator\.clipboard/);
  assert.match(uiModule, /URL\.createObjectURL/);
});

test('application kit UI is editable, localized and privacy-labelled', () => {
  assert.match(uiModule, /applicationKitEditor/);
  assert.match(uiModule, /spellcheck="true"/);
  assert.match(uiModule, /Исходный текст вакансии не сохраняется/);
  assert.match(uiModule, /original vacancy text is not stored/);
  assert.match(uiModule, /APPLICATION_KIT_TONES/);
});
