import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeText, safeFilename } from '../js/resume-text.mjs';

test('plain text export is ATS-friendly and keeps project order', () => {
  const text = buildResumeText({
    name: 'Иван Иванов',
    headline: 'JavaScript Developer',
    contacts: ['GitHub: github.com/ivan', 'Локация: Москва'],
    about: 'Разрабатываю веб-приложения.',
    projects: [
      { name: 'Second', url: 'https://example.com/second', description: 'Второй проект.' },
      { name: 'First', url: 'https://example.com/first', description: 'Первый проект.' },
    ],
    skills: ['JavaScript 70%', 'HTML 30%'],
  });

  assert.match(text, /Иван Иванов\nJavaScript Developer/);
  assert.ok(text.indexOf('Second') < text.indexOf('First'));
  assert.match(text, /НАВЫКИ\nJavaScript 70%, HTML 30%/);
  assert.equal(text.endsWith('\n'), true);
});

test('safe filename removes unsafe characters', () => {
  assert.equal(safeFilename(' John / Doe '), 'john-doe');
  assert.equal(safeFilename(''), 'github-resume');
});
