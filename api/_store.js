const crypto = require('node:crypto');

const DEFAULT_NAMESPACE = 'auto-resume:v3.2';
const DEFAULT_TIMEOUT_MS = 1_800;

function normalizeNamespace(value) {
  return String(value || DEFAULT_NAMESPACE).trim().replace(/[^a-zA-Z0-9:._-]/g, '-').slice(0, 80) || DEFAULT_NAMESPACE;
}

function hashIdentifier(value, secret = '') {
  const input = String(value || 'unknown');
  return secret
    ? crypto.createHmac('sha256', String(secret)).update(input).digest('hex').slice(0, 32)
    : crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
}

class MemoryStore {
  constructor({ namespace = DEFAULT_NAMESPACE, now = () => Date.now(), map } = {}) {
    this.namespace = normalizeNamespace(namespace);
    this.now = now;
    this.map = map || new Map();
    this.name = 'memory';
  }

  key(key) {
    return `${this.namespace}:${String(key)}`;
  }

  prune(key) {
    const fullKey = this.key(key);
    const entry = this.map.get(fullKey);
    if (entry && entry.expiresAt <= this.now()) this.map.delete(fullKey);
    return this.map.get(fullKey) || null;
  }

  async getJson(key) {
    const entry = this.prune(key);
    if (!entry) return null;
    try { return JSON.parse(entry.value); } catch { return null; }
  }

  async setJson(key, value, ttlMs) {
    const expiresAt = this.now() + Math.max(1, Number(ttlMs) || 1);
    this.map.set(this.key(key), { value: JSON.stringify(value), expiresAt });
    return true;
  }

  async delete(key) {
    return this.map.delete(this.key(key));
  }

  async setIfAbsent(key, value, ttlMs) {
    if (this.prune(key)) return false;
    await this.setJson(key, value, ttlMs);
    return true;
  }

  async increment(key, ttlMs) {
    const entry = this.prune(key);
    const current = entry ? Number(entry.value) || 0 : 0;
    const next = current + 1;
    this.map.set(this.key(key), {
      value: String(next),
      expiresAt: entry?.expiresAt || (this.now() + Math.max(1, Number(ttlMs) || 1)),
    });
    return next;
  }
}

class UpstashRestStore {
  constructor({ url, token, namespace = DEFAULT_NAMESPACE, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.url = String(url || '').replace(/\/+$/, '');
    this.token = String(token || '');
    this.namespace = normalizeNamespace(namespace);
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.name = 'redis';
    if (!this.url || !this.token || typeof this.fetchImpl !== 'function') throw new Error('REDIS_NOT_CONFIGURED');
  }

  key(key) {
    return `${this.namespace}:${String(key)}`;
  }

  async request(path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.url}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error) {
        const error = new Error(payload?.error || `REDIS_HTTP_${response.status}`);
        error.code = 'REDIS_UNAVAILABLE';
        throw error;
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  async command(args) {
    return (await this.request('', args)).result;
  }

  async transaction(commands) {
    const payload = await this.request('/multi-exec', commands);
    if (!Array.isArray(payload)) throw new Error('REDIS_INVALID_TRANSACTION');
    const failed = payload.find((item) => item?.error);
    if (failed) throw new Error(failed.error);
    return payload.map((item) => item?.result);
  }

  async getJson(key) {
    const raw = await this.command(['GET', this.key(key)]);
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  async setJson(key, value, ttlMs) {
    const result = await this.command(['SET', this.key(key), JSON.stringify(value), 'PX', Math.max(1, Math.floor(ttlMs))]);
    return result === 'OK';
  }

  async delete(key) {
    return Number(await this.command(['DEL', this.key(key)])) > 0;
  }

  async setIfAbsent(key, value, ttlMs) {
    const result = await this.command(['SET', this.key(key), JSON.stringify(value), 'PX', Math.max(1, Math.floor(ttlMs)), 'NX']);
    return result === 'OK';
  }

  async increment(key, ttlMs) {
    const [count] = await this.transaction([
      ['INCR', this.key(key)],
      ['PEXPIRE', this.key(key), Math.max(1, Math.floor(ttlMs))],
    ]);
    return Number(count);
  }
}

class ResilientStore {
  constructor({ primary = null, fallback = new MemoryStore(), onError = () => {} } = {}) {
    this.primary = primary;
    this.fallback = fallback;
    this.onError = onError;
  }

  async run(method, args) {
    const startedAt = Date.now();
    if (this.primary) {
      try {
        const value = await this.primary[method](...args);
        return { value, backend: this.primary.name, degraded: false, durationMs: Date.now() - startedAt };
      } catch (error) {
        this.onError(error, method);
      }
    }
    const value = await this.fallback[method](...args);
    return { value, backend: this.fallback.name, degraded: Boolean(this.primary), durationMs: Date.now() - startedAt };
  }

  getJson(key) { return this.run('getJson', [key]); }
  setJson(key, value, ttlMs) { return this.run('setJson', [key, value, ttlMs]); }
  delete(key) { return this.run('delete', [key]); }
  setIfAbsent(key, value, ttlMs) { return this.run('setIfAbsent', [key, value, ttlMs]); }
  increment(key, ttlMs) { return this.run('increment', [key, ttlMs]); }
}

function createStore({ env = process.env, fetchImpl = globalThis.fetch, memoryMap, now, onError } = {}) {
  const namespace = normalizeNamespace(env.AUTO_RESUME_STORE_NAMESPACE || DEFAULT_NAMESPACE);
  const fallback = new MemoryStore({ namespace, map: memoryMap, now });
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '';
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '';
  let primary = null;
  if (url && token) {
    try { primary = new UpstashRestStore({ url, token, namespace, fetchImpl }); } catch { primary = null; }
  }
  return new ResilientStore({ primary, fallback, onError });
}

function getGlobalStore() {
  if (!globalThis.__autoResumeV32Store) {
    const memoryMap = globalThis.__autoResumeV32Memory || new Map();
    globalThis.__autoResumeV32Memory = memoryMap;
    globalThis.__autoResumeV32Store = createStore({
      memoryMap,
      onError(error, method) {
        console.warn(JSON.stringify({ event: 'store_fallback', method, code: error?.code || error?.name || 'unknown' }));
      },
    });
  }
  return globalThis.__autoResumeV32Store;
}

module.exports = {
  DEFAULT_NAMESPACE,
  MemoryStore,
  UpstashRestStore,
  ResilientStore,
  createStore,
  getGlobalStore,
  hashIdentifier,
  normalizeNamespace,
};
