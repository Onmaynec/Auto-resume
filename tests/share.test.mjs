import test from 'node:test'; import assert from 'node:assert/strict'; import { decodeSharePayload, encodeSharePayload } from '../js/share.mjs';
const payload = { version: 3, createdAt: '2026-08-01T00:00:00.000Z', locale: 'en', user: { login: 'тест', location: 'Amsterdam' }, draft: { name: 'Иван', headline: 'React Developer', projects: [], skills: [] }, template: 'ats' };
test('public resume payload round-trips with Unicode and locale', () => { const encoded = encodeSharePayload(payload); assert.doesNotMatch(encoded, /[+/=]/); assert.deepEqual(decodeSharePayload(encoded), payload); });
test('v2 links migrate to Russian locale', () => { const old = { ...payload, version: 2 }; delete old.locale; assert.equal(decodeSharePayload(encodeSharePayload(old)).locale, 'ru'); });
test('invalid payload is rejected with code', () => { const encoded = encodeSharePayload({ version: 1, draft: {} }); assert.throws(() => decodeSharePayload(encoded), (error) => error.code === 'SHARE_VERSION'); });
