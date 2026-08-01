import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearProfileCache, createBackup, createDraftRecord, parseBackup,
  readWorkspace, removeDraft, renameDraft, upsertDraft, writeWorkspace,
} from '../js/workspace.mjs';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key(index) { return [...map.keys()][index] ?? null; },
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

const draft = { name: 'Иван', headline: 'JS Developer', projects: [], skills: [] };

test('drafts are created, updated, renamed and removed', () => {
  const first = createDraftRecord({ id: 'one', name: 'Первый', user: { login: 'ivan' }, draft, savedAt: '2026-08-01T00:00:00.000Z' });
  const updated = createDraftRecord({ id: 'one', name: 'Обновлённый', user: { login: 'ivan' }, draft: { ...draft, headline: 'Senior JS' }, savedAt: '2026-08-02T00:00:00.000Z' });
  let drafts = upsertDraft([], first);
  drafts = upsertDraft(drafts, updated);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].draft.headline, 'Senior JS');
  drafts = renameDraft(drafts, 'one', 'Финальная версия', '2026-08-03T00:00:00.000Z');
  assert.equal(drafts[0].name, 'Финальная версия');
  assert.deepEqual(removeDraft(drafts, 'one'), []);
});

test('workspace survives storage round-trip', () => {
  const storage = memoryStorage();
  const record = createDraftRecord({ id: 'unicode', name: 'Резюме разработчика 🚀', user: { login: 'ivan' }, draft });
  writeWorkspace(storage, { drafts: [record] });
  const restored = readWorkspace(storage);
  assert.equal(restored.drafts[0].name, 'Резюме разработчика 🚀');
});

test('backup preserves Unicode and preferences', () => {
  const workspace = { drafts: [createDraftRecord({ id: 'one', name: 'Основное резюме', user: { login: 'ivan' }, draft })] };
  const encoded = createBackup({ workspace, preferences: { theme: 'light', recentProfiles: [{ login: 'ivan', name: 'Иван 🚀' }] } });
  const restored = parseBackup(`\uFEFF${encoded}`);
  assert.equal(restored.workspace.drafts[0].name, 'Основное резюме');
  assert.equal(restored.preferences.theme, 'light');
  assert.equal(restored.preferences.recentProfiles[0].name, 'Иван 🚀');
});

test('backup validation rejects foreign and newer formats', () => {
  assert.throws(() => parseBackup('{"type":"other","version":1}'), /не резервная копия/i);
  assert.throws(() => parseBackup('{"type":"auto-resume-backup","version":99}'), /более новой версией/i);
});

test('profile cache clearing leaves unrelated local data intact', () => {
  const storage = memoryStorage({
    'auto-resume:v2:alice': '{}',
    'auto-resume:v2:bob': '{}',
    'auto-resume:preferences:v1': '{}',
  });
  assert.equal(clearProfileCache(storage), 2);
  assert.equal(storage.getItem('auto-resume:v2:alice'), null);
  assert.equal(storage.getItem('auto-resume:preferences:v1'), '{}');
});
