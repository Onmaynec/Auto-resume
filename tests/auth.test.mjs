import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../api/_auth.js');
const startHandler = require('../api/auth/start.js');
const callbackHandler = require('../api/auth/callback.js');
const sessionHandler = require('../api/auth/session.js');
const githubHandler = require('../api/github.js');

const SECRET = 'test-session-secret-that-is-definitely-long-enough-123456';

function responseMock() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: '',
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    status(code) { this.statusCode = code; return this; },
    end(body = '') { this.body = body == null ? '' : String(body); return this; },
    headers,
  };
}

function cookieValue(setCookie, name) {
  const items = Array.isArray(setCookie) ? setCookie : [setCookie];
  const item = items.find((value) => String(value).startsWith(`${name}=`));
  assert.ok(item, `missing ${name} cookie`);
  return decodeURIComponent(String(item).split(';')[0].slice(name.length + 1));
}

function request({ method = 'GET', query = {}, cookie = '', origin = '' } = {}) {
  return {
    method,
    query,
    headers: {
      host: 'resume.example.test',
      'x-forwarded-host': 'resume.example.test',
      'x-forwarded-proto': 'https',
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin, 'sec-fetch-site': 'same-origin' } : {}),
    },
    socket: {},
  };
}

test('encrypted session cookies round-trip and reject tampering', () => {
  const sealed = auth.seal({ kind: 'session', exp: Date.now() + 60_000, token: 'secret-token' }, SECRET);
  const opened = auth.unseal(sealed, SECRET, 'session');
  assert.equal(opened.token, 'secret-token');
  const parts = sealed.split('.');
  const encrypted = Buffer.from(parts[2], 'base64url');
  encrypted[Math.floor(encrypted.length / 2)] ^= 0x01;
  const tampered = `${parts[0]}.${parts[1]}.${encrypted.toString('base64url')}`;
  assert.equal(auth.unseal(tampered, SECRET, 'session'), null);
});

test('return targets and same-origin mutation checks are strict', () => {
  assert.equal(auth.safeReturnTo('/dashboard?x=1'), '/dashboard?x=1');
  assert.equal(auth.safeReturnTo('//evil.example'), '/?auth=success');
  assert.equal(auth.safeReturnTo('https://evil.example'), '/?auth=success');
  assert.equal(auth.sameOriginRequest(request({ method: 'DELETE', origin: 'https://resume.example.test' })), true);
  assert.equal(auth.sameOriginRequest(request({ method: 'DELETE', origin: 'https://evil.example' })), false);
});

test('OAuth start uses state and PKCE S256 in an HttpOnly cookie', async () => {
  process.env.GITHUB_OAUTH_CLIENT_ID = 'Iv1.test';
  process.env.GITHUB_OAUTH_CLIENT_SECRET = 'client-secret';
  process.env.SESSION_SECRET = SECRET;
  const res = responseMock();
  await startHandler(request({ query: { returnTo: '/?from=test' } }), res);
  assert.equal(res.statusCode, 302);
  const location = new URL(res.getHeader('location'));
  assert.equal(location.origin, 'https://github.com');
  assert.equal(location.searchParams.get('scope'), 'read:user');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(location.searchParams.get('state'));
  assert.ok(location.searchParams.get('code_challenge'));
  const setCookie = res.getHeader('set-cookie');
  assert.match(String(setCookie), /HttpOnly/);
  assert.match(String(setCookie), /SameSite=Lax/);
  assert.match(String(setCookie), /Secure/);
  const flowCookie = cookieValue(setCookie, auth.FLOW_COOKIE);
  const flow = auth.readFlow(request({ cookie: `${auth.FLOW_COOKIE}=${encodeURIComponent(flowCookie)}` }), SECRET);
  assert.equal(flow.state, location.searchParams.get('state'));
  assert.ok(flow.verifier.length >= 43);
});

test('OAuth callback never exposes the token and session endpoint returns a sanitized view', async () => {
  process.env.GITHUB_OAUTH_CLIENT_ID = 'Iv1.test';
  process.env.GITHUB_OAUTH_CLIENT_SECRET = 'client-secret';
  process.env.SESSION_SECRET = SECRET;
  const startRes = responseMock();
  await startHandler(request(), startRes);
  const authorize = new URL(startRes.getHeader('location'));
  const flowCookie = cookieValue(startRes.getHeader('set-cookie'), auth.FLOW_COOKIE);
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/login/oauth/access_token')) return new Response(JSON.stringify({ access_token: 'gho_private_token', token_type: 'bearer', scope: 'read:user' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (String(url) === 'https://api.github.com/user') return new Response(JSON.stringify({ id: 42, login: 'octocat', name: 'Octo Cat', avatar_url: 'https://example.test/avatar.png', html_url: 'https://github.com/octocat' }), { status: 200, headers: { 'content-type': 'application/json' } });
    throw new Error(`unexpected fetch ${url}`);
  };
  try {
    const callbackRes = responseMock();
    await callbackHandler(request({
      query: { code: 'temporary-code', state: authorize.searchParams.get('state') },
      cookie: `${auth.FLOW_COOKIE}=${encodeURIComponent(flowCookie)}`,
    }), callbackRes);
    assert.equal(callbackRes.statusCode, 302);
    assert.doesNotMatch(String(callbackRes.getHeader('location')), /gho_private_token/);
    const sessionCookie = cookieValue(callbackRes.getHeader('set-cookie'), auth.SESSION_COOKIE);
    const sessionReq = request({ cookie: `${auth.SESSION_COOKIE}=${encodeURIComponent(sessionCookie)}` });
    const sessionRes = responseMock();
    await sessionHandler(sessionReq, sessionRes);
    const payload = JSON.parse(sessionRes.body);
    assert.equal(payload.authenticated, true);
    assert.equal(payload.user.login, 'octocat');
    assert.equal(payload.capabilities.privateContributions, true);
    assert.equal(payload.capabilities.privateRepositoryCode, false);
    assert.equal('token' in payload, false);
    assert.doesNotMatch(sessionRes.body, /gho_private_token/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('session deletion blocks cross-site requests and can revoke the GitHub grant', async () => {
  process.env.GITHUB_OAUTH_CLIENT_ID = 'Iv1.test';
  process.env.GITHUB_OAUTH_CLIENT_SECRET = 'client-secret';
  process.env.SESSION_SECRET = SECRET;
  const sessionCookie = auth.seal({ kind: 'session', exp: Date.now() + 60_000, token: 'gho_token', scopes: ['read:user'], user: { id: 1, login: 'octocat' } }, SECRET);
  const blockedRes = responseMock();
  await sessionHandler(request({ method: 'DELETE', query: { revoke: 'grant' }, cookie: `${auth.SESSION_COOKIE}=${sessionCookie}`, origin: 'https://evil.example' }), blockedRes);
  assert.equal(blockedRes.statusCode, 403);

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/applications\/Iv1.test\/grant$/);
    assert.equal(options.method, 'DELETE');
    assert.doesNotMatch(String(options.headers.Authorization), /gho_token/);
    return new Response(null, { status: 204 });
  };
  try {
    const res = responseMock();
    await sessionHandler(request({ method: 'DELETE', query: { revoke: 'grant' }, cookie: `${auth.SESSION_COOKIE}=${sessionCookie}`, origin: 'https://resume.example.test' }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { ok: true, revoked: true, mode: 'grant' });
    assert.match(String(res.getHeader('set-cookie')), /Max-Age=0/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('profile API partitions authenticated self analytics from public cache', () => {
  const session = { token: 'oauth-token', scopes: ['read:user'], user: { id: 42, login: 'OctoCat' } };
  const self = githubHandler._private.resolveAuthContext('octocat', session, 'server-token');
  assert.equal(self.source, 'github-graphql-oauth-self');
  assert.equal(self.privateContributionsIncluded, true);
  const other = githubHandler._private.resolveAuthContext('torvalds', session, 'server-token');
  assert.equal(other.source, 'github-graphql-oauth-public');
  assert.equal(other.privateContributionsIncluded, false);
  const guest = githubHandler._private.resolveAuthContext('octocat', null, 'server-token');
  assert.equal(guest.source, 'github-graphql');
  assert.equal(guest.token, 'server-token');
});
