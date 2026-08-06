# Contributing to Auto Resume

Changes must preserve privacy boundaries, RU/EN Localization, offline PWA behavior and compatibility of existing drafts/public links. In 3.7, Application Tracker is a separate local database: it stores only a small draft reference and must stay outside workspace backup, public share, API and Redis/KV.

Read [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Security reports follow [`SECURITY.md`](SECURITY.md), not public Issues.

## Environment

CI uses Node.js 24.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

Use synthetic fixtures only. Do not put production credentials, OAuth cookies, private repository data or confidential resume/vacancy/tracker content into tests.

## Commands

- `npm run check` — syntax checks;
- `npm run docs:check` — documentation/governance contracts;
- `npm test` — unit/integration tests;
- `npm run test:e2e` — Chromium/axe;
- `npm run test:lighthouse` — Lighthouse budgets;
- `npm run verify` — syntax + docs + tests + `git diff --check`.

## Workflow

Use focused `feat/*`, `fix/*`, `docs/*`, `test/*` or `agent/*` branches and Conventional Commit subjects.

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

Resolve privacy, accessibility, Localization and compatibility findings before merge. Release changes synchronize `package.json`, `js/version.mjs`, `sw.js` and `CHANGELOG.md`.

## API and auth

Endpoints need method allowlists, security/cache headers, `HttpOnly`/`Secure`/`SameSite` cookies, same-origin and CSRF controls, PKCE/`state`, rate limits/timeouts and redacted logs.

## Application Kit and Audit

Application Kit must not receive raw vacancy text or fabricate missing skills. Resume Quality Audit uses normalized requirement names, stable issue codes and never rewrites the draft automatically. Both remain outside workspace/share/API/Redis.

## Application Tracker

Tracker records are bounded and normalized. Vacancy URLs are HTTPS-only. The draft relation stores only ID/name, not resume content. CSV export must preserve formula-injection protection for values beginning with `=`, `+`, `-` or `@`.

Tracker data must not enter workspace backup, public share, OAuth/API payloads, Redis/KV, Application Kit, Audit reports or analytics. Public read-only mode must hide the panel.

## PWA and APP_SHELL

Required same-origin runtime files belong in `APP_SHELL`; bump `APP_VERSION` for releases. `/api/*` must not be cached. Tracker engine/UI/styles must keep working offline after initial load.

## Documentation and security

Run `npm run docs:check`; keep one H1, valid relative links and sequential heading levels.

Never publish access token, OAuth cookie, client secret, Redis credential, private repository data or confidential resume/tracker data. Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
