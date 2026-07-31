import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSelection, moveSelection, normalizeSelection, reorderSelection,
  resolveSelectedProjects, toggleSelection,
} from '../js/project-selection.mjs';

const repos = [
  { name: 'alpha', full_name: 'user/alpha', points: 2 },
  { name: 'beta', full_name: 'user/beta', points: 9 },
  { name: 'gamma', full_name: 'user/gamma', points: 5 },
];

test('default selection follows score order and limit', () => {
  assert.deepEqual(
    createDefaultSelection(repos, (repo) => repo.points, 2),
    ['user/beta', 'user/gamma'],
  );
});

test('selection enforces uniqueness, availability and limit', () => {
  assert.deepEqual(
    normalizeSelection(['user/beta', 'missing', 'user/beta', 'user/alpha'], repos, 2),
    ['user/beta', 'user/alpha'],
  );
});

test('toggle, move and drag reorder preserve selected projects', () => {
  let selection = toggleSelection([], 'user/alpha', true, 2);
  selection = toggleSelection(selection, 'user/beta', true, 2);
  selection = toggleSelection(selection, 'user/gamma', true, 2);
  assert.deepEqual(selection, ['user/alpha', 'user/beta']);

  assert.deepEqual(moveSelection(selection, 'user/beta', -1), ['user/beta', 'user/alpha']);
  assert.deepEqual(reorderSelection(['user/alpha', 'user/beta', 'user/gamma'], 'user/gamma', 'user/alpha'), [
    'user/gamma', 'user/alpha', 'user/beta',
  ]);
});

test('selected repositories resolve in user-defined order', () => {
  assert.deepEqual(
    resolveSelectedProjects(repos, ['user/gamma', 'user/beta']).map((repo) => repo.name),
    ['gamma', 'beta'],
  );
});
