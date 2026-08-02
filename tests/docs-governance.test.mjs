import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runDocumentationChecks } from '../scripts/check-docs.mjs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('governance Markdown, local links and repository templates pass', () => {
  assert.doesNotThrow(() => runDocumentationChecks());
});

test('package and CI expose an independent documentation quality gate', () => {
  const pkg = JSON.parse(read('package.json'));
  const ci = read('.github/workflows/ci.yml');
  assert.equal(pkg.scripts['docs:check'], 'node scripts/check-docs.mjs');
  assert.equal(pkg.scripts['test:docs'], 'node --test tests/docs-governance.test.mjs');
  assert.match(pkg.scripts.verify, /npm run docs:check/);
  assert.match(ci, /documentation:/);
  assert.match(ci, /npm run docs:check/);
});

test('Issue Forms disable blank reports and route vulnerabilities privately', () => {
  const config = read('.github/ISSUE_TEMPLATE/config.yml');
  const bug = read('.github/ISSUE_TEMPLATE/bug_report.yml');
  const feature = read('.github/ISSUE_TEMPLATE/feature_request.yml');
  assert.match(config, /blank_issues_enabled:\s*false/);
  assert.match(config, /security\/advisories\/new/);
  for (const form of [bug, feature]) {
    assert.match(form, /required: true/);
    assert.match(form, /access tokens/i);
    assert.match(form, /OAuth cookies/i);
    assert.doesNotMatch(form, /paste (?:your )?(?:token|cookie|secret)|cookie value|token value/i);
  }
});

test('contribution and security policies match the real release workflow', () => {
  const contributing = read('CONTRIBUTING.md');
  const security = read('SECURITY.md');
  const release = read('.github/workflows/release.yml');
  assert.match(contributing, /branch → pull request → CI → main → release workflow → branch cleanup/);
  assert.match(contributing, /package\.json/);
  assert.match(contributing, /js\/version\.mjs/);
  assert.match(contributing, /sw\.js/);
  assert.match(release, /npm run verify/);
  assert.match(release, /git tag -a/);
  assert.match(release, /gh release create/);
  assert.match(security, /private vulnerability reporting/);
});

test('pull request template covers quality, privacy and compatibility', () => {
  const template = read('.github/pull_request_template.md');
  for (const expectation of [
    /npm run verify/,
    /localization/i,
    /privacy/i,
    /accessibility/i,
    /compatible/i,
    /Screenshots/,
    /APP_SHELL/,
  ]) {
    assert.match(template, expectation);
  }
});
