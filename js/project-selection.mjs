export function repoKey(repo) {
  return String(repo?.full_name || repo?.name || '');
}

export function createDefaultSelection(repos, scoreFn, limit = 5) {
  return [...repos]
    .filter((repo) => repoKey(repo))
    .sort((a, b) => scoreFn(b) - scoreFn(a))
    .slice(0, Math.max(0, limit))
    .map(repoKey);
}

export function normalizeSelection(selection, repos, limit = 5) {
  const available = new Set(repos.map(repoKey));
  const unique = [];

  selection.forEach((key) => {
    if (available.has(key) && !unique.includes(key) && unique.length < limit) unique.push(key);
  });

  return unique;
}

export function toggleSelection(selection, key, checked, limit = 5) {
  const normalized = [...new Set(selection)];
  const exists = normalized.includes(key);

  if (checked && !exists) {
    if (normalized.length >= limit) return normalized;
    return [...normalized, key];
  }

  if (!checked && exists) return normalized.filter((item) => item !== key);
  return normalized;
}

export function moveSelection(selection, key, direction) {
  const next = [...selection];
  const index = next.indexOf(key);
  const target = index + Number(direction);

  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function reorderSelection(selection, sourceKey, targetKey) {
  if (sourceKey === targetKey) return [...selection];
  const next = [...selection];
  const from = next.indexOf(sourceKey);
  const to = next.indexOf(targetKey);
  if (from < 0 || to < 0) return next;

  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function resolveSelectedProjects(repos, selection) {
  const byKey = new Map(repos.map((repo) => [repoKey(repo), repo]));
  return selection.map((key) => byKey.get(key)).filter(Boolean);
}
