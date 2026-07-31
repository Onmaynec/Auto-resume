import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('v1.1 controls and project builder are present', () => {
  for (const id of [
    'projectOptions', 'selectedProjects', 'selectedProjectCount',
    'templateSelect', 'editBtn', 'txtBtn', 'pdfBtn',
  ]) {
    assert.match(index, new RegExp(`id=["']${id}["']`));
  }
  assert.match(index, /Динамика активности/);
});

test('ATS print stylesheet keeps a dedicated printable root', () => {
  assert.match(styles, /#atsPrintRoot/);
  assert.match(styles, /@media print/);
  assert.match(styles, /body\.ats-printing/);
});
