import { els, state } from './config.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  }[character]));
}

export function showStatus(text, variant = '') {
  els.status.textContent = text;
  els.status.classList.remove('hidden', 'error', 'warning', 'success');
  if (variant) els.status.classList.add(variant);
}

export function toast(button, text) {
  const oldText = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = oldText; }, 1800);
}

export function formatRateLimitMessage(resetAt) {
  if (!resetAt) return 'Лимит GitHub API исчерпан. Попробуйте позже.';
  const date = new Date(resetAt);
  return `Лимит GitHub API исчерпан. Он восстановится примерно в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}.`;
}

export function sum(key) {
  return state.repos.reduce((total, repo) => total + Number(repo[key] || 0), 0);
}

export function monthsAgo(date) {
  if (!date) return 99;
  return (Date.now() - new Date(date).getTime()) / (30.44 * 86_400_000);
}

export function score(repo) {
  const freshness = Math.max(0, 12 - monthsAgo(repo.pushed_at)) * 2;
  return repo.stargazers_count * 5 + repo.forks_count * 3 + freshness + (repo.description ? 3 : 0);
}

export function languageStats() {
  const total = Object.values(state.languages).reduce((sumValue, value) => sumValue + value, 0) || 1;
  return Object.entries(state.languages)
    .map(([name, value]) => ({ name, value, percent: Math.round(value / total * 100) }))
    .sort((a, b) => b.value - a.value);
}

export function contributionLevel(day, max) {
  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  if (day.level in levels) return levels[day.level];
  if (!day.count) return 0;
  return Math.min(4, Math.max(1, Math.ceil(day.count / max * 4)));
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU');
}
