import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSemver, fetchLatestRelease, parseLatestRelease, parseSemver, shouldOfferUpdate } from '../js/update.mjs';

test('strict semantic versions normalize and compare', () => {
  assert.deepEqual(parseSemver('v3.2.0'), { major: 3, minor: 2, patch: 0, version: '3.2.0' });
  assert.equal(parseSemver('3.2'), null);
  assert.equal(parseSemver('03.2.0'), null);
  assert.equal(compareSemver('3.2.0', '3.1.9'), 1);
  assert.equal(compareSemver('3.2.0', 'v3.2.0'), 0);
  assert.equal(compareSemver('2.9.9', '3.0.0'), -1);
});

test('latest release parser accepts only trusted stable GitHub releases', () => {
  const release = parseLatestRelease({
    tag_name: 'v3.2.0',
    html_url: 'https://github.com/Onmaynec/Auto-resume/releases/tag/v3.2.0',
    draft: false,
    prerelease: false,
    published_at: '2026-08-01T10:00:00Z',
  });
  assert.equal(release.version, '3.2.0');
  assert.equal(release.tag, 'v3.2.0');
  assert.equal(parseLatestRelease({ ...release, tag_name: 'v3.2.0-beta.1' }), null);
  assert.equal(parseLatestRelease({ tag_name: 'v3.2.0', html_url: 'https://evil.example/release' }), null);
  assert.equal(parseLatestRelease({ tag_name: 'v3.2.0', html_url: 'https://github.com/Onmaynec/Auto-resume/releases/tag/v3.2.0', draft: true }), null);
});

test('update offer only appears for a newer stable release', () => {
  assert.equal(shouldOfferUpdate('3.2.0', { version: '3.2.1' }), true);
  assert.equal(shouldOfferUpdate('3.2.0', { version: '3.2.0' }), false);
  assert.equal(shouldOfferUpdate('3.2.0', { version: '3.1.9' }), false);
});

test('release fetch fails closed and parses successful responses', async () => {
  const payload = { tag_name: 'v3.2.0', html_url: 'https://github.com/Onmaynec/Auto-resume/releases/tag/v3.2.0', draft: false, prerelease: false };
  const success = await fetchLatestRelease(async () => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }));
  assert.equal(success.version, '3.2.0');
  assert.equal(await fetchLatestRelease(async () => new Response('{}', { status: 404 })), null);
  assert.equal(await fetchLatestRelease(async () => { throw new Error('offline'); }), null);
});
