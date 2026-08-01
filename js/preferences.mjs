import { normalizeLocale } from './i18n.mjs';
const THEME_VALUES = new Set(['system', 'dark', 'light']);
export function normalizeTheme(value) { return THEME_VALUES.has(value) ? value : 'system'; }
export function resolveTheme(value, prefersDark = false) { const theme = normalizeTheme(value); return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme; }
export function normalizeRecentProfiles(value, limit = 8) {
  if (!Array.isArray(value)) return [];
  const seen = new Set(); const result = [];
  for (const item of value) {
    const login = String(item?.login || '').trim(); const key = login.toLowerCase();
    if (!login || seen.has(key)) continue; seen.add(key);
    result.push({ login, name: String(item?.name || login), avatarUrl: String(item?.avatarUrl || ''), lastUsed: Number(item?.lastUsed || item?.openedAt || 0) });
    if (result.length >= limit) break;
  }
  return result.sort((a, b) => b.lastUsed - a.lastUsed);
}
export function addRecentProfile(items, profile, limit = 8, now = Date.now()) {
  const login = String(profile?.login || '').trim(); if (!login) return normalizeRecentProfiles(items, limit);
  return normalizeRecentProfiles([{ login, name: profile?.name || login, avatarUrl: profile?.avatar_url || profile?.avatarUrl || '', lastUsed: now }, ...(Array.isArray(items) ? items : [])], limit);
}
export function removeRecentProfile(items, login) { const key = String(login || '').toLowerCase(); return normalizeRecentProfiles(items).filter((item) => item.login.toLowerCase() !== key); }
export function readPreferences(storage) {
  try {
    const raw = storage?.getItem?.('auto-resume:preferences:v21');
    if (!raw) return { theme: 'system', locale: 'ru', recentProfiles: [] };
    const parsed = JSON.parse(raw);
    return { theme: normalizeTheme(parsed.theme), locale: normalizeLocale(parsed.locale), recentProfiles: normalizeRecentProfiles(parsed.recentProfiles) };
  } catch { return { theme: 'system', locale: 'ru', recentProfiles: [] }; }
}
export function writePreferences(storage, preferences) {
  const normalized = { theme: normalizeTheme(preferences?.theme), locale: normalizeLocale(preferences?.locale), recentProfiles: normalizeRecentProfiles(preferences?.recentProfiles) };
  storage?.setItem?.('auto-resume:preferences:v21', JSON.stringify(normalized)); return normalized;
}
