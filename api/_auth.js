const crypto = require('node:crypto');

const FLOW_COOKIE = 'ar_oauth_flow';
const SESSION_COOKIE = 'ar_session';
const FLOW_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE_VERSION = 1;

function getOAuthConfig() {
  const clientId = String(process.env.GITHUB_OAUTH_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.GITHUB_OAUTH_CLIENT_SECRET || '').trim();
  const sessionSecret = String(process.env.SESSION_SECRET || '').trim();
  return {
    clientId,
    clientSecret,
    sessionSecret,
    configured: Boolean(clientId && clientSecret && sessionSecret.length >= 32),
  };
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function randomBase64Url(size = 32) {
  return crypto.randomBytes(size).toString('base64url');
}

function sha256Base64Url(value) {
  return crypto.createHash('sha256').update(String(value)).digest('base64url');
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(`auto-resume:v3:${secret}`).digest();
}

function seal(payload, secret) {
  if (!secret || String(secret).length < 32) throw new Error('SESSION_SECRET_TOO_SHORT');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify({ v: COOKIE_VERSION, ...payload }), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [base64url(iv), base64url(tag), base64url(encrypted)].join('.');
}

function unseal(value, secret, expectedKind) {
  try {
    if (!value || !secret) return null;
    const parts = String(value).split('.');
    if (parts.length !== 3) return null;
    const [ivPart, tagPart, encryptedPart] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ]);
    const payload = JSON.parse(decrypted.toString('utf8'));
    if (payload.v !== COOKIE_VERSION) return null;
    if (expectedKind && payload.kind !== expectedKind) return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const raw = String(req?.headers?.cookie || '');
  return Object.fromEntries(raw.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    const name = index >= 0 ? part.slice(0, index) : part;
    const value = index >= 0 ? part.slice(index + 1) : '';
    try { return [name, decodeURIComponent(value)]; } catch { return [name, value]; }
  }));
}

function isSecureRequest(req) {
  const forwarded = String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  return forwarded === 'https' || req?.socket?.encrypted === true || process.env.NODE_ENV === 'production';
}

function serializeCookie(name, value, options = {}) {
  const attributes = [`${name}=${encodeURIComponent(value)}`];
  attributes.push(`Path=${options.path || '/'}`);
  if (options.maxAge != null) attributes.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.expires) attributes.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly !== false) attributes.push('HttpOnly');
  attributes.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (options.secure) attributes.push('Secure');
  return attributes.join('; ');
}

function appendSetCookie(res, value) {
  const current = res.getHeader?.('Set-Cookie');
  if (!current) res.setHeader('Set-Cookie', value);
  else res.setHeader('Set-Cookie', Array.isArray(current) ? [...current, value] : [current, value]);
}

function setEncryptedCookie(req, res, name, payload, ttlMs, secret) {
  const now = Date.now();
  const value = seal({ ...payload, iat: now, exp: now + ttlMs }, secret);
  appendSetCookie(res, serializeCookie(name, value, {
    maxAge: ttlMs / 1000,
    secure: isSecureRequest(req),
  }));
  return value;
}

function clearCookie(req, res, name) {
  appendSetCookie(res, serializeCookie(name, '', {
    maxAge: 0,
    expires: new Date(0),
    secure: isSecureRequest(req),
  }));
}

function writeFlowCookie(req, res, flow, secret) {
  return setEncryptedCookie(req, res, FLOW_COOKIE, { kind: 'flow', ...flow }, FLOW_TTL_MS, secret);
}

function readFlow(req, secret) {
  return unseal(parseCookies(req)[FLOW_COOKIE], secret, 'flow');
}

function clearFlowCookie(req, res) {
  clearCookie(req, res, FLOW_COOKIE);
}

function writeSessionCookie(req, res, session, secret) {
  return setEncryptedCookie(req, res, SESSION_COOKIE, { kind: 'session', ...session }, SESSION_TTL_MS, secret);
}

function readSession(req, secret = getOAuthConfig().sessionSecret) {
  return unseal(parseCookies(req)[SESSION_COOKIE], secret, 'session');
}

function clearSessionCookie(req, res) {
  clearCookie(req, res, SESSION_COOKIE);
}

function requestOrigin(req) {
  const proto = String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim()
    || (req?.socket?.encrypted ? 'https' : 'http');
  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}

function callbackUrl(req) {
  return String(process.env.GITHUB_CALLBACK_URL || '').trim() || `${requestOrigin(req)}/api/auth/callback`;
}

function safeReturnTo(value, fallback = '/?auth=success') {
  const candidate = String(value || '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return fallback;
  try {
    const url = new URL(candidate, 'https://auto-resume.invalid');
    if (url.origin !== 'https://auto-resume.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

function withAuthResult(path, status, reason = '') {
  const safe = safeReturnTo(path);
  const url = new URL(safe, 'https://auto-resume.invalid');
  url.searchParams.set('auth', status);
  if (reason) url.searchParams.set('reason', String(reason).slice(0, 80));
  return `${url.pathname}${url.search}${url.hash}`;
}

function sameOriginRequest(req) {
  const expected = requestOrigin(req);
  if (!expected) return false;
  const origin = String(req?.headers?.origin || '').trim();
  if (origin && origin !== expected) return false;
  const referer = String(req?.headers?.referer || '').trim();
  if (referer) {
    try { if (new URL(referer).origin !== expected) return false; } catch { return false; }
  }
  const fetchSite = String(req?.headers?.['sec-fetch-site'] || '').trim();
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) return false;
  return Boolean(origin || referer || fetchSite || process.env.NODE_ENV === 'test');
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function setNoStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

function sendJson(res, status, body) {
  setNoStore(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).end(JSON.stringify(body));
}

function redirect(res, location, status = 302) {
  setNoStore(res);
  res.setHeader('Location', location);
  return res.status(status).end();
}

function publicSession(session, configured = true) {
  if (!session) return { configured, authenticated: false };
  const scopes = Array.isArray(session.scopes) ? session.scopes : [];
  return {
    configured,
    authenticated: true,
    user: session.user,
    scopes,
    expiresAt: new Date(session.exp).toISOString(),
    capabilities: {
      privateContributions: scopes.includes('read:user'),
      privateRepositoryCode: false,
      tokenVisibleToBrowser: false,
    },
  };
}

module.exports = {
  FLOW_COOKIE,
  SESSION_COOKIE,
  FLOW_TTL_MS,
  SESSION_TTL_MS,
  getOAuthConfig,
  randomBase64Url,
  sha256Base64Url,
  seal,
  unseal,
  parseCookies,
  writeFlowCookie,
  readFlow,
  clearFlowCookie,
  writeSessionCookie,
  readSession,
  clearSessionCookie,
  requestOrigin,
  callbackUrl,
  safeReturnTo,
  withAuthResult,
  sameOriginRequest,
  constantTimeEqual,
  setNoStore,
  sendJson,
  redirect,
  publicSession,
  _private: { serializeCookie, isSecureRequest, deriveKey },
};
