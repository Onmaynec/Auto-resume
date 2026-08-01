import { formatDateTime, getLocale, t } from './i18n.mjs';
import { showStatus } from './utils.js';

const authState = { configured: false, authenticated: false, user: null, scopes: [], capabilities: {} };
let analyzeSelf = null;
let root = null;
let dialog = null;

export async function initAuth({ onAnalyzeSelf } = {}) {
  analyzeSelf = typeof onAnalyzeSelf === 'function' ? onAnalyzeSelf : null;
  mountAuthUi();
  await refreshAuthSession();
  handleAuthResult();
  return getAuthState();
}

export function getAuthState() {
  return JSON.parse(JSON.stringify(authState));
}

export function refreshAuthUi() {
  if (!root) return;
  renderAuthControl();
  renderConsentDialog();
}

export async function refreshAuthSession() {
  try {
    const response = await fetch('/api/auth/session', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('AUTH_SESSION_UNAVAILABLE');
    Object.assign(authState, await response.json());
  } catch {
    Object.assign(authState, { configured: false, authenticated: false, user: null, scopes: [], capabilities: {} });
  }
  syncCachePartition();
  refreshAuthUi();
  window.autoResumeAuth = getAuthState();
  return getAuthState();
}

function mountAuthUi() {
  if (document.querySelector('#authControl')) {
    root = document.querySelector('#authControl');
    dialog = document.querySelector('#authConsentDialog');
    return;
  }
  root = document.createElement('div');
  root.id = 'authControl';
  root.className = 'auth-control';
  const navActions = document.querySelector('.nav-actions');
  const githubLink = navActions?.querySelector('.nav-link');
  if (navActions) navActions.insertBefore(root, githubLink || null);

  dialog = document.createElement('dialog');
  dialog.id = 'authConsentDialog';
  dialog.className = 'auth-dialog';
  document.body.append(dialog);
  root.addEventListener('click', handleControlClick);
  dialog.addEventListener('click', handleDialogClick);
  dialog.addEventListener('cancel', () => dialog.close());
}

function renderAuthControl() {
  if (!authState.configured) {
    root.innerHTML = `<button class="btn btn-secondary btn-compact" type="button" disabled title="${escapeAttribute(t('auth.notConfigured'))}">${escapeHtml(t('auth.signIn'))}</button>`;
    return;
  }
  if (!authState.authenticated) {
    root.innerHTML = `<button class="btn btn-secondary btn-compact auth-login" type="button" data-auth-action="consent">${escapeHtml(t('auth.signIn'))}</button>`;
    return;
  }
  const user = authState.user || {};
  root.innerHTML = `
    <details class="auth-menu">
      <summary class="auth-summary">
        ${user.avatarUrl ? `<img src="${escapeAttribute(user.avatarUrl)}" alt="" referrerpolicy="no-referrer">` : '<span class="auth-avatar" aria-hidden="true">GH</span>'}
        <span>${escapeHtml(t('auth.signedIn', { login: user.login || 'github' }))}</span>
      </summary>
      <div class="auth-popover">
        <strong>${escapeHtml(user.name || user.login || 'GitHub')}</strong>
        <span>@${escapeHtml(user.login || '')}</span>
        <small>${escapeHtml(t(authState.capabilities?.privateContributions ? 'auth.privateEnabled' : 'auth.privateUnavailable'))}</small>
        ${authState.expiresAt ? `<small>${escapeHtml(t('auth.sessionUntil', { time: formatDateTime(authState.expiresAt, { dateStyle: 'short', timeStyle: 'short' }) }))}</small>` : ''}
        <button type="button" class="text-button" data-auth-action="analyze">${escapeHtml(t('auth.analyzeSelf'))}</button>
        <button type="button" class="text-button" data-auth-action="logout">${escapeHtml(t('auth.logout'))}</button>
        <button type="button" class="text-button danger-text" data-auth-action="disconnect">${escapeHtml(t('auth.disconnect'))}</button>
      </div>
    </details>`;
}

function renderConsentDialog() {
  if (!dialog) return;
  dialog.innerHTML = `
    <form method="dialog" class="auth-dialog-card">
      <button class="auth-dialog-close" value="cancel" aria-label="${escapeAttribute(t('auth.cancel'))}">×</button>
      <span class="kicker">GitHub OAuth</span>
      <h2>${escapeHtml(t('auth.consentTitle'))}</h2>
      <p>${escapeHtml(t('auth.consentBody'))}</p>
      <ul>
        <li>${escapeHtml(t('auth.permissionProfile'))}</li>
        <li>${escapeHtml(t('auth.permissionPrivate'))}</li>
        <li>${escapeHtml(t('auth.permissionNoCode'))}</li>
      </ul>
      <p class="auth-security-note">${escapeHtml(t('auth.securityNote'))}</p>
      <div class="inline-actions">
        <button class="btn btn-secondary" value="cancel">${escapeHtml(t('auth.cancel'))}</button>
        <button class="btn btn-primary" type="button" data-auth-action="start">${escapeHtml(t('auth.continue'))}</button>
      </div>
    </form>`;
}

async function handleControlClick(event) {
  const button = event.target.closest('[data-auth-action]');
  if (!button) return;
  const action = button.dataset.authAction;
  if (action === 'consent') return dialog?.showModal();
  if (action === 'analyze' && authState.user?.login) {
    root.querySelector('details')?.removeAttribute('open');
    analyzeSelf?.(authState.user.login);
    return;
  }
  if (action === 'logout') return endSession('none');
  if (action === 'disconnect' && window.confirm(t('auth.disconnectConfirm'))) return endSession('grant');
}

function handleDialogClick(event) {
  const button = event.target.closest('[data-auth-action="start"]');
  if (!button) return;
  button.disabled = true;
  button.textContent = t('auth.redirecting');
  const current = new URL(window.location.href);
  current.searchParams.delete('auth');
  current.searchParams.delete('reason');
  const returnTo = `${current.pathname}${current.search}${current.hash}`;
  window.location.assign(`/api/auth/start?returnTo=${encodeURIComponent(returnTo)}`);
}

async function endSession(mode) {
  try {
    const response = await fetch(`/api/auth/session?revoke=${encodeURIComponent(mode)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('AUTH_LOGOUT_FAILED');
    Object.assign(authState, { authenticated: false, user: null, scopes: [], capabilities: {} });
    syncCachePartition();
    refreshAuthUi();
    window.autoResumeAuth = getAuthState();
    showStatus(t(mode === 'grant' ? 'status.authDisconnected' : 'status.authLogout'), 'success');
  } catch {
    showStatus(t('errors.authLogout'), 'error');
  }
}

function handleAuthResult() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get('auth');
  if (!result) return;
  const key = result === 'success' ? 'status.authSuccess' : result === 'denied' ? 'status.authDenied' : result === 'unconfigured' ? 'status.authUnconfigured' : 'status.authError';
  showStatus(t(key), result === 'success' ? 'success' : result === 'denied' ? 'warning' : 'error');
  url.searchParams.delete('auth');
  url.searchParams.delete('reason');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function syncCachePartition() {
  try {
    if (authState.authenticated && authState.user?.login) sessionStorage.setItem('auto-resume:auth-login', authState.user.login.toLowerCase());
    else sessionStorage.removeItem('auto-resume:auth-login');
  } catch { /* optional browser storage */ }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function escapeAttribute(value) { return escapeHtml(value); }

export const _private = { syncCachePartition, escapeHtml, getLocale };
