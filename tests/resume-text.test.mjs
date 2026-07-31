import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeText, safeFilename } from '../js/resume-text.mjs';

test('ATS text export preserves project order and links', () => {
  const text = buildResumeText({
    name: 'Ada Lovelace', headline: 'Software Developer', contact: 'github.com/ada', about: 'About',
    projects: [
      { name: 'First', description: 'One', url: 'https://example.com/1' },
      { name: 'Second', description: 'Two', url: 'https://example.com/2' },
    ],
    skills: [{ name: 'JavaScript', percent: 60 }, { name: 'Python', percent: 40 }],
  });
  assert.ok(text.indexOf('First') < text.indexOf('Second'));
  assert.match(text, /Ссылка: https:\/\/example.com\/1/);
  assert.match(text, /JavaScript — 60%/);
});

test('safe filename removes unsafe characters', () => {
  assert.equal(safeFilename(' John / Doe: Resume '), 'John-Doe-Resume');
});
