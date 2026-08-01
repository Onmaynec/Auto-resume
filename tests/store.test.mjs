import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  MemoryStore,
  ResilientStore,
  UpstashRestStore,
  createStore,
  hashIdentifier,
  normalizeNamespace,
} = require('../api/_store.js');

test('memory store applies namespace, TTL and NX semantics', async () => {
  let now = 1_000;
  const map = new Map();
  const store = new MemoryStore({ namespace: 'test space', map, now: () => now });
  assert.equal(normalizeNamespace('test space'), 'test-space');
  assert.equal(await store.setIfAbsent('key', { ok: true }, 100), true);
  assert.equal(await store.setIfAbsent('key', { ok: false }, 100), false);
  assert.deepEqual(await store.getJson('key'), { ok: true });
  assert.ok([...map.keys()][0].startsWith('test-space:'));
  now = 1_101;
  assert.equal(await store.getJson('key'), null);
});

test('two resilient instances can share a distributed-like fallback map', async () => {
  const map = new Map();
  const left = createStore({ env: { AUTO_RESUME_STORE_NAMESPACE: 'shared' }, memoryMap: map });
  const right = createStore({ env: { AUTO_RESUME_STORE_NAMESPACE: 'shared' }, memoryMap: map });
  assert.equal((await left.increment('rate:one', 10_000)).value, 1);
  assert.equal((await right.increment('rate:one', 10_000)).value, 2);
  await left.setJson('profile:public:octocat', { value: 42 }, 10_000);
  assert.deepEqual((await right.getJson('profile:public:octocat')).value, { value: 42 });
});

test('Upstash REST adapter sends command arrays and atomic rate transaction', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body, authorization: options.headers.Authorization });
    if (url.endsWith('/multi-exec')) return new Response(JSON.stringify([{ result: 3 }, { result: 1 }]), { status: 200 });
    if (body[0] === 'GET') return new Response(JSON.stringify({ result: '{"cached":true}' }), { status: 200 });
    return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
  };
  const store = new UpstashRestStore({ url: 'https://redis.example.test/', token: 'secret', namespace: 'v32', fetchImpl });
  assert.deepEqual(await store.getJson('profile'), { cached: true });
  assert.equal(await store.setJson('profile', { cached: true }, 5_000), true);
  assert.equal(await store.increment('rate', 5_000), 3);
  assert.equal(calls[0].authorization, 'Bearer secret');
  assert.deepEqual(calls[0].body, ['GET', 'v32:profile']);
  assert.deepEqual(calls[2].body[0], ['INCR', 'v32:rate']);
  assert.deepEqual(calls[2].body[1], ['PEXPIRE', 'v32:rate', 5000]);
});

test('resilient store falls back without exposing primary failures', async () => {
  const fallback = new MemoryStore({ namespace: 'fallback' });
  const errors = [];
  const primary = {
    name: 'redis',
    async getJson() { throw Object.assign(new Error('down'), { code: 'REDIS_UNAVAILABLE' }); },
  };
  await fallback.setJson('safe', { ok: true }, 10_000);
  const store = new ResilientStore({ primary, fallback, onError: (error) => errors.push(error.code) });
  const result = await store.getJson('safe');
  assert.deepEqual(result.value, { ok: true });
  assert.equal(result.backend, 'memory');
  assert.equal(result.degraded, true);
  assert.deepEqual(errors, ['REDIS_UNAVAILABLE']);
});

test('identifier hashing never stores raw IP or session identifiers', () => {
  const raw = '203.0.113.15|session-secret-value';
  const digest = hashIdentifier(raw, 'application-secret');
  assert.equal(digest.length, 32);
  assert.doesNotMatch(digest, /203\.0\.113\.15|session-secret-value/);
  assert.equal(digest, hashIdentifier(raw, 'application-secret'));
});
