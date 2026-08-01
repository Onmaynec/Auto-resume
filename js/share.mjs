import { normalizeLocale } from './i18n.mjs';
function codedError(code) { const error = new Error(code); error.code = code; return error; }
export function encodeSharePayload(payload) { const json = JSON.stringify(payload); const bytes = new TextEncoder().encode(json); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64'); return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
export function decodeSharePayload(encoded) {
  if (!encoded || encoded.length > 24_000) throw codedError('SHARE_DAMAGED');
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '='); let bytes;
  try { if (typeof atob === 'function') { const binary = atob(base64); bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0)); } else bytes = Uint8Array.from(Buffer.from(base64, 'base64')); } catch { throw codedError('SHARE_DAMAGED'); }
  let payload; try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw codedError('SHARE_DAMAGED'); }
  validateSharePayload(payload); if (!payload.locale) payload.locale = 'ru'; return payload;
}
export function buildSharePayload(state) { return { version: 3, createdAt: new Date().toISOString(), locale: normalizeLocale(state.locale), user: { login: state.user?.login || '', avatar_url: state.user?.avatar_url || '', html_url: state.user?.html_url || '', location: state.user?.location || '' }, draft: state.resumeDraft, template: state.resumeTemplate || 'visual', skills: state.resumeDraft?.skills || [] }; }
function validateSharePayload(payload) { if (!payload || ![2, 3].includes(payload.version) || typeof payload.draft !== 'object') throw codedError('SHARE_VERSION'); if (JSON.stringify(payload).length > 18_000) throw codedError('SHARE_LARGE'); }
