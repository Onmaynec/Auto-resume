import { $, els, state } from './config.js';
import {
  contributionLevel, escapeHtml, formatDate, score, sum,
} from './utils.js';

export function renderAll() {
  renderProfile();
  renderMetrics();
  renderTips();
  renderHeatmap();
  renderGrowth();
  renderRepos();
}

function renderProfile() {
  const user = state.user;
  els.profile.innerHTML = `
    <img class="avatar" src="${user.avatar_url}" alt="${escapeHtml(user.login)}">
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

  if (!user.bio) tips.push('Ваш профиль слабо заполнен — добавьте био с ролью, стеком и специализацией.');
  if (!user.location) tips.push('Укажите локацию или формат работы: remote / hybrid / onsite.');
  if (repos.length < 3) tips.push('Добавьте или закрепите минимум 3 содержательных проекта.');
  if (repos.filter((repo) => repo.description).length < Math.min(5, repos.length)) {
    tips.push('Добавьте понятные описания репозиториев: задача, технологии и результат.');
  }
  if (sum('stargazers_count') === 0) {
    tips.push('Улучшите README: демо, скриншоты и инструкция запуска повышают доверие к проектам.');
  }
  if (state.source !== 'github-graphql') {
    tips.push('Разверните проект на Vercel с GITHUB_TOKEN, чтобы показать точный годовой календарь вкладов без публичного лимита 60 запросов.');
  }

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

function renderGrowth() {
  if (state.charts.growth) state.charts.growth.destroy();
  const labels = Object.keys(state.monthly).map((key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('ru-RU', { month: 'short' }));
  let cumulative = 0;
  const data = Object.values(state.monthly).map((value) => (cumulative += value));

  state.charts.growth = new Chart($('#growthChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Накопленный вклад',
        data,
        fill: true,
        tension: 0.38,
        borderColor: '#7c5cff',
        backgroundColor: 'rgba(124,92,255,.15)',
        pointBackgroundColor: '#29d3a2',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8f9bad' } },
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8f9bad', precision: 0 } },
      },
    },
  });
}

function renderRepos() {
  const sorted = [...state.repos].sort((a, b) => score(b) - score(a));
  els.repoCount.textContent = `${sorted.length} проектов`;
  els.repos.innerHTML = sorted.slice(0, 12).map((repo) => `
    <article class="repo">
      <a href="${repo.html_url}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)} ↗</a>
      <p>${escapeHtml(repo.description || 'Описание не добавлено.')}</p>
      <div class="repo-footer">
        <span><i class="language-dot" style="${repo.language_color ? `background:${escapeHtml(repo.language_color)}` : ''}"></i>${escapeHtml(repo.language || 'Other')}</span>
        <span>★ ${repo.stargazers_count} · ⑂ ${repo.forks_count}</span>
      </div>
    </article>
  `).join('') || '<p>Публичные репозитории не найдены.</p>';
}
