import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const resumeModule = await readFile(new URL('../js/resume.js', import.meta.url), 'utf8');

test('DOCX and Markdown export controls are present and localized', () => {
  for (const id of ['docxBtn', 'markdownBtn']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-i18n="editor\.docx"/);
  assert.match(html, /data-i18n="editor\.markdown"/);
});

test('export module is connected to the UI and offline shell', () => {
  assert.match(resumeModule, /buildResumeDocx/);
  assert.match(resumeModule, /buildResumeMarkdown/);
  assert.match(worker, /js\/docx-export\.mjs/);
  assert.match(worker, /v3\.0-shell/);
});
