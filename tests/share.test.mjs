import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSharePayload, encodeSharePayload } from '../js/share.mjs';

const payload = {
  version: 2,
  createdAt: '2026-08-01T00:00:00.000Z',
  user: { login: 'тест', location: 'Amsterdam' },
  draft: { name: 'Иван', headline: 'React Developer', projects: [], skills: [] },
  template: 'ats',
};

test('public resume payload round-trips with unicode', () => {
  const encoded = encodeSharePayload(payload);
  assert.doesNotMatch(encoded, /[+/=]/);
  assert.deepEqual(decodeSharePayload(encoded), payload);
});

test('invalid payload is rejected', () => {
  const encoded = encodeSharePayload({ version: 1, draft: {} });
  assert.throws(() => decodeSharePayload(encoded), /Неподдерживаемая/);
});
