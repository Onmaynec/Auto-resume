export const PROJECT_LIMIT = 5;

export function defaultSelection(repos, limit = PROJECT_LIMIT) {
  return [...repos]
    .sort((a, b) => projectScore(b) - projectScore(a))
    .slice(0, Math.max(0, limit))
    .map((repo) => repo.full_name || repo.name);
}

export function normalizeSelection(selected, repos, limit = PROJECT_LIMIT) {
  const available = new Set(repos.map((repo) => repo.full_name || repo.name));
  const unique = [];
  for (const id of selected || []) {
    if (available.has(id) && !unique.includes(id)) unique.push(id);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function toggleSelection(selected, id, checked, repos, limit = PROJECT_LIMIT) {
  const current = normalizeSelection(selected, repos, limit);
  if (!checked) return current.filter((item) => item !== id);
  if (current.includes(id) || current.length >= limit) return current;
  return [...current, id];
}

export function moveSelection(selected, id, direction) {
  const next = [...selected];
  const index = next.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function reorderSelection(selected, draggedId, targetId) {
  const next = [...selected];
  const from = next.indexOf(draggedId);
  const to = next.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return next;
  next.splice(from, 1);
  next.splice(to, 0, draggedId);
  return next;
}

export function resolveSelectedRepos(repos, selected) {
  const byId = new Map(repos.map((repo) => [repo.full_name || repo.name, repo]));
  return selected.map((id) => byId.get(id)).filter(Boolean);
}

function projectScore(repo) {
  const pushed = new Date(repo.pushed_at || repo.updated_at || 0).getTime();
  const recency = Number.isFinite(pushed) ? Math.max(0, 24 - (Date.now() - pushed) / 2_629_746_000) : 0;
  return Number(repo.stargazers_count || 0) * 5
    + Number(repo.forks_count || 0) * 3
    + recency
    + (repo.description ? 4 : 0)
    + (repo.homepage ? 3 : 0)
    - (repo.archived ? 30 : 0);
}
