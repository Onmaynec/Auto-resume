import test from 'node:test';
import assert from 'node:assert/strict';
import { compareProfiles, metricWinner, summarizeProfile } from '../js/compare.mjs';

const profile = (login, overrides = {}) => ({
  user: { login, name: login, followers: 10, public_repos: 2, ...overrides.user },
  repos: [
    { stargazers_count: 4, forks_count: 2, languages: { JavaScript: 100, HTML: 20 } },
    { stargazers_count: 1, forks_count: 1, language: 'CSS' },
  ],
  contributions: { total: 50, commits: 30, ...overrides.contributions },
});

test('profile summary aggregates repository popularity and languages', () => {
  const summary = summarizeProfile(profile('alpha'));
  assert.equal(summary.stars, 5);
  assert.equal(summary.forks, 3);
  assert.deepEqual(summary.topLanguages, ['JavaScript', 'HTML', 'CSS']);
});

test('comparison marks metric winners and common languages', () => {
  const result = compareProfiles(
    profile('alpha'),
    profile('beta', { user: { followers: 20 }, contributions: { total: 40, commits: 25 } }),
  );
  assert.equal(result.metrics.find((item) => item.label === 'Подписчики').winner, 'right');
  assert.equal(result.metrics.find((item) => item.label === 'Вклады за год').winner, 'left');
  assert.deepEqual(result.commonLanguages, ['JavaScript', 'HTML', 'CSS']);
});

test('equal values produce a tie', () => {
  assert.equal(metricWinner(5, 5), 'tie');
});
