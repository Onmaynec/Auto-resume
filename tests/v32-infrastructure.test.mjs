import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('v3.2 distributed storage modules remain connected to profile and session APIs', () => {
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

test('version metadata and release notes stay consistent with package version', () => {
  const pkg = JSON.parse(read('package.json'));
  const escaped = pkg.version.replace(/\./g, '\\.');
  assert.match(pkg.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.match(read('js/version.mjs'), new RegExp(`APP_VERSION = '${escaped}'`));
  assert.match(read('sw.js'), new RegExp(`APP_VERSION = '${escaped}'`));
  assert.match(read('CHANGELOG.md'), new RegExp(`## v${escaped} `));
});
