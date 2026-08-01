import { els, state } from './js/config.js';
import { applyData, getProfileData, isValidUsername, normalizeUsername } from './js/data.js';
import { bindProjectBuilder, renderProjectBuilder } from './js/projects.js';
import { renderAll, renderVacancyResult } from './js/render.js';
import { copyResume, copyShareLink, downloadDocx, downloadMarkdown, downloadText, downloadVisualPdf, generateResume, printAtsPdf, renderResume, renderSharedResume, setTemplate } from './js/resume.js';
import { compareProfiles } from './js/compare.mjs';
import { addRecentProfile, normalizeTheme, readPreferences, resolveTheme, writePreferences } from './js/preferences.mjs';
import { decodeSharePayload } from './js/share.mjs';
import { analyzeVacancy } from './js/vacancy.mjs';
import { clearProfileCache as clearCachedProfiles, createBackup, createDraftRecord, parseBackup, readWorkspace, removeDraft, renameDraft, upsertDraft, writeWorkspace } from './js/workspace.mjs';
import { applyTranslations, formatDateTime, formatNumber, normalizeLocale, setLocale, t, translateError } from './js/i18n.mjs';
import { initAuth, refreshAuthUi } from './js/auth.mjs';
import { downloadBlob, escapeHtml, showStatus } from './js/utils.js';

let preferences = readPreferences(window.localStorage); let workspace = readWorkspace(window.localStorage); let currentDraftId = null; let autosaveTimer = null; let deferredInstallPrompt = null; let lastDataFreshness = null;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
state.locale = setLocale(preferences.locale); els.localeSelect.value = state.locale; bindProjectBuilder(); applyTheme(preferences.theme); renderRecentProfiles(); renderDrafts(); updateNetworkStatus(); registerPwa(); initAuth({ onAnalyzeSelf: (login) => { els.username.value = login; loadPrimaryProfile(login); } });

els.form.addEventListener('submit', async (event) => { event.preventDefault(); await loadPrimaryProfile(normalizeUsername(els.username.value)); });
els.recentProfiles.addEventListener('click', async (event) => { const button = event.target.closest('[data-recent-login]'); if (!button) return; els.username.value = button.dataset.recentLogin; await loadPrimaryProfile(button.dataset.recentLogin); });
els.clearRecent.addEventListener('click', () => { preferences.recentProfiles = []; persistPreferences(); renderRecentProfiles(); });
els.themeSelect.addEventListener('change', () => { preferences.theme = normalizeTheme(els.themeSelect.value); persistPreferences(); applyTheme(preferences.theme); });
els.localeSelect.addEventListener('change', () => { preferences.locale = normalizeLocale(els.localeSelect.value); state.locale = setLocale(preferences.locale); persistPreferences(); refreshLocalizedUi(); });
systemTheme.addEventListener?.('change', () => { if (preferences.theme === 'system') applyTheme('system'); });

els.compareForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const username = normalizeUsername(els.compareUsername.value);
  if (!state.currentData) return showStatus(t('status.primaryRequired'), 'warning');
  if (!isValidUsername(username)) return showStatus(t('status.compareInvalid'), 'error');
  if (username.toLowerCase() === state.user.login.toLowerCase()) return showStatus(t('status.compareDifferent'), 'warning');
  els.compareButton.disabled = true; els.compareButton.textContent = t('compare.loading');
  try { const { data } = await getProfileData(username); state.comparison = compareProfiles(state.currentData, data); renderComparison(state.comparison); showStatus(t('status.compared', { left: state.user.login, right: data.user.login }), 'success'); }
  catch (error) { showStatus(translateError(error, 'errors.compareLoad'), 'error'); }
  finally { els.compareButton.disabled = false; els.compareButton.textContent = t('compare.button'); }
});

els.vacancyButton.addEventListener('click', () => {
  const text = els.vacancyText.value.trim(); if (text.length < 40) return showStatus(t('status.vacancyShort'), 'warning');
  state.vacancyAnalysis = analyzeVacancy(text, { repos: state.repos, languages: state.languages });
  if (state.vacancyAnalysis.rankedRepos.length) { state.selectedProjects = state.vacancyAnalysis.rankedRepos.map((repo) => repo.full_name || repo.name).slice(0, 5); renderProjectBuilder(); }
  renderVacancyResult(); showStatus(t('status.vacancyDone'), 'success');
});
document.querySelector('#clearVacancyBtn').addEventListener('click', () => { els.vacancyText.value = ''; state.vacancyAnalysis = null; renderVacancyResult(); });
els.generate.addEventListener('click', () => { generateResume(); currentDraftId = null; els.draftName.value = defaultDraftName(); saveCurrentDraft({ silent: true }); });
document.querySelector('#copyBtn').addEventListener('click', copyResume); document.querySelector('#txtBtn').addEventListener('click', downloadText); document.querySelector('#markdownBtn').addEventListener('click', downloadMarkdown); document.querySelector('#docxBtn').addEventListener('click', downloadDocx); document.querySelector('#visualPdfBtn').addEventListener('click', downloadVisualPdf); document.querySelector('#atsPdfBtn').addEventListener('click', printAtsPdf); document.querySelector('#shareBtn').addEventListener('click', copyShareLink);
document.querySelectorAll('[data-template-button]').forEach((button) => button.addEventListener('click', () => { setTemplate(button.dataset.templateButton); scheduleAutosave(); }));
els.resume.addEventListener('input', scheduleAutosave); els.saveDraft.addEventListener('click', () => saveCurrentDraft()); els.draftList.addEventListener('click', handleDraftAction); els.exportBackup.addEventListener('click', exportLocalBackup); els.importBackup.addEventListener('change', importLocalBackup); els.clearProfileCache.addEventListener('click', clearProfileCaches); els.installButton.addEventListener('click', installPwa); window.addEventListener('online', updateNetworkStatus); window.addEventListener('offline', updateNetworkStatus);

async function loadPrimaryProfile(username) {
  if (!isValidUsername(username)) return showStatus(t('status.usernameInvalid'), 'error');
  document.body.classList.remove('draft-view'); showStatus(t('status.loading')); els.dashboard.classList.add('hidden'); els.resumeSection.classList.add('hidden'); els.form.querySelector('button').disabled = true;
  try {
    const { data, cached } = await getProfileData(username); state.currentData = data; applyData(data); renderAll(); els.dashboard.classList.remove('hidden'); els.compareResult.classList.add('hidden'); preferences.recentProfiles = addRecentProfile(preferences.recentProfiles, data.user); persistPreferences(); renderRecentProfiles(); renderDataFreshness(data, cached);
    if (data.auth?.privateContributionsIncluded) { showStatus(`${cached ? t('status.cached') : t('status.oauthSelfLoaded', { count: formatNumber(data.contributions?.restricted || 0) })}${Number.isFinite(data.rateLimit?.remaining) ? t('status.requestsLeft', { count: formatNumber(data.rateLimit.remaining) }) : ''}`, 'success'); }
    else if (String(data.source || '').startsWith('github-graphql')) { const remaining = data.rateLimit?.remaining; const sourceKey = data.auth?.authenticated ? 'status.oauthPublicLoaded' : 'status.proxyLoaded'; showStatus(`${cached ? t('status.cached') : t(sourceKey)}${Number.isFinite(remaining) ? t('status.requestsLeft', { count: formatNumber(remaining) }) : ''}`, 'success'); }
    else showStatus(t('status.fallback'), 'warning');
  } catch (error) { showStatus(translateError(error, 'errors.profileLoad'), 'error'); }
  finally { els.form.querySelector('button').disabled = false; }
}

function refreshLocalizedUi() {
  applyTranslations(document); refreshAuthUi(); els.localeSelect.value = state.locale; updateNetworkStatus(); renderRecentProfiles(); renderDrafts();
  if (state.currentData) renderAll(); if (state.comparison) renderComparison(state.comparison); if (state.resumeDraft) renderResume({ editable: !state.sharedMode }); if (lastDataFreshness) renderDataFreshness(lastDataFreshness.data, lastDataFreshness.cached);
}
function applyTheme(theme) { const normalized = normalizeTheme(theme); const resolved = resolveTheme(normalized, systemTheme.matches); document.documentElement.dataset.theme = resolved; document.documentElement.style.colorScheme = resolved; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f5f7fb' : '#070b12'); els.themeSelect.value = normalized; }
function persistPreferences() { preferences = writePreferences(window.localStorage, preferences); }
function renderRecentProfiles() { const items = preferences.recentProfiles; els.recentSection.classList.toggle('hidden', items.length === 0); els.recentProfiles.innerHTML = items.map((profile) => `<button class="recent-profile" type="button" data-recent-login="${escapeHtml(profile.login)}">${profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="" loading="lazy">` : '<span class="recent-avatar" aria-hidden="true">GH</span>'}<span><strong>${escapeHtml(profile.name)}</strong><small>@${escapeHtml(profile.login)}</small></span></button>`).join(''); }
function renderComparison(comparison) {
  const profile = (item, side) => `<article class="compare-profile compare-${side}"><img src="${escapeHtml(item.avatarUrl)}" alt="" loading="lazy"><div><strong>${escapeHtml(item.name)}</strong><span>@${escapeHtml(item.login)}</span></div></article>`;
  const rows = comparison.metrics.map((metric) => `<div class="compare-row"><strong class="${metric.winner === 'left' ? 'winner' : ''}">${formatNumber(metric.left)}</strong><span>${t(`compare.metrics.${metric.key}`)}</span><strong class="${metric.winner === 'right' ? 'winner' : ''}">${formatNumber(metric.right)}</strong></div>`).join('');
  const common = comparison.commonLanguages.length ? comparison.commonLanguages.map((name) => `<span>${escapeHtml(name)}</span>`).join('') : `<em>${t('compare.noCommon')}</em>`;
  els.compareResult.innerHTML = `<div class="compare-head">${profile(comparison.left, 'left')}<span class="versus">VS</span>${profile(comparison.right, 'right')}</div><div class="compare-table">${rows}</div><div class="compare-common"><strong>${t('compare.common')}</strong><div class="chips positive">${common}</div></div>`; els.compareResult.classList.remove('hidden');
}
function saveCurrentDraft({ silent = false } = {}) {
  if (!state.resumeDraft) { if (!silent) showStatus(t('status.resumeFirst'), 'warning'); return null; }
  const record = createDraftRecord({ id: currentDraftId, name: els.draftName.value.trim() || defaultDraftName(), user: state.user || {}, draft: state.resumeDraft, template: state.resumeTemplate, locale: state.locale });
  workspace.drafts = upsertDraft(workspace.drafts, record); workspace = writeWorkspace(window.localStorage, workspace); currentDraftId = record.id; els.draftName.value = record.name; renderDrafts(); if (!silent) showStatus(t('status.draftSaved', { name: record.name }), 'success'); return record;
}
function scheduleAutosave() { if (!state.resumeDraft || state.sharedMode) return; window.clearTimeout(autosaveTimer); autosaveTimer = window.setTimeout(() => saveCurrentDraft({ silent: true }), 450); }
function renderDrafts() {
  if (!workspace.drafts.length) { els.draftList.innerHTML = `<p class="draft-empty">${t('draft.empty')}</p>`; return; }
  els.draftList.innerHTML = workspace.drafts.map((record) => `<article class="draft-item ${record.id === currentDraftId ? 'active' : ''}"><div class="draft-copy"><strong>${escapeHtml(record.name)}</strong><span>@${escapeHtml(record.user?.login || 'developer')} · ${formatSavedAt(record.savedAt)} · ${record.locale.toUpperCase()} · ${record.template.toUpperCase()}</span></div><div class="draft-actions"><button class="text-button" type="button" data-draft-action="load" data-draft-id="${escapeHtml(record.id)}">${t('draft.open')}</button><button class="text-button" type="button" data-draft-action="rename" data-draft-id="${escapeHtml(record.id)}">${t('draft.rename')}</button><button class="text-button danger-text" type="button" data-draft-action="delete" data-draft-id="${escapeHtml(record.id)}">${t('draft.delete')}</button></div></article>`).join('');
}
function handleDraftAction(event) {
  const button = event.target.closest('[data-draft-action]'); if (!button) return; const record = workspace.drafts.find((item) => item.id === button.dataset.draftId); if (!record) return;
  if (button.dataset.draftAction === 'load') return loadDraft(record);
  if (button.dataset.draftAction === 'rename') { const nextName = window.prompt(t('draft.renamePrompt'), record.name); if (!nextName?.trim()) return; workspace.drafts = renameDraft(workspace.drafts, record.id, nextName); workspace = writeWorkspace(window.localStorage, workspace); if (currentDraftId === record.id) els.draftName.value = nextName.trim(); return renderDrafts(); }
  if (button.dataset.draftAction === 'delete' && window.confirm(t('draft.deleteConfirm', { name: record.name }))) { workspace.drafts = removeDraft(workspace.drafts, record.id); workspace = writeWorkspace(window.localStorage, workspace); if (currentDraftId === record.id) currentDraftId = null; renderDrafts(); }
}
function loadDraft(record) { currentDraftId = record.id; state.locale = setLocale(record.locale || 'ru'); preferences.locale = state.locale; persistPreferences(); els.localeSelect.value = state.locale; state.user = JSON.parse(JSON.stringify(record.user || {})); state.resumeDraft = JSON.parse(JSON.stringify(record.draft)); state.resumeDraft.locale = state.locale; state.resumeTemplate = record.template; state.sharedMode = false; els.draftName.value = record.name; document.body.classList.add('draft-view'); els.dashboard.classList.remove('hidden'); els.resumeSection.classList.remove('hidden'); refreshLocalizedUi(); renderDrafts(); setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 50); showStatus(t('status.draftOpened', { name: record.name }), 'success'); }
function exportLocalBackup() { const content = createBackup({ workspace, preferences }); const date = new Date().toISOString().slice(0, 10); downloadBlob(`\uFEFF${content}`, `auto-resume-backup-${date}.json`, 'application/json;charset=utf-8'); showStatus(t('status.backupSaved'), 'success'); }
async function importLocalBackup(event) { const file = event.target.files?.[0]; if (!file) return; try { const imported = parseBackup(await file.text()); workspace = writeWorkspace(window.localStorage, imported.workspace); preferences = writePreferences(window.localStorage, imported.preferences); currentDraftId = null; state.locale = setLocale(preferences.locale); els.localeSelect.value = state.locale; applyTheme(preferences.theme); refreshLocalizedUi(); showStatus(t('status.backupImported', { count: formatNumber(workspace.drafts.length) }), 'success'); } catch (error) { showStatus(translateError(error, 'errors.backupImport'), 'error'); } finally { event.target.value = ''; } }
async function clearProfileCaches() { const removed = clearCachedProfiles(window.localStorage); navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHE' }); els.dataFreshness.textContent = t('freshness.cleared'); lastDataFreshness = null; showStatus(t('status.cacheCleared', { count: formatNumber(removed) }), 'success'); }
function renderDataFreshness(data, cached) { lastDataFreshness = { data, cached }; const generatedAt = Number.isFinite(Date.parse(data.generatedAt)) ? new Date(data.generatedAt) : new Date(); els.dataFreshness.textContent = `${cached ? t('freshness.cache') : t('freshness.fresh')} · ${formatDateTime(generatedAt, { dateStyle: 'short', timeStyle: 'short' })}`; els.dataFreshness.title = t('freshness.source', { source: data.source || t('freshness.unknown') }); }
function defaultDraftName() { return t('draft.defaultName', { login: state.user?.login || state.resumeDraft?.name || 'developer' }); }
function formatSavedAt(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? formatDateTime(date, { dateStyle: 'short', timeStyle: 'short' }) : t('draft.unknownDate'); }
function updateNetworkStatus() { const online = navigator.onLine; els.networkStatus.textContent = t(online ? 'network.online' : 'network.offline'); els.networkStatus.classList.toggle('offline', !online); }
function registerPwa() { if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {})); window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; els.installButton.classList.remove('hidden'); }); window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; els.installButton.classList.add('hidden'); showStatus(t('status.installed'), 'success'); }); }
async function installPwa() { if (!deferredInstallPrompt) return; await deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; els.installButton.classList.add('hidden'); }

try { const match = window.location.hash.match(/^#resume=(.+)$/); if (match) { const payload = decodeSharePayload(match[1]); renderSharedResume(payload); preferences.locale = state.locale; els.localeSelect.value = state.locale; applyTranslations(document); } }
catch (error) { showStatus(translateError(error, 'errors.shareOpen'), 'error'); }
window.autoResumeState = state;
