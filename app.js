import { els, state } from './js/config.js';
import { applyData, getProfileData, isValidUsername, normalizeUsername } from './js/data.js';
import { bindProjectBuilder, renderProjectBuilder } from './js/projects.js';
import { renderAll, renderVacancyResult } from './js/render.js';
import {
  copyResume, copyShareLink, downloadText, downloadVisualPdf, generateResume,
  printAtsPdf, renderResume, renderSharedResume, setTemplate,
} from './js/resume.js';
import { compareProfiles } from './js/compare.mjs';
import {
  addRecentProfile, normalizeTheme, readPreferences, resolveTheme, writePreferences,
} from './js/preferences.mjs';
import { decodeSharePayload } from './js/share.mjs';
import { analyzeVacancy } from './js/vacancy.mjs';
import {
  clearProfileCache as clearCachedProfiles, createBackup, createDraftRecord, parseBackup,
  readWorkspace, removeDraft, renameDraft, upsertDraft, writeWorkspace,
} from './js/workspace.mjs';
import { downloadBlob, escapeHtml, showStatus } from './js/utils.js';

let preferences = readPreferences(window.localStorage);
let workspace = readWorkspace(window.localStorage);
let currentDraftId = null;
let autosaveTimer = null;
let deferredInstallPrompt = null;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

bindProjectBuilder();
applyTheme(preferences.theme);
renderRecentProfiles();
renderDrafts();
updateNetworkStatus();
registerPwa();

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

els.generate.addEventListener('click', () => {
  generateResume();
  currentDraftId = null;
  els.draftName.value = defaultDraftName();
  saveCurrentDraft({ silent: true });
});

document.querySelector('#copyBtn').addEventListener('click', copyResume);
document.querySelector('#txtBtn').addEventListener('click', downloadText);
document.querySelector('#visualPdfBtn').addEventListener('click', downloadVisualPdf);
document.querySelector('#atsPdfBtn').addEventListener('click', printAtsPdf);
document.querySelector('#shareBtn').addEventListener('click', copyShareLink);
document.querySelectorAll('[data-template-button]').forEach((button) => {
  button.addEventListener('click', () => {
    setTemplate(button.dataset.templateButton);
    scheduleAutosave();
  });
});

els.resume.addEventListener('input', scheduleAutosave);
els.saveDraft.addEventListener('click', () => saveCurrentDraft());
els.draftList.addEventListener('click', handleDraftAction);
els.exportBackup.addEventListener('click', exportLocalBackup);
els.importBackup.addEventListener('change', importLocalBackup);
els.clearProfileCache.addEventListener('click', clearProfileCaches);
els.installButton.addEventListener('click', installPwa);
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

async function loadPrimaryProfile(username) {
  if (!isValidUsername(username)) {
    showStatus('Некорректный GitHub username. Используйте латинские буквы, цифры и дефисы.', 'error');
    return;
  }

  document.body.classList.remove('draft-view');
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
    renderDataFreshness(data, cached);

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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f5f7fb' : '#070b12');
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

function saveCurrentDraft({ silent = false } = {}) {
  if (!state.resumeDraft) {
    if (!silent) showStatus('Сначала сгенерируйте или откройте резюме.', 'warning');
    return null;
  }
  const record = createDraftRecord({
    id: currentDraftId,
    name: els.draftName.value.trim() || defaultDraftName(),
    user: state.user || {},
    draft: state.resumeDraft,
    template: state.resumeTemplate,
  });
  workspace.drafts = upsertDraft(workspace.drafts, record);
  workspace = writeWorkspace(window.localStorage, workspace);
  currentDraftId = record.id;
  els.draftName.value = record.name;
  renderDrafts();
  if (!silent) showStatus(`Черновик «${record.name}» сохранён локально.`, 'success');
  return record;
}

function scheduleAutosave() {
  if (!state.resumeDraft || state.sharedMode) return;
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => saveCurrentDraft({ silent: true }), 450);
}

function renderDrafts() {
  if (!workspace.drafts.length) {
    els.draftList.innerHTML = '<p class="draft-empty">Сохранённых черновиков пока нет.</p>';
    return;
  }
  els.draftList.innerHTML = workspace.drafts.map((record) => `
    <article class="draft-item ${record.id === currentDraftId ? 'active' : ''}">
      <div class="draft-copy">
        <strong>${escapeHtml(record.name)}</strong>
        <span>@${escapeHtml(record.user?.login || 'developer')} · ${formatSavedAt(record.savedAt)} · ${record.template.toUpperCase()}</span>
      </div>
      <div class="draft-actions">
        <button class="text-button" type="button" data-draft-action="load" data-draft-id="${escapeHtml(record.id)}">Открыть</button>
        <button class="text-button" type="button" data-draft-action="rename" data-draft-id="${escapeHtml(record.id)}">Переименовать</button>
        <button class="text-button danger-text" type="button" data-draft-action="delete" data-draft-id="${escapeHtml(record.id)}">Удалить</button>
      </div>
    </article>
  `).join('');
}

function handleDraftAction(event) {
  const button = event.target.closest('[data-draft-action]');
  if (!button) return;
  const record = workspace.drafts.find((item) => item.id === button.dataset.draftId);
  if (!record) return;

  if (button.dataset.draftAction === 'load') {
    loadDraft(record);
    return;
  }
  if (button.dataset.draftAction === 'rename') {
    const nextName = window.prompt('Новое название черновика', record.name);
    if (!nextName?.trim()) return;
    workspace.drafts = renameDraft(workspace.drafts, record.id, nextName);
    workspace = writeWorkspace(window.localStorage, workspace);
    if (currentDraftId === record.id) els.draftName.value = nextName.trim();
    renderDrafts();
    return;
  }
  if (button.dataset.draftAction === 'delete' && window.confirm(`Удалить черновик «${record.name}»?`)) {
    workspace.drafts = removeDraft(workspace.drafts, record.id);
    workspace = writeWorkspace(window.localStorage, workspace);
    if (currentDraftId === record.id) currentDraftId = null;
    renderDrafts();
  }
}

function loadDraft(record) {
  currentDraftId = record.id;
  state.user = JSON.parse(JSON.stringify(record.user || {}));
  state.resumeDraft = JSON.parse(JSON.stringify(record.draft));
  state.resumeTemplate = record.template;
  state.sharedMode = false;
  els.draftName.value = record.name;
  document.body.classList.add('draft-view');
  els.dashboard.classList.remove('hidden');
  els.resumeSection.classList.remove('hidden');
  renderResume({ editable: true });
  renderDrafts();
  setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 50);
  showStatus(`Открыт локальный черновик «${record.name}».`, 'success');
}

function exportLocalBackup() {
  const content = createBackup({ workspace, preferences });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(`\uFEFF${content}`, `auto-resume-backup-${date}.json`, 'application/json;charset=utf-8');
  showStatus('Резервная копия сохранена.', 'success');
}

async function importLocalBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = parseBackup(await file.text());
    workspace = writeWorkspace(window.localStorage, imported.workspace);
    preferences = writePreferences(window.localStorage, imported.preferences);
    currentDraftId = null;
    applyTheme(preferences.theme);
    renderRecentProfiles();
    renderDrafts();
    showStatus(`Импортировано черновиков: ${workspace.drafts.length}.`, 'success');
  } catch (error) {
    showStatus(error.message || 'Не удалось импортировать резервную копию.', 'error');
  } finally {
    event.target.value = '';
  }
}

async function clearProfileCaches() {
  const removed = clearCachedProfiles(window.localStorage);
  navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHE' });
  els.dataFreshness.textContent = 'API-кэш очищен';
  showStatus(`Удалено кэшированных профилей: ${removed}. Черновики и настройки сохранены.`, 'success');
}

function renderDataFreshness(data, cached) {
  const generatedAt = Number.isFinite(Date.parse(data.generatedAt)) ? new Date(data.generatedAt) : new Date();
  const mode = cached ? 'кэш' : 'свежие данные';
  els.dataFreshness.textContent = `${mode} · ${generatedAt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}`;
  els.dataFreshness.title = `Источник: ${data.source || 'неизвестен'}`;
}

function defaultDraftName() {
  return `Резюме @${state.user?.login || state.resumeDraft?.name || 'developer'}`;
}

function formatSavedAt(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
    : 'дата неизвестна';
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  els.networkStatus.textContent = online ? 'Онлайн' : 'Офлайн';
  els.networkStatus.classList.toggle('offline', !online);
}

function registerPwa() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installButton.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    els.installButton.classList.add('hidden');
    showStatus('Auto Resume установлен как приложение.', 'success');
  });
}

async function installPwa() {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installButton.classList.add('hidden');
}

try {
  const match = window.location.hash.match(/^#resume=(.+)$/);
  if (match) renderSharedResume(decodeSharePayload(match[1]));
} catch (error) {
  showStatus(error.message || 'Не удалось открыть публичное резюме.', 'error');
}

window.autoResumeState = state;
