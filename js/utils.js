import { state } from './config.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  }[char]));
}

export function languageStats() {
  const total = Object.values(state.languages).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return Object.entries(state.languages)
    .map(([name, value]) => ({ name, value: Number(value || 0), percent: Math.round(Number(value || 0) / total * 100) }))
    .sort((a, b) => b.value - a.value);
}

export function score(repo) {
  const pushed = new Date(repo.pushed_at || repo.updated_at || 0).getTime();
  const months = Number.isFinite(pushed) ? (Date.now() - pushed) / 2_629_746_000 : 24;
  return Number(repo.stargazers_count || 0) * 5
    + Number(repo.forks_count || 0) * 3
    + Math.max(0, 24 - months)
    + (repo.description ? 4 : 0)
    + (repo.homepage ? 3 : 0)
    - (repo.archived ? 30 : 0);
}

export function sum(key) {
  return state.repos.reduce((total, repo) => total + Number(repo[key] || 0), 0);
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

export function formatRateLimitMessage(resetAt) {
  if (!resetAt) return 'Лимит GitHub API исчерпан. Попробуйте позже.';
  const time = new Date(resetAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `Лимит GitHub API исчерпан. Он восстановится примерно в ${time}.`;
}

export function showStatus(message, type = 'info') {
  const element = document.querySelector('#status');
  element.textContent = message;
  element.className = `status ${type}`;
}

export function hideStatus() {
  document.querySelector('#status').classList.add('hidden');
}

export function toast(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = original; }, 1800);
}

export function downloadBlob(content, filename, type = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
