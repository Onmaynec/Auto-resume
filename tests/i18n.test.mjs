import test from 'node:test'; import assert from 'node:assert/strict'; import { dictionaryKeys, normalizeLocale, setLocale, t } from '../js/i18n.mjs';
test('RU and EN dictionaries contain identical keys', () => assert.deepEqual(dictionaryKeys('ru'), dictionaryKeys('en')));
test('unknown locales safely fall back to Russian', () => { assert.equal(normalizeLocale('de-DE'), 'ru'); assert.equal(setLocale('de'), 'ru'); assert.equal(t('search.button'), 'Анализировать'); });
test('translations interpolate variables without leaking placeholders', () => { assert.equal(t('projects.selected', { count: 2, limit: 5 }, 'en'), '2/5 selected'); assert.equal(t('projects.selected', { count: 2, limit: 5 }, 'ru'), '2/5 выбрано'); });
