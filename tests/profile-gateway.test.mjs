import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createStore } = require('../api/_store.js');
const {
  CACHE_FRESH_MS,
  cacheRecord,
  classifyRecord,
  consumeRateLimit,
  loadProfile,
  makeCacheKey,
} = require('../api/_profile-gateway.js');

function request(ip = '203.0.113.42') {
  return { headers: { 'x-forwarded-for': ip }, socket: {} };
}

test('public and authenticated-self cache partitions never collide', () => {
  const env = { SESSION_SECRET: '01234567890123456789012345678901' };
  const publicKey = makeCacheKey({ username: 'OctoCat', privateContributionsIncluded: false, session: null, env });
  const selfKey = makeCacheKey({ username: 'OctoCat', privateContributionsIncluded: true, session: { sid: 'raw-session-id', user: { id: 42 } }, env });
  assert.equal(publicKey, 'profile:public:octocat');
  assert.match(selfKey, /^profile:self:[a-f0-9]{32}:octocat$/);
  assert.notEqual(publicKey, selfKey);
  assert.doesNotMatch(selfKey, /raw-session-id|:42:/);
});

test('distributed fixed-window limiter shares counters between instances', async () => {
  const map = new Map();
  const env = { API_RATE_LIMIT: '2', API_RATE_WINDOW_MS: '10000', RATE_LIMIT_SECRET: 'rate-secret' };
  const first = createStore({ env, memoryMap: map });
  const second = createStore({ env, memoryMap: map });
  const a = await consumeRateLimit({ store: first, req: request(), session: null, env, now: 20_000 });
  const b = await consumeRateLimit({ store: second, req: request(), session: null, env, now: 20_001 });
  const c = await consumeRateLimit({ store: first, req: request(), session: null, env, now: 20_002 });
  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
  assert.equal(c.allowed, false);
  assert.equal(c.remaining, 0);
  assert.equal(c.resetAt, 30_000);
});

test('fresh, stale and expired cache records classify deterministically', () => {
  const record = cacheRecord({ ok: true }, 1_000);
  assert.equal(classifyRecord(record, 1_000 + CACHE_FRESH_MS - 1), 'HIT');
  assert.equal(classifyRecord(record, 1_000 + CACHE_FRESH_MS), 'STALE');
  assert.equal(classifyRecord(record, record.staleUntil), 'MISS');
});

test('concurrent cache misses are deduplicated in one process', async () => {
  const store = createStore({ env: { AUTO_RESUME_STORE_NAMESPACE: 'dedupe' }, memoryMap: new Map() });
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { user: 'octocat' };
  };
  const [left, right] = await Promise.all([
    loadProfile({ store, cacheKey: 'profile:public:octocat', fetcher }),
    loadProfile({ store, cacheKey: 'profile:public:octocat', fetcher }),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(left.data, right.data);
  assert.equal(left.cache, 'MISS');
});

test('stale data is returned while refresh is scheduled', async () => {
  let now = 10_000;
  const store = createStore({ env: { AUTO_RESUME_STORE_NAMESPACE: 'stale' }, memoryMap: new Map(), now: () => now });
  const record = cacheRecord({ version: 'old' }, now - CACHE_FRESH_MS - 1);
  await store.setJson('profile:public:octocat', record, 60_000);
  let background;
  const result = await loadProfile({
    store,
    cacheKey: 'profile:public:octocat',
    fetcher: async () => ({ version: 'new' }),
    now: () => now,
    waitUntil: (promise) => { background = promise; },
  });
  assert.equal(result.cache, 'STALE');
  assert.equal(result.data.version, 'old');
  assert.ok(background instanceof Promise);
  await background;
  const refreshed = await store.getJson('profile:public:octocat');
  assert.equal(refreshed.value.data.version, 'new');
});
