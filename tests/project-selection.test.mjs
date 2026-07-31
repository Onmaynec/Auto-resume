import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSelection, moveSelection, normalizeSelection, reorderSelection, toggleSelection } from '../js/project-selection.mjs';

const repos = [
  { name: 'alpha', full_name: 'u/alpha', stargazers_count: 1, forks_count: 0, description: 'a' },
  { name: 'beta', full_name: 'u/beta', stargazers_count: 4, forks_count: 1, description: 'b' },
  { name: 'gamma', full_name: 'u/gamma', stargazers_count: 2, forks_count: 0, description: 'c' },
];

test('default selection follows project score', () => {
  assert.deepEqual(defaultSelection(repos, 2), ['u/beta', 'u/gamma']);
});

test('selection is unique, available and limited', () => {
  assert.deepEqual(normalizeSelection(['u/beta', 'u/beta', 'missing', 'u/alpha'], repos, 2), ['u/beta', 'u/alpha']);
});

test('toggle and reorder preserve selected projects', () => {
  let selected = toggleSelection([], 'u/alpha', true, repos, 2);
  selected = toggleSelection(selected, 'u/beta', true, repos, 2);
  selected = toggleSelection(selected, 'u/gamma', true, repos, 2);
  assert.deepEqual(selected, ['u/alpha', 'u/beta']);
  assert.deepEqual(moveSelection(selected, 'u/beta', -1), ['u/beta', 'u/alpha']);
  assert.deepEqual(reorderSelection(selected, 'u/alpha', 'u/beta'), ['u/beta', 'u/alpha']);
});
