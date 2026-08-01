const crypto = require('node:crypto');
const { hashIdentifier } = require('./_store');

const CACHE_FRESH_MS = 15 * 60 * 1000;
const CACHE_STALE_MS = 60 * 60 * 1000;
const LOCK_TTL_MS = 20 * 1000;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 20;

const inFlight = globalThis.__autoResumeV32InFlight || new Map();
globalThis.__autoResumeV32InFlight = inFlight;

function secretForHashing(env = process.env) {
  return env.RATE_LIMIT_SECRET || env.SESSION_SECRET || env.GITHUB_TOKEN || env.GH_TOKEN || '';
}

function getRawClientId(req, session) {
  if (session?.sid) return `sid:${session.sid}`;
  if (session?.user?.id) return `oauth:${session.user.id}`;
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (Array.isArray(forwarded)) return `ip:${forwarded[0] || 'unknown'}`;
  if (typeof forwarded === 'string') return `ip:${forwarded.split(',')[0].trim() || 'unknown'}`;
  return `ip:${req?.socket?.remoteAddress || 'unknown'}`;
}

function getClientFingerprint(req, session, env = process.env) {
  return hashIdentifier(getRawClientId(req, session), secretForHashing(env));
}

function makeCacheKey({ username, privateContributionsIncluded, session, env = process.env }) {
  const login = String(username || '').toLowerCase();
  if (!privateContributionsIncluded) return `profile:public:${login}`;
  const owner = hashIdentifier(session?.user?.id || session?.sid || 'unknown', secretForHashing(env));
  return `profile:self:${owner}:${login}`;
}

async function consumeRateLimit({ store, req, session, env = process.env, now = Date.now() }) {
  const windowMs = Math.max(1_000, Number(env.API_RATE_WINDOW_MS) || REQUEST_WINDOW_MS);
  const limit = Math.max(1, Number(env.API_RATE_LIMIT) || REQUEST_LIMIT);
  const bucket = Math.floor(now / windowMs);
  const resetAt = (bucket + 1) * windowMs;
  const fingerprint = getClientFingerprint(req, session, env);
  const result = await store.increment(`rate:${fingerprint}:${bucket}`, resetAt - now + 5_000);
  const count = Number(result.value) || 1;
  return {
    allowed: count <= limit,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    store: result,
  };
}

function cacheRecord(data, now = Date.now()) {
  return {
    data,
    freshUntil: now + CACHE_FRESH_MS,
    staleUntil: now + CACHE_STALE_MS,
  };
}

function classifyRecord(record, now = Date.now()) {
  if (!record?.data || !Number.isFinite(record.freshUntil) || !Number.isFinite(record.staleUntil)) return 'MISS';
  if (record.freshUntil > now) return 'HIT';
  if (record.staleUntil > now) return 'STALE';
  return 'MISS';
}

async function waitForPeerCache(store, cacheKey, now, attempts = 5) {
  for (let index = 0; index < attempts; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 120 + index * 40));
    const cached = await store.getJson(cacheKey);
    const state = classifyRecord(cached.value, now());
    if (state !== 'MISS') return { data: cached.value.data, cache: 'WAIT', store: cached };
  }
  return null;
}

async function refreshProfile({ store, cacheKey, fetcher, now = () => Date.now() }) {
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);
  const promise = (async () => {
    const lockId = crypto.randomBytes(12).toString('hex');
    const lock = await store.setIfAbsent(`lock:${hashIdentifier(cacheKey)}`, { lockId }, LOCK_TTL_MS);
    if (!lock.value) {
      const peer = await waitForPeerCache(store, cacheKey, now);
      if (peer) return peer;
    }
    const upstreamStartedAt = Date.now();
    const data = await fetcher();
    const written = await store.setJson(cacheKey, cacheRecord(data, now()), CACHE_STALE_MS);
    return {
      data,
      cache: 'MISS',
      store: written,
      upstreamDurationMs: Date.now() - upstreamStartedAt,
    };
  })().finally(() => inFlight.delete(cacheKey));
  inFlight.set(cacheKey, promise);
  return promise;
}

async function loadProfile({ store, cacheKey, fetcher, waitUntil, now = () => Date.now() }) {
  const cached = await store.getJson(cacheKey);
  const state = classifyRecord(cached.value, now());
  if (state === 'HIT') return { data: cached.value.data, cache: 'HIT', store: cached, upstreamDurationMs: 0 };
  if (state === 'STALE') {
    const refresh = refreshProfile({ store, cacheKey, fetcher, now }).catch((error) => {
      console.warn(JSON.stringify({ event: 'stale_refresh_error', code: error?.code || error?.name || 'unknown' }));
    });
    if (typeof waitUntil === 'function') waitUntil(refresh);
    return { data: cached.value.data, cache: 'STALE', store: cached, upstreamDurationMs: 0 };
  }
  return refreshProfile({ store, cacheKey, fetcher, now });
}

function applyInfrastructureHeaders(res, result, rateState) {
  const meta = result?.store || rateState?.store || {};
  res.setHeader('X-Auto-Resume-Store', meta.backend || 'memory');
  res.setHeader('X-Auto-Resume-Store-Degraded', meta.degraded ? '1' : '0');
  if (result?.cache) res.setHeader('X-Auto-Resume-Cache', result.cache);
  if (rateState) {
    res.setHeader('X-Auto-Resume-Limit', String(rateState.limit));
    res.setHeader('X-Auto-Resume-Remaining', String(rateState.remaining));
  }
  const timings = [];
  if (Number.isFinite(meta.durationMs)) timings.push(`store;dur=${meta.durationMs}`);
  if (Number.isFinite(result?.upstreamDurationMs) && result.upstreamDurationMs > 0) timings.push(`github;dur=${result.upstreamDurationMs}`);
  if (timings.length) res.setHeader('Server-Timing', timings.join(', '));
}

function logInfrastructureMetric({ cache, store, upstreamDurationMs = 0, status = 200 }) {
  console.info(JSON.stringify({
    event: 'profile_gateway',
    cache: cache || 'NONE',
    backend: store?.backend || 'memory',
    degraded: Boolean(store?.degraded),
    storeDurationMs: Number(store?.durationMs) || 0,
    upstreamDurationMs: Number(upstreamDurationMs) || 0,
    status,
  }));
}

module.exports = {
  CACHE_FRESH_MS,
  CACHE_STALE_MS,
  REQUEST_LIMIT,
  REQUEST_WINDOW_MS,
  applyInfrastructureHeaders,
  cacheRecord,
  classifyRecord,
  consumeRateLimit,
  getClientFingerprint,
  loadProfile,
  logInfrastructureMetric,
  makeCacheKey,
  refreshProfile,
};
