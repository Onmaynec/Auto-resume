import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createStore } = require('../api/_store.js');
const { denySession, denylistEnabled, sessionDenylistKey } = require('../api/_session-state.js');

test('session denylist is explicitly opt-in', () => {
  assert.equal(denylistEnabled({}), false);
  assert.equal(denylistEnabled({ SESSION_DENYLIST_ENABLED: 'true' }), true);
  assert.equal(denylistEnabled({ SESSION_DENYLIST_ENABLED: 'TRUE' }), true);
});

test('denylist key is hashed and Redis payload contains no OAuth token', async () => {
  const env = {
    SESSION_DENYLIST_ENABLED: 'true',
    SESSION_SECRET: '01234567890123456789012345678901',
    AUTO_RESUME_STORE_NAMESPACE: 'session-test',
  };
  const session = {
    sid: 'raw-session-identifier',
    token: 'gho_super_secret_token',
    exp: Date.now() + 60_000,
    user: { id: 42, login: 'octocat' },
  };
  const key = sessionDenylistKey(session, env);
  assert.match(key, /^session:deny:[a-f0-9]{32}$/);
  assert.doesNotMatch(key, /raw-session-identifier|42/);

  const map = new Map();
  const store = createStore({ env, memoryMap: map });
  const result = await denySession(session, { store, env, now: Date.now() });
  assert.equal(result.value, true);
  const serialized = JSON.stringify([...map.entries()]);
  assert.doesNotMatch(serialized, /gho_super_secret_token|raw-session-identifier/);
  assert.match(serialized, /revokedAt/);
});

test('sessions without a v3.2 sid remain compatible', async () => {
  const env = { SESSION_DENYLIST_ENABLED: 'true', SESSION_SECRET: '01234567890123456789012345678901' };
  const store = createStore({ env, memoryMap: new Map() });
  const result = await denySession({ token: 'legacy', exp: Date.now() + 10_000 }, { store, env });
  assert.equal(result.value, false);
  assert.equal(result.backend, 'disabled');
});
