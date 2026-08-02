import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSharePayload, decodeSharePayload, encodeSharePayload } from '../js/share.mjs';
import { createBackup, createDraftRecord, normalizeDraft, parseBackup } from '../js/workspace.mjs';

const presentation = {
  schemaVersion: 1,
  templateId: 'visual-studio',
  templateVersion: 1,
  visualTemplateId: 'visual-studio',
  accent: '#0f766e',
  font: 'georgia',
  density: 'compact',
  spacing: 'tight',
  logoUrl: 'blob:https://example.com/secret-logo',
  externalCss: 'https://attacker.example/theme.css',
};

const resumeDraft = {
  locale: 'en',
  name: 'Ada Lovelace',
  headline: 'Platform Engineer',
  contact: 'Amsterdam',
  about: 'Builds developer platforms.',
  projects: [{ id: 'ada/compiler', name: 'Compiler', url: 'https://github.com/ada/compiler', description: 'A compiler.' }],
  skills: [{ name: 'JavaScript', percent: 80 }],
  presentation,
};

test('workspace draft stores only the versioned safe presentation schema', () => {
  const record = createDraftRecord({ user: { login: 'ada' }, draft: resumeDraft, template: 'visual', locale: 'en', savedAt: '2026-08-02T08:00:00.000Z' });
  assert.equal(record.template, 'visual');
  assert.deepEqual(record.draft.presentation, {
    schemaVersion: 1,
    templateId: 'visual-studio',
    templateVersion: 1,
    visualTemplateId: 'visual-studio',
    accent: '#0f766e',
    font: 'georgia',
    density: 'compact',
    spacing: 'tight',
  });
  assert.equal('logoUrl' in record.draft.presentation, false);
  assert.equal('externalCss' in record.draft.presentation, false);
});

test('workspace v1 records migrate and unknown templates fall back', () => {
  const migrated = normalizeDraft({ id: 'old', name: 'Old', savedAt: '2026-01-01T00:00:00.000Z', template: 'visual', locale: 'ru', user: {}, draft: { ...resumeDraft, presentation: undefined } });
  assert.equal(migrated.draft.presentation.templateId, 'visual-classic');
  const removed = normalizeDraft({ id: 'removed', name: 'Removed', savedAt: '2026-01-01T00:00:00.000Z', template: 'visual', locale: 'ru', user: {}, draft: { ...resumeDraft, presentation: { templateId: 'removed-theme', templateVersion: 1 } } });
  assert.equal(removed.draft.presentation.templateId, 'visual-classic');
});

test('public share v4 includes compatible template id but excludes local logo', () => {
  const payload = buildSharePayload({ locale: 'en', user: { login: 'ada', avatar_url: 'https://example.com/avatar.png' }, resumeTemplate: 'visual', resumeDraft });
  assert.equal(payload.version, 4);
  assert.equal(payload.presentation.templateId, 'visual-studio');
  assert.equal(payload.presentation.templateVersion, 1);
  assert.equal(JSON.stringify(payload).includes('blob:'), false);
  assert.equal(JSON.stringify(payload).includes('externalCss'), false);
  const decoded = decodeSharePayload(encodeSharePayload(payload));
  assert.equal(decoded.draft.presentation.templateId, 'visual-studio');
  assert.equal(decoded.template, 'visual');
});

test('legacy v3 public links open with a safe visual fallback', () => {
  const encoded = encodeSharePayload({ version: 3, locale: 'ru', template: 'visual', user: {}, draft: { ...resumeDraft, presentation: undefined } });
  const decoded = decodeSharePayload(encoded);
  assert.equal(decoded.presentation.templateId, 'visual-classic');
  assert.equal(decoded.draft.presentation.templateVersion, 1);
});

test('backup version 2 round-trips presentations and accepts older payloads', () => {
  const record = createDraftRecord({ user: { login: 'ada' }, draft: resumeDraft, template: 'visual', locale: 'en' });
  const text = createBackup({ workspace: { drafts: [record] }, preferences: { theme: 'dark', locale: 'en', recentProfiles: [] } });
  const parsed = parseBackup(text);
  assert.equal(parsed.workspace.version, 2);
  assert.equal(parsed.workspace.drafts[0].draft.presentation.templateId, 'visual-studio');
  const legacy = parseBackup(JSON.stringify({ type: 'auto-resume-backup', version: 1, workspace: { drafts: [record] }, preferences: {} }));
  assert.equal(legacy.workspace.drafts.length, 1);
});
