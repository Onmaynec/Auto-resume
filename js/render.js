import { $, els, state } from './config.js';
import { renderProjectBuilder } from './projects.js';
import {
  contributionLevel, escapeHtml, formatDate, languageStats, score, sum,
} from './utils.js';

export function renderAll() {
  renderProfile();
  renderMetrics();
  renderTips();
  renderHeatmap();
  renderActivityChart();
  renderLanguageHistory();
  renderRepos();
  renderProjectBuilder();
  renderVacancyResult();
}

function renderProfile() {
  const user = state.user;
  els.profile.innerHTML = `
    <img class="avatar" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.login)}">
    <div>
      <span class="kicker">Профиль</span>
      <h2>${escapeHtml(user.name || user.login)}</h2>
      <p>${escapeHtml(user.bio || 'Описание профиля пока не добавлено.')}</p>
      <div class="profile-meta">
        <span>📍 ${escapeHtml(user.location || 'Не указано')}</span>
        <span>👥 ${Number(user.followers || 0)} подписчиков</span>
        <span>📦 ${Number(user.public_repos ?? state.repos.length)} репозиториев</span>
      </div>
    </div>`;
}

function renderMetrics() {
  const commitLabel = state.source === 'github-graphql' ? 'Коммитов за год' : 'Коммитов*';
  els.metrics.innerHTML = [
    ['⭐', sum('stargazers_count'), 'Звёзд'],
    ['⑂', sum('forks_count'), 'Форков'],
    ['⌁', state.contributions.commits, commitLabel],
    ['◈', Object.keys(state.languages).length, 'Языков'],
  ].map(([icon, value, label]) => `
    <div class="metric"><span>${icon}</span><strong>${value}</strong><span>${label}</span></div>
  `).join('');
}

function renderTips() {
  const user = state.user;
  const repos = state.repos;
  const tips = [];
  if (!user.bio) tips.push('Добавьте био с ролью, специализацией и ключевым стеком.');
  if (!user.location) tips.push('Укажите локацию или формат работы: remote / hybrid / onsite.');
  if (repos.length < 3) tips.push('Добавьте минимум три содержательных проекта.');
  if (repos.filter((repo) => repo.description).length < Math.min(5, repos.length)) tips.push('Добавьте описания репозиториев: задача, стек и результат.');
  if (sum('stargazers_count') === 0) tips.push('Улучшите README: демо, скриншоты и инструкция запуска повышают доверие.');
  if (!state.languageHistory.length) tips.push('История языков доступна в полном Vercel-режиме с GITHUB_TOKEN.');
  els.tips.innerHTML = tips.map((tip) => `<div class="tip"><span>💡</span><span>${escapeHtml(tip)}</span></div>`).join('');
  els.tipsCard.classList.toggle('hidden', !tips.length);
}

function renderHeatmap() {
  const counts = state.contributions.calendar.map((day) => day.count);
  const max = Math.max(...counts, 1);
  els.heatmap.innerHTML = state.contributions.calendar.map((day) => {
    const level = contributionLevel(day, max);
    return `<i class="heat-cell" data-level="${level}" title="${formatDate(day.date)}: ${day.count} вкладов"></i>`;
  }).join('');
  const suffix = state.source === 'github-graphql' ? '' : ' · экономный режим';
  els.commitCount.textContent = `${state.contributions.total} вкладов${suffix}`;
}

function renderActivityChart() {
  if (state.charts.activity) state.charts.activity.destroy();
  const labels = Object.keys(state.monthly).map((key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('ru-RU', { month: 'short' }));
  const data = Object.values(state.monthly);
  state.charts.activity = new Chart($('#activityChart'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Вклады', data, fill: true, tension: 0.35, borderColor: '#7c5cff', backgroundColor: 'rgba(124,92,255,.15)', pointBackgroundColor: '#29d3a2' }] },
    options: chartOptions('Вклады'),
  });
}

function renderLanguageHistory() {
  if (state.charts.languagesHistory) state.charts.languagesHistory.destroy();
  const canvas = $('#languageHistoryChart');
  const empty = $('#languageHistoryEmpty');
  if (!state.languageHistory.length) {
    canvas.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  canvas.classList.remove('hidden');
  empty.classList.add('hidden');
  const totals = new Map();
  state.languageHistory.forEach((month) => Object.entries(month.languages).forEach(([name, info]) => totals.set(name, (totals.get(name) || 0) + info.count)));
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  const fallbackColors = ['#7c5cff', '#29d3a2', '#4da3ff', '#ffb84d', '#ff6b7a', '#ad7cff'];
  const datasets = top.map((name, index) => ({
    label: name,
    data: state.languageHistory.map((month) => month.languages[name]?.count || 0),
    backgroundColor: state.languageHistory.find((month) => month.languages[name]?.color)?.languages[name].color || fallbackColors[index],
    borderRadius: 4,
  }));
  state.charts.languagesHistory = new Chart(canvas, {
    type: 'bar',
    data: { labels: state.languageHistory.map((month) => month.label), datasets },
    options: { ...chartOptions('Коммиты'), scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#8f9bad' } }, y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8f9bad', precision: 0 } } } },
  });
}

function chartOptions(label) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8f9bad' } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8f9bad', precision: 0 }, title: { display: false, text: label } },
    },
  };
}

function renderRepos() {
  const sorted = [...state.repos].sort((a, b) => score(b) - score(a));
  els.repoCount.textContent = `${sorted.length} проектов`;
  els.repos.innerHTML = sorted.slice(0, 12).map((repo) => `
    <article class="repo">
      <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)} ↗</a>
      <p>${escapeHtml(repo.description || 'Описание не добавлено.')}</p>
      <div class="repo-topics">${(repo.topics || []).slice(0, 3).map((topic) => `<span>${escapeHtml(topic)}</span>`).join('')}</div>
      <div class="repo-footer">
        <span><i class="language-dot" style="${repo.language_color ? `background:${escapeHtml(repo.language_color)}` : ''}"></i>${escapeHtml(repo.language || 'Other')}</span>
        <span>★ ${repo.stargazers_count || 0} · ⑂ ${repo.forks_count || 0}</span>
      </div>
    </article>`).join('') || '<p>Публичные репозитории не найдены.</p>';
}

export function renderVacancyResult() {
  const analysis = state.vacancyAnalysis;
  if (!analysis) {
    els.vacancyResult.classList.add('hidden');
    return;
  }
  els.vacancyResult.classList.remove('hidden');
  els.vacancyResult.innerHTML = `
    <div class="match-score"><strong>${analysis.score}%</strong><span>совпадение требований</span></div>
    <div class="match-details">
      <h3>Совпало</h3>
      <div class="chips positive">${analysis.matched.map((item) => `<span>${escapeHtml(item)}</span>`).join('') || '<span>Совпадения не найдены</span>'}</div>
      <h3>Не найдено в профиле</h3>
      <div class="chips negative">${analysis.missing.map((item) => `<span>${escapeHtml(item)}</span>`).join('') || '<span>Критичных пробелов нет</span>'}</div>
      <p>${escapeHtml(analysis.summaryHint)}</p>
    </div>`;
}

export function getTopLanguageNames(limit = 3) {
  return languageStats().slice(0, limit).map((item) => item.name);
}
