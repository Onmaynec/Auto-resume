import { $, els, state } from './config.js';
import { renderProjectBuilder } from './projects.js';
import { formatDate, formatNumber, t } from './i18n.mjs';
import { contributionLevel, escapeHtml, languageStats, score, sum } from './utils.js';

export function renderAll() { renderProfile(); renderMetrics(); renderTips(); renderHeatmap(); renderActivityChart(); renderLanguageHistory(); renderRepos(); renderProjectBuilder(); renderVacancyResult(); }

function renderProfile() {
  const user = state.user;
  els.profile.innerHTML = `<img class="avatar" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.login)}"><div><span class="kicker">${t('profile.kicker')}</span><h2>${escapeHtml(user.name || user.login)}</h2><p>${escapeHtml(user.bio || t('profile.noBio'))}</p><div class="profile-meta"><span>📍 ${escapeHtml(user.location || t('profile.noLocation'))}</span><span>👥 ${t('profile.followers', { count: formatNumber(user.followers) })}</span><span>📦 ${t('profile.repositories', { count: formatNumber(user.public_repos ?? state.repos.length) })}</span></div></div>`;
}
function renderMetrics() {
  const commitLabel = state.source === 'github-graphql' ? t('metrics.commitsYear') : t('metrics.commitsFallback');
  els.metrics.innerHTML = [['⭐', sum('stargazers_count'), t('metrics.stars')], ['⑂', sum('forks_count'), t('metrics.forks')], ['⌁', state.contributions.commits, commitLabel], ['◈', Object.keys(state.languages).length, t('metrics.languages')]]
    .map(([icon, value, label]) => `<div class="metric"><span>${icon}</span><strong>${formatNumber(value)}</strong><span>${label}</span></div>`).join('');
}
function renderTips() {
  const tips = []; const repos = state.repos; const user = state.user;
  if (!user.bio) tips.push(t('tips.bio')); if (!user.location) tips.push(t('tips.location')); if (repos.length < 3) tips.push(t('tips.projects'));
  if (repos.filter((repo) => repo.description).length < Math.min(5, repos.length)) tips.push(t('tips.descriptions'));
  if (sum('stargazers_count') === 0) tips.push(t('tips.readme')); if (!state.languageHistory.length) tips.push(t('tips.history'));
  els.tips.innerHTML = tips.map((tip) => `<div class="tip"><span>💡</span><span>${escapeHtml(tip)}</span></div>`).join(''); els.tipsCard.classList.toggle('hidden', !tips.length);
}
function renderHeatmap() {
  const counts = state.contributions.calendar.map((day) => day.count); const max = Math.max(...counts, 1);
  els.heatmap.innerHTML = state.contributions.calendar.map((day) => `<i class="heat-cell" data-level="${contributionLevel(day, max)}" title="${escapeHtml(t('heatmap.day', { date: formatDate(`${day.date}T00:00:00`), count: formatNumber(day.count) }))}"></i>`).join('');
  els.commitCount.textContent = `${t('heatmap.total', { count: formatNumber(state.contributions.total) })}${state.source === 'github-graphql' ? '' : t('heatmap.fallback')}`;
}
function renderActivityChart() {
  if (state.charts.activity) state.charts.activity.destroy();
  const labels = Object.keys(state.monthly).map((key) => formatDate(`${key}-01T00:00:00`, { month: 'short' }));
  state.charts.activity = new Chart($('#activityChart'), { type: 'line', data: { labels, datasets: [{ label: t('chart.contributions'), data: Object.values(state.monthly), fill: true, tension: 0.35, borderColor: '#7c5cff', backgroundColor: 'rgba(124,92,255,.15)', pointBackgroundColor: '#29d3a2' }] }, options: chartOptions(t('chart.contributions')) });
}
function renderLanguageHistory() {
  if (state.charts.languagesHistory) state.charts.languagesHistory.destroy(); const canvas = $('#languageHistoryChart'); const empty = $('#languageHistoryEmpty');
  if (!state.languageHistory.length) { canvas.classList.add('hidden'); empty.classList.remove('hidden'); empty.textContent = t('languages.empty'); return; }
  canvas.classList.remove('hidden'); empty.classList.add('hidden'); const totals = new Map();
  state.languageHistory.forEach((month) => Object.entries(month.languages).forEach(([name, info]) => totals.set(name, (totals.get(name) || 0) + info.count)));
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name); const fallbackColors = ['#7c5cff', '#29d3a2', '#4da3ff', '#ffb84d', '#ff6b7a', '#ad7cff'];
  const datasets = top.map((name, index) => ({ label: name, data: state.languageHistory.map((month) => month.languages[name]?.count || 0), backgroundColor: state.languageHistory.find((month) => month.languages[name]?.color)?.languages[name].color || fallbackColors[index], borderRadius: 4 }));
  state.charts.languagesHistory = new Chart(canvas, { type: 'bar', data: { labels: state.languageHistory.map((month) => formatDate(`${month.key}-01T00:00:00`, { month: 'short' })), datasets }, options: { ...chartOptions(t('chart.commits')), scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#8f9bad' } }, y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8f9bad', precision: 0 } } } } });
}
function chartOptions(label) { return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8f9bad' } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8f9bad', precision: 0 }, title: { display: false, text: label } } } }; }
function renderRepos() {
  const sorted = [...state.repos].sort((a, b) => score(b) - score(a)); els.repoCount.textContent = t('repos.count', { count: formatNumber(sorted.length) });
  els.repos.innerHTML = sorted.slice(0, 12).map((repo) => `<article class="repo"><a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)} ↗</a><p>${escapeHtml(repo.description || t('repos.noDescription'))}</p><div class="repo-topics">${(repo.topics || []).slice(0, 3).map((topic) => `<span>${escapeHtml(topic)}</span>`).join('')}</div><div class="repo-footer"><span><i class="language-dot" style="${repo.language_color ? `background:${escapeHtml(repo.language_color)}` : ''}"></i>${escapeHtml(repo.language || 'Other')}</span><span>★ ${formatNumber(repo.stargazers_count)} · ⑂ ${formatNumber(repo.forks_count)}</span></div></article>`).join('') || `<p>${t('repos.empty')}</p>`;
}
export function renderVacancyResult() {
  const analysis = state.vacancyAnalysis; if (!analysis) { els.vacancyResult.classList.add('hidden'); return; }
  const summary = vacancySummary(analysis); els.vacancyResult.classList.remove('hidden');
  els.vacancyResult.innerHTML = `<div class="match-score"><strong>${analysis.score}%</strong><span>${t('vacancy.match')}</span></div><div class="match-details"><h3>${t('vacancy.matched')}</h3><div class="chips positive">${analysis.matched.map((item) => `<span>${escapeHtml(item)}</span>`).join('') || `<span>${t('vacancy.noneMatched')}</span>`}</div><h3>${t('vacancy.missing')}</h3><div class="chips negative">${analysis.missing.map((item) => `<span>${escapeHtml(item)}</span>`).join('') || `<span>${t('vacancy.noGaps')}</span>`}</div><p>${escapeHtml(summary)}</p></div>`;
}
function vacancySummary(analysis) {
  if (!analysis.matched.length) return t('vacancy.summary.none');
  const strength = analysis.score >= 75 ? 'strong' : analysis.score >= 45 ? 'partial' : 'initial';
  const parts = [t(`vacancy.summary.${strength}`), t('vacancy.summary.confirmed', { skills: analysis.matched.slice(0, 7).join(', ') })];
  if (analysis.missing.length) parts.push(t('vacancy.summary.develop', { skills: analysis.missing.slice(0, 5).join(', ') })); return parts.join(' ');
}
export function getTopLanguageNames(limit = 3) { return languageStats().slice(0, limit).map((item) => item.name); }
