import { els, state } from './js/config.js';
import { applyData, getProfileData, isValidUsername, normalizeUsername } from './js/data.js';
import { bindProjectBuilder, renderProjectBuilder } from './js/projects.js';
import { renderAll, renderVacancyResult } from './js/render.js';
import {
  copyResume, copyShareLink, downloadText, downloadVisualPdf, generateResume,
  printAtsPdf, renderSharedResume, setTemplate,
} from './js/resume.js';
import { compareProfiles } from './js/compare.mjs';
import {
  addRecentProfile, normalizeTheme, readPreferences, resolveTheme, writePreferences,
} from './js/preferences.mjs';
import { decodeSharePayload } from './js/share.mjs';
import { analyzeVacancy } from './js/vacancy.mjs';
import { escapeHtml, showStatus } from './js/utils.js';

let preferences = readPreferences(window.localStorage);
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

bindProjectBuilder();
applyTheme(preferences.theme);
renderRecentProfiles();

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await loadPrimaryProfile(normalizeUsername(els.username.value));
});

els.recentProfiles.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-recent-login]');
  if (!button) return;
  els.username.value = button.dataset.recentLogin;
  await loadPrimaryProfile(button.dataset.recentLogin);
});

els.clearRecent.addEventListener('click', () => {
  preferences.recentProfiles = [];
  persistPreferences();
  renderRecentProfiles();
});

els.themeSelect.addEventListener('change', () => {
  preferences.theme = normalizeTheme(els.themeSelect.value);
  persistPreferences();
  applyTheme(preferences.theme);
});

systemTheme.addEventListener?.('change', () => {
  if (preferences.theme === 'system') applyTheme('system');
});

els.compareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = normalizeUsername(els.compareUsername.value);
  if (!state.currentData) {
    showStatus('Сначала загрузите основной GitHub-профиль.', 'warning');
    return;
  }
  if (!isValidUsername(username)) {
    showStatus('Некорректный username для сравнения.', 'error');
    return;
  }
  if (username.toLowerCase() === state.user.login.toLowerCase()) {
    showStatus('Для сравнения выберите другой GitHub-профиль.', 'warning');
    return;
  }

  els.compareButton.disabled = true;
  els.compareButton.textContent = 'Сравниваем…';
  try {
    const { data } = await getProfileData(username);
    renderComparison(compareProfiles(state.currentData, data));
    showStatus(`Профили ${state.user.login} и ${data.user.login} сопоставлены.`, 'success');
  } catch (error) {
    showStatus(error.message || 'Не удалось загрузить второй профиль.', 'error');
  } finally {
    els.compareButton.disabled = false;
    els.compareButton.textContent = 'Сравнить';
  }
});

els.vacancyButton.addEventListener('click', () => {
  const text = els.vacancyText.value.trim();
  if (text.length < 40) {
    showStatus('Добавьте более подробное описание вакансии — минимум 40 символов.', 'warning');
    return;
  }
  state.vacancyAnalysis = analyzeVacancy(text, { repos: state.repos, languages: state.languages });
  if (state.vacancyAnalysis.rankedRepos.length) {
    state.selectedProjects = state.vacancyAnalysis.rankedRepos.map((repo) => repo.full_name || repo.name).slice(0, 5);
    renderProjectBuilder();
  }
  renderVacancyResult();
  showStatus('Вакансия проанализирована. Проекты и заголовок резюме адаптированы под требования.', 'success');
});

document.querySelector('#clearVacancyBtn').addEventListener('click', () => {
  els.vacancyText.value = '';
  state.vacancyAnalysis = null;
  renderVacancyResult();
});

els.generate.addEventListener('click', generateResume);
document.querySelector('#copyBtn').addEventListener('click', copyResume);
document.querySelector('#txtBtn').addEventListener('click', downloadText);
document.querySelector('#visualPdfBtn').addEventListener('click', downloadVisualPdf);
document.querySelector('#atsPdfBtn').addEventListener('click', printAtsPdf);
document.querySelector('#shareBtn').addEventListener('click', copyShareLink);
document.querySelectorAll('[data-template-button]').forEach((button) => {
  button.addEventListener('click', () => setTemplate(button.dataset.templateButton));
});

async function loadPrimaryProfile(username) {
  if (!isValidUsername(username)) {
    showStatus('Некорректный GitHub username. Используйте латинские буквы, цифры и дефисы.', 'error');
    return;
  }

  showStatus('Анализируем профиль, проекты, активность и историю языков…');
  els.dashboard.classList.add('hidden');
  els.resumeSection.classList.add('hidden');
  els.form.querySelector('button').disabled = true;

  try {
    const { data, cached } = await getProfileData(username);
    state.currentData = data;
    applyData(data);
    renderAll();
    els.dashboard.classList.remove('hidden');
    els.compareResult.classList.add('hidden');
    preferences.recentProfiles = addRecentProfile(preferences.recentProfiles, data.user);
    persistPreferences();
    renderRecentProfiles();

    if (data.source === 'github-graphql') {
      const remaining = data.rateLimit?.remaining;
      const suffix = Number.isFinite(remaining) ? ` Осталось запросов GitHub: ${remaining}.` : '';
      showStatus(`${cached ? 'Показаны кэшированные данные.' : 'Годовая аналитика загружена через безопасный API-прокси.'}${suffix}`, 'success');
    } else {
      showStatus('Включён экономный режим. История языков и точная годовая активность доступны после развёртывания на Vercel с GITHUB_TOKEN.', 'warning');
    }
  } catch (error) {
    showStatus(error.message || 'Не удалось загрузить данные GitHub.', 'error');
  } finally {
    els.form.querySelector('button').disabled = false;
  }
}

function applyTheme(theme) {
  const normalized = normalizeTheme(theme);
  const resolved = resolveTheme(normalized, systemTheme.matches);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  els.themeSelect.value = normalized;
}

function persistPreferences() {
  preferences = writePreferences(window.localStorage, preferences);
}

function renderRecentProfiles() {
  const items = preferences.recentProfiles;
  els.recentSection.classList.toggle('hidden', items.length === 0);
  els.recentProfiles.innerHTML = items.map((profile) => `
    <button class="recent-profile" type="button" data-recent-login="${escapeHtml(profile.login)}">
      ${profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="" loading="lazy">` : '<span class="recent-avatar" aria-hidden="true">GH</span>'}
      <span><strong>${escapeHtml(profile.name)}</strong><small>@${escapeHtml(profile.login)}</small></span>
    </button>
  `).join('');
}

function renderComparison(comparison) {
  const profile = (item, side) => `
    <article class="compare-profile compare-${side}">
      <img src="${escapeHtml(item.avatarUrl)}" alt="" loading="lazy">
      <div><strong>${escapeHtml(item.name)}</strong><span>@${escapeHtml(item.login)}</span></div>
    </article>`;

  const rows = comparison.metrics.map((metric) => `
    <div class="compare-row">
      <strong class="${metric.winner === 'left' ? 'winner' : ''}">${metric.left.toLocaleString('ru-RU')}</strong>
      <span>${escapeHtml(metric.label)}</span>
      <strong class="${metric.winner === 'right' ? 'winner' : ''}">${metric.right.toLocaleString('ru-RU')}</strong>
    </div>
  `).join('');

  const common = comparison.commonLanguages.length
    ? comparison.commonLanguages.map((name) => `<span>${escapeHtml(name)}</span>`).join('')
    : '<em>Общие технологии в топ-5 не найдены</em>';

  els.compareResult.innerHTML = `
    <div class="compare-head">${profile(comparison.left, 'left')}<span class="versus">VS</span>${profile(comparison.right, 'right')}</div>
    <div class="compare-table">${rows}</div>
    <div class="compare-common"><strong>Общие технологии</strong><div class="chips positive">${common}</div></div>
  `;
  els.compareResult.classList.remove('hidden');
}

try {
  const match = window.location.hash.match(/^#resume=(.+)$/);
  if (match) renderSharedResume(decodeSharePayload(match[1]));
} catch (error) {
  showStatus(error.message || 'Не удалось открыть публичное резюме.', 'error');
}

window.autoResumeState = state;
