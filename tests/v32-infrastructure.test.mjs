import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.2 storage modules are connected to profile and session APIs', () => {
  const github = read('api/github.js');
  const callback = read('api/auth/callback.js');
  const session = read('api/auth/session.js');
  assert.match(github, /_profile-gateway/);
  assert.match(github, /readActiveSession/);
  assert.match(github, /consumeRateLimit/);
  assert.match(github, /loadProfile/);
  assert.match(callback, /sid:\s*randomBase64Url/);
  assert.match(session, /denySession/);
  assert.match(session, /readActiveSession/);
});

test('environment and threat model document Redis without token persistence', () => {
  const env = read('.env.example');
  const threat = read('docs/THREAT_MODEL.md');
  const readme = read('README.md');
  for (const key of ['UPSTASH_REDIS_REST_URL=', 'UPSTASH_REDIS_REST_TOKEN=', 'RATE_LIMIT_SECRET=', 'SESSION_DENYLIST_ENABLED=']) {
    assert.match(env, new RegExp(key));
  }
  assert.match(threat, /OAuth token.*Redis|Redis.*OAuth token/i);
  assert.match(readme, /Redis|Upstash/);
});

test('version metadata and release notes are ready for automatic v3.2 publishing', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '3.2.0');
  assert.match(read('js/version.mjs'), /APP_VERSION = '3\.2\.0'/);
  assert.match(read('sw.js'), /APP_VERSION = '3\.2\.0'/);
  assert.match(read('CHANGELOG.md'), /## v3\.2\.0 /);
});
