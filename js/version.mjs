export const APP_VERSION = '3.4.0';
export const RELEASE_REPOSITORY = 'Onmaynec/Auto-resume';
export const RELEASE_API_URL = `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/latest`;
export const RELEASE_PAGE_URL = `https://github.com/${RELEASE_REPOSITORY}/releases`;

export function syncVersionMetadata(documentRef = globalThis.document) {
  if (!documentRef?.documentElement) return false;
  const minorVersion = APP_VERSION.split('.').slice(0, 2).join('.');
  documentRef.documentElement.dataset.appVersion = APP_VERSION;
  if (documentRef.title) documentRef.title = documentRef.title.replace(/Auto Resume v\d+\.\d+(?:\.\d+)?/, `Auto Resume v${minorVersion}`);
  const title = documentRef.querySelector('meta[property="og:title"]');
  if (title) title.content = `Auto Resume v${minorVersion}`;
  const description = documentRef.querySelector('meta[name="description"]');
  if (description) description.content = `Auto Resume v${minorVersion} — двуязычный PWA-конструктор GitHub-резюме с безопасными шаблонами.`;
  const brandVersion = documentRef.querySelector('.brand small');
  if (brandVersion) brandVersion.textContent = `v${minorVersion}`;
  return true;
}

if (typeof document !== 'undefined') syncVersionMetadata(document);
