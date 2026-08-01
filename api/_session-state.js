const { readSession } = require('./_auth');
const { getGlobalStore, hashIdentifier } = require('./_store');

function denylistEnabled(env = process.env) {
  return String(env.SESSION_DENYLIST_ENABLED || '').toLowerCase() === 'true';
}

function sessionDenylistKey(session, env = process.env) {
  if (!session?.sid) return null;
  const secret = env.SESSION_SECRET || env.RATE_LIMIT_SECRET || '';
  return `session:deny:${hashIdentifier(session.sid, secret)}`;
}

async function readActiveSession(req, secret, { store = getGlobalStore(), env = process.env } = {}) {
  const session = readSession(req, secret);
  if (!session || !denylistEnabled(env) || !session.sid) return { session, denied: false, store: null };
  const key = sessionDenylistKey(session, env);
  const denied = await store.getJson(key);
  return {
    session: denied.value ? null : session,
    denied: Boolean(denied.value),
    store: denied,
  };
}

async function denySession(session, { store = getGlobalStore(), env = process.env, now = Date.now() } = {}) {
  if (!session || !denylistEnabled(env) || !session.sid) return { value: false, backend: 'disabled', degraded: false, durationMs: 0 };
  const ttlMs = Math.max(1_000, Number(session.exp || 0) - now);
  return store.setJson(sessionDenylistKey(session, env), { revokedAt: new Date(now).toISOString() }, ttlMs);
}

module.exports = {
  denySession,
  denylistEnabled,
  readActiveSession,
  sessionDenylistKey,
};
