import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('v2 controls are present', () => {
  for (const id of ['vacancyText', 'analyzeVacancyBtn', 'languageHistoryChart', 'projectBuilder', 'shareBtn', 'atsPdfBtn']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Динамика активности/);
  assert.match(html, /История языков по месяцам/);
});

test('ATS print stylesheet and editable resume styles exist', () => {
  assert.match(css, /@media print/);
  assert.match(css, /resume-ats/);
  assert.match(css, /contenteditable/);
});
