const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/github.js');

const { buildMonthRanges, buildQuery, normalizeLanguageMonth } = handler._private;

test('language history covers exactly twelve ordered months', () => {
  const months = buildMonthRanges(new Date('2026-08-15T12:00:00Z'));
  assert.equal(months.length, 12);
  assert.equal(months[0].key, '2025-09');
  assert.equal(months[11].key, '2026-08');
});

test('GraphQL query contains monthly contribution aliases', () => {
  const query = buildQuery(12);
  assert.match(query, /month0: contributionsCollection/);
  assert.match(query, /month11: contributionsCollection/);
  assert.match(query, /commitContributionsByRepository/);
});

test('monthly language contributions aggregate by primary language', () => {
  const month = normalizeLanguageMonth(
    { key: '2026-08', label: 'авг.' },
    { commitContributionsByRepository: [
      { repository: { primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } }, contributions: { nodes: [{ commitCount: 3 }] } },
      { repository: { primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } }, contributions: { nodes: [{ commitCount: 2 }] } },
      { repository: { primaryLanguage: { name: 'Python', color: '#3572A5' } }, contributions: { nodes: [{ commitCount: 4 }] } },
    ] },
  );
  assert.equal(month.total, 9);
  assert.equal(month.languages.JavaScript.count, 5);
  assert.equal(month.languages.Python.count, 4);
});
