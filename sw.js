const APP_VERSION = '3.3.0';
const SHELL_CACHE = `auto-resume-v${APP_VERSION}-shell-v1`;
const RUNTIME_CACHE = `auto-resume-v${APP_VERSION}-runtime-v1`;
const APP_SHELL = [
  './', './index.html', './styles.css', './v21.css', './v22.css', './auth.css', './update.css', './app.js',
  './manifest.webmanifest', './icons/app-icon.svg',
  './js/config.js', './js/data.js', './js/projects.js', './js/render.js', './js/resume.js',
  './js/utils.js', './js/project-selection.mjs', './js/resume-text.mjs', './js/share.mjs',
  './js/vacancy.mjs', './js/preferences.mjs', './js/compare.mjs', './js/workspace.mjs', './js/i18n.mjs',
  './js/docx-export.mjs', './js/auth.mjs', './js/version.mjs', './js/update.mjs', './js/template-system.mjs',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (url.origin === self.location.origin) event.respondWith(cacheFirst(request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_RUNTIME_CACHE') event.waitUntil(caches.delete(RUNTIME_CACHE));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('./index.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}
