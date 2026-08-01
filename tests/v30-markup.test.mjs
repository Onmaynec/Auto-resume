import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3 OAuth client is connected without exposing a browser token', () => {
  const app = read('app.js');
  const auth = read('js/auth.mjs');
  const data = read('js/data.js');
  assert.match(app, /initAuth/);
  assert.match(app, /refreshAuthUi/);
  assert.match(auth, /\/api\/auth\/session/);
  assert.doesNotMatch(auth, /localStorage.*token|access_token/);
  assert.match(data, /credentials:\s*'same-origin'/);
  assert.match(data, /auto-resume:auth-login/);
});

test('OAuth API, environment template and threat model are present', () => {
  const env = read('.env.example');
  const threat = read('docs/THREAT_MODEL.md');
  const serviceWorker = read('sw.js');
  assert.match(env, /GITHUB_OAUTH_CLIENT_ID=/);
  assert.match(env, /GITHUB_OAUTH_CLIENT_SECRET=/);
  assert.match(env, /SESSION_SECRET=/);
  assert.match(threat, /PKCE S256/);
  assert.match(threat, /AES-256-GCM/);
  assert.match(serviceWorker, /js\/auth\.mjs/);
  assert.match(serviceWorker, /pathname\.startsWith\('\/api\/'\)/);
});

test('RU and EN dictionaries contain OAuth consent and session strings', async () => {
  const i18n = await import('../js/i18n.mjs');
  const ru = i18n.dictionaryKeys('ru');
  const en = i18n.dictionaryKeys('en');
  assert.deepEqual(ru, en);
  for (const key of ['auth.signIn', 'auth.consentTitle', 'auth.permissionNoCode', 'status.authSuccess', 'status.oauthSelfLoaded']) {
    assert.ok(ru.includes(key), `missing ${key}`);
    assert.notEqual(i18n.t(key, {}, 'ru'), key);
    assert.notEqual(i18n.t(key, {}, 'en'), key);
  }
});
