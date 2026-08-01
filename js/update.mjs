import { APP_VERSION, RELEASE_API_URL, RELEASE_PAGE_URL, RELEASE_REPOSITORY } from './version.mjs';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5_000;
const UPDATE_WAIT_MS = 8_000;
const SEMVER_RE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const TRUSTED_RELEASE_PREFIX = `https://github.com/${RELEASE_REPOSITORY}/releases/`;

const messages = {
  ru: {
    kicker: 'GitHub Release',
    title: 'Доступно обновление',
    available: 'Версия {latest} готова заменить установленную версию {current}. Новый app shell уже загружается в фоне.',
    workerReady: 'Новая версия приложения загружена и готова к установке.',
    notes: 'Что изменилось ↗',
    apply: 'Обновить сейчас',
    later: 'Позже',
    preparing: 'Проверяем файлы обновления…',
    applying: 'Применяем обновление…',
    reload: 'Перезапускаем приложение…',
  },
  en: {
    kicker: 'GitHub Release',
    title: 'Update available',
    available: 'Version {latest} is ready to replace installed version {current}. The new app shell is downloading in the background.',
    workerReady: 'A new app version has been downloaded and is ready to install.',
    notes: 'Release notes ↗',
    apply: 'Update now',
    later: 'Later',
    preparing: 'Checking update files…',
    applying: 'Applying update…',
    reload: 'Restarting the app…',
  },
};

export function parseSemver(value) {
  const match = String(value || '').trim().match(SEMVER_RE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    version: `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`,
  };
}

export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (!a || !b) throw new TypeError('INVALID_SEMVER');
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  return 0;
}

export function parseLatestRelease(payload) {
  if (!payload || typeof payload !== 'object' || payload.draft === true || payload.prerelease === true) return null;
  const parsed = parseSemver(payload.tag_name);
  if (!parsed) return null;
  const url = String(payload.html_url || '').trim();
  if (!url.startsWith(TRUSTED_RELEASE_PREFIX)) return null;
  const publishedAt = Number.isFinite(Date.parse(payload.published_at)) ? new Date(payload.published_at).toISOString() : null;
  return { version: parsed.version, tag: `v${parsed.version}`, url, publishedAt };
}

export function shouldOfferUpdate(currentVersion, release) {
  return Boolean(release && parseSemver(currentVersion) && compareSemver(release.version, currentVersion) > 0);
}

export async function fetchLatestRelease(fetchImpl = globalThis.fetch, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  if (typeof fetchImpl !== 'function') return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(RELEASE_API_URL, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response?.ok) return null;
    return parseLatestRelease(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function language() {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

function format(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

function waitForWaitingWorker(registration, timeoutMs = UPDATE_WAIT_MS) {
  if (registration.waiting) return Promise.resolve(registration.waiting);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (worker = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(worker);
    };
    const watch = (worker) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') finish(registration.waiting || worker);
        if (worker.state === 'redundant') finish(null);
      });
    };
    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing), { once: true });
    const timer = setTimeout(() => finish(registration.waiting || null), timeoutMs);
  });
}

export function bootstrapUpdateManager() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const ui = {
    banner: document.querySelector('#updateBanner'),
    kicker: document.querySelector('#updateKicker'),
    title: document.querySelector('#updateTitle'),
    message: document.querySelector('#updateMessage'),
    notes: document.querySelector('#updateNotes'),
    apply: document.querySelector('#updateApplyBtn'),
    later: document.querySelector('#updateLaterBtn'),
    status: document.querySelector('#updateStatus'),
  };
  if (Object.values(ui).some((element) => !element)) return null;

  let registration = null;
  let waitingWorker = null;
  let latestRelease = null;
  let lastCheckedAt = 0;
  let reloading = false;

  const text = () => messages[language()];
  const dismissalKey = () => `auto-resume:update:dismissed:${latestRelease?.version || 'worker'}`;

  function render({ force = false } = {}) {
    const copy = text();
    const dismissed = sessionStorage.getItem(dismissalKey()) === '1';
    if (!force && dismissed) return;
    ui.kicker.textContent = copy.kicker;
    ui.title.textContent = copy.title;
    ui.message.textContent = latestRelease
      ? format(copy.available, { latest: latestRelease.version, current: APP_VERSION })
      : copy.workerReady;
    ui.notes.textContent = copy.notes;
    ui.notes.href = latestRelease?.url || RELEASE_PAGE_URL;
    ui.apply.textContent = copy.apply;
    ui.later.textContent = copy.later;
    ui.status.textContent = waitingWorker ? '' : copy.preparing;
    ui.banner.classList.remove('hidden');
  }

  function hide() {
    ui.banner.classList.add('hidden');
  }

  function observeRegistration(nextRegistration) {
    registration = nextRegistration;
    waitingWorker = registration.waiting || null;
    if (waitingWorker) render();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting || worker;
          render({ force: true });
        }
      });
    });
  }

  async function connectServiceWorker() {
    if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) return null;
    try {
      const nextRegistration = await navigator.serviceWorker.register('./sw.js');
      observeRegistration(nextRegistration);
      return nextRegistration;
    } catch {
      return null;
    }
  }

  async function checkNow({ force = false } = {}) {
    if (!navigator.onLine) return null;
    const now = Date.now();
    if (!force && now - lastCheckedAt < CHECK_INTERVAL_MS) return latestRelease;
    lastCheckedAt = now;
    const release = await fetchLatestRelease();
    if (!release) return null;
    latestRelease = release;
    if (shouldOfferUpdate(APP_VERSION, release)) {
      render();
      registration?.update().catch(() => {});
    }
    return release;
  }

  async function applyUpdate() {
    const copy = text();
    ui.apply.disabled = true;
    ui.later.disabled = true;
    ui.status.textContent = copy.applying;
    if (!registration) registration = await connectServiceWorker();
    if (!registration) {
      ui.status.textContent = copy.reload;
      location.reload();
      return;
    }
    if (!waitingWorker) {
      await registration.update().catch(() => {});
      waitingWorker = await waitForWaitingWorker(registration);
    }
    if (!waitingWorker) {
      ui.status.textContent = copy.reload;
      location.reload();
      return;
    }
    reloading = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => { if (reloading) location.reload(); }, 5_000);
  }

  ui.apply.addEventListener('click', applyUpdate);
  ui.later.addEventListener('click', () => {
    sessionStorage.setItem(dismissalKey(), '1');
    hide();
  });
  document.querySelector('#localeSelect')?.addEventListener('change', () => {
    if (!ui.banner.classList.contains('hidden')) render({ force: true });
  });
  window.addEventListener('online', () => checkNow({ force: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkNow();
  });
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (!reloading) return;
    reloading = false;
    ui.status.textContent = text().reload;
    location.reload();
  });

  connectServiceWorker().then(() => setTimeout(() => checkNow({ force: true }), 1_500));
  const api = { version: APP_VERSION, checkNow, applyUpdate, get release() { return latestRelease; } };
  window.autoResumeUpdate = api;
  return api;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') bootstrapUpdateManager();
