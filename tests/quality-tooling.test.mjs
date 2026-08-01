import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path) => readFile(resolve(root, path), 'utf8');

test('package exposes deterministic browser quality commands', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  assert.equal(packageJson.scripts['test:e2e'], 'playwright test');
  assert.equal(packageJson.scripts['test:lighthouse'], 'lhci autorun --config=lighthouserc.cjs');
  assert.match(packageJson.scripts.check, /scripts\/test-server\.mjs/);
  assert.equal(packageJson.devDependencies['@playwright/test'], '1.61.1');
  assert.equal(packageJson.devDependencies['@axe-core/playwright'], '4.12.1');
  assert.ok(packageJson.devDependencies['@lhci/cli']);
});

test('CI keeps fast verification separate from browser and Lighthouse jobs', async () => {
  const workflow = await read('.github/workflows/ci.yml');
  assert.match(workflow, /\n  verify:/);
  assert.match(workflow, /\n  browser-e2e:/);
  assert.match(workflow, /\n  lighthouse:/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.match(workflow, /if: failure\(\)/);
  assert.match(workflow, /retention-days: 7/);
  assert.doesNotMatch(workflow, /retry[^\n]*[2-9]/i);
});

test('quality fixtures do not contain credential-shaped secrets', async () => {
  const paths = [
    'tests/e2e/support.mjs',
    'tests/e2e/profile-flow.spec.mjs',
    'tests/e2e/auth.spec.mjs',
    'tests/e2e/accessibility.spec.mjs',
    'docs/QUALITY.md',
  ];
  const content = (await Promise.all(paths.map(read))).join('\n');
  assert.doesNotMatch(content, /gh[pousr]_[A-Za-z0-9]{20,}/);
  assert.doesNotMatch(content, /Bearer\s+[A-Za-z0-9._-]{20,}/i);
  assert.doesNotMatch(content, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
});

test('test server serves a deterministic shell and local API fixtures', async (context) => {
  const port = 4199;
  const child = spawn(process.execPath, ['scripts/test-server.mjs', `--port=${port}`, '--quality-stubs'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  context.after(() => child.kill('SIGTERM'));

  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) { ready = true; break; }
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
  assert.equal(ready, true, 'quality test server did not become ready');

  const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
  assert.match(html, /\/__quality__\/chart\.js/);
  assert.match(html, /\/__quality__\/html2canvas\.js/);
  assert.match(html, /\/__quality__\/jspdf\.js/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com/);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net/);

  const sessionResponse = await fetch(`http://127.0.0.1:${port}/api/auth/session`);
  assert.equal(sessionResponse.status, 200);
  assert.deepEqual(await sessionResponse.json(), {
    configured: false,
    authenticated: false,
    user: null,
    scopes: [],
    capabilities: {},
  });

  const profileResponse = await fetch(`http://127.0.0.1:${port}/api/github?username=octocat`);
  assert.equal(profileResponse.status, 200);
  const profile = await profileResponse.json();
  assert.equal(profile.user.login, 'octocat');
  assert.equal(profile.user.name, 'Octo Cat');
  assert.equal(profile.repos.length, 3);
});
