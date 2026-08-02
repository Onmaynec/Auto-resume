import { normalizeLocale } from './i18n.mjs';
import { normalizePresentation, presentationMode } from './template-system.mjs';

function codedError(code) { const error = new Error(code); error.code = code; return error; }

export function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeSharePayload(encoded) {
  if (!encoded || encoded.length > 24_000) throw codedError('SHARE_DAMAGED');
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  let bytes;
  try {
    if (typeof atob === 'function') {
      const binary = atob(base64);
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    } else bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
  } catch {
    throw codedError('SHARE_DAMAGED');
  }
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw codedError('SHARE_DAMAGED'); }
  validateSharePayload(payload);
  if (!payload.locale) payload.locale = 'ru';
  const legacyMode = payload.template === 'ats' ? 'ats' : 'visual';
  const presentation = normalizePresentation(payload.presentation || payload.draft?.presentation, { mode: legacyMode });
  payload.presentation = presentation;
  payload.template = presentationMode(presentation);
  payload.draft = sanitizeDraft(payload.draft, presentation, payload.locale);
  return payload;
}

export function buildSharePayload(state) {
  const mode = state.resumeTemplate === 'ats' ? 'ats' : 'visual';
  const presentation = normalizePresentation(state.resumeDraft?.presentation, { mode });
  const locale = normalizeLocale(state.locale);
  return {
    version: 4,
    createdAt: new Date().toISOString(),
    locale,
    user: {
      login: state.user?.login || '',
      avatar_url: state.user?.avatar_url || '',
      html_url: state.user?.html_url || '',
      location: state.user?.location || '',
    },
    draft: sanitizeDraft(state.resumeDraft, presentation, locale),
    template: presentationMode(presentation),
    presentation,
    skills: Array.isArray(state.resumeDraft?.skills) ? state.resumeDraft.skills : [],
  };
}

function sanitizeDraft(value, presentation, locale) {
  const draft = value && typeof value === 'object' ? value : {};
  return {
    locale: normalizeLocale(draft.locale || locale),
    name: String(draft.name || '').slice(0, 240),
    headline: String(draft.headline || '').slice(0, 500),
    contact: String(draft.contact || '').slice(0, 1_000),
    about: String(draft.about || '').slice(0, 6_000),
    projects: (Array.isArray(draft.projects) ? draft.projects : []).slice(0, 12).map((project) => ({
      id: String(project?.id || '').slice(0, 240),
      name: String(project?.name || '').slice(0, 240),
      url: sanitizeHttpsUrl(project?.url),
      description: String(project?.description || '').slice(0, 2_000),
    })),
    skills: (Array.isArray(draft.skills) ? draft.skills : []).slice(0, 16).map((skill) => typeof skill === 'object'
      ? { name: String(skill?.name || '').slice(0, 120), value: finiteNumber(skill?.value), percent: finiteNumber(skill?.percent) }
      : String(skill || '').slice(0, 120)),
    presentation: normalizePresentation(presentation),
  };
}

function validateSharePayload(payload) {
  if (!payload || ![2, 3, 4].includes(payload.version) || typeof payload.draft !== 'object') throw codedError('SHARE_VERSION');
  if (JSON.stringify(payload).length > 18_000) throw codedError('SHARE_LARGE');
}

function sanitizeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
