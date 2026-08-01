import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeDocx, buildResumeMarkdown, DOCX_MIME } from '../js/docx-export.mjs';

const draft = {
  locale: 'ru',
  name: 'Иван Петров 🚀',
  headline: 'JavaScript / Python Developer',
  contact: 'Алматы · github.com/ivan',
  about: 'Создаю инструменты для Windows и веб-приложения.\nЛюблю понятную архитектуру.',
  projects: [
    { name: 'Первый проект', description: 'Описание с Unicode: тест ✓', url: 'https://github.com/example/first' },
    { name: 'Second Project', description: 'The second project.', url: 'https://github.com/example/second' },
  ],
  skills: [{ name: 'JavaScript', percent: 60 }, { name: 'Python', percent: 40 }],
};

test('Markdown export preserves locale, project order and links', () => {
  const markdown = buildResumeMarkdown(draft, 'ru', { generatedAt: '2026-08-01T08:00:00.000Z' });
  assert.match(markdown, /lang: ru/);
  assert.match(markdown, /## О себе/);
  assert.ok(markdown.indexOf('Первый проект') < markdown.indexOf('Second Project'));
  assert.match(markdown, /\[Ссылка\]\(https:\/\/github\.com\/example\/first\)/);
  assert.match(markdown, /Иван Петров 🚀/);
});

test('English Markdown uses English headings', () => {
  const markdown = buildResumeMarkdown({ ...draft, locale: 'en' }, 'en', { generatedAt: '2026-08-01T08:00:00.000Z' });
  assert.match(markdown, /lang: en/);
  assert.match(markdown, /## About/);
  assert.match(markdown, /## Projects/);
  assert.match(markdown, /## Skills/);
});

test('DOCX export is a valid stored ZIP with OOXML parts and Unicode text', () => {
  const bytes = buildResumeDocx(draft, {
    locale: 'ru',
    createdAt: '2026-08-01T08:00:00.000Z',
    creator: 'Auto Resume tests',
  });
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true), 0x04034b50);
  const entries = readStoredZip(bytes);
  const required = [
    '[Content_Types].xml', '_rels/.rels', 'docProps/core.xml', 'docProps/app.xml',
    'word/document.xml', 'word/styles.xml', 'word/_rels/document.xml.rels',
  ];
  required.forEach((name) => assert.ok(entries.has(name), `missing ${name}`));
  const documentXml = entries.get('word/document.xml');
  assert.match(documentXml, /Иван Петров 🚀/);
  assert.ok(documentXml.indexOf('Первый проект') < documentXml.indexOf('Second Project'));
  assert.match(documentXml, /w:pgSz w:w="11906" w:h="16838"/);
  assert.match(entries.get('word/_rels/document.xml.rels'), /TargetMode="External"/);
  assert.match(entries.get('docProps/core.xml'), /Auto Resume tests/);
});

test('DOCX MIME type is the standard Word document media type', () => {
  assert.equal(DOCX_MIME, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

function readStoredZip(bytes) {
  const decoder = new TextDecoder();
  const entries = new Map();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    assert.equal(method, 0, 'test parser only supports stored entries');
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    entries.set(name, decoder.decode(bytes.subarray(dataStart, dataStart + size)));
    offset = dataStart + size;
  }
  return entries;
}
