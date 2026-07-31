import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVacancy, extractRequirements } from '../js/vacancy.mjs';

test('extracts technologies from vacancy text', () => {
  const result = extractRequirements('Нужны TypeScript, React, Node.js, PostgreSQL, Docker и опыт CI/CD.');
  assert.ok(result.includes('TypeScript'));
  assert.ok(result.includes('React'));
  assert.ok(result.includes('Node.js'));
  assert.ok(result.includes('SQL'));
  assert.ok(result.includes('Docker'));
  assert.ok(result.includes('CI/CD'));
});

test('matches profile skills and ranks relevant projects', () => {
  const analysis = analyzeVacancy('Ищем React TypeScript developer с Docker и SQL', {
    languages: { TypeScript: 5000, JavaScript: 1000 },
    repos: [
      { name: 'dashboard', description: 'React TypeScript app', topics: ['react'], language: 'TypeScript', languages: { TypeScript: 500 }, stargazers_count: 2 },
      { name: 'bot', description: 'Python bot', topics: [], language: 'Python', languages: { Python: 500 }, stargazers_count: 20 },
    ],
  });
  assert.ok(analysis.score >= 50);
  assert.ok(analysis.matched.includes('React'));
  assert.equal(analysis.rankedRepos[0].name, 'dashboard');
  assert.ok(analysis.missing.includes('Docker'));
});
