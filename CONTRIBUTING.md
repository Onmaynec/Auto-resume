# Contributing to Auto Resume

Changes must preserve privacy boundaries, RU/EN Localization, offline PWA behavior and compatibility of drafts/public links. In 3.6, Application Kit and Resume Quality Audit are separate ephemeral features: neither belongs in workspace/public share/API, and the audit must never rewrite resume text automatically.

Read [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and use [`SECURITY.md`](SECURITY.md) for private vulnerability reports.

## Environment

CI uses Node.js 24.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

Use synthetic fixtures only.

## Commands

- `npm run check` — syntax checks;
- `npm run docs:check` — documentation contracts;
- `npm test` — unit/integration;
- `npm run test:e2e` — Chromium/axe;
- `npm run test:lighthouse` — Lighthouse;
- `npm run verify` — syntax + docs + tests + `git diff --check`.

## Workflow

Use focused `feat/*`, `fix/*`, `docs/*`, `test/*` or `agent/*` branches and Conventional Commit subjects.

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

Resolve privacy, accessibility, Localization and compatibility findings before merge. Release changes synchronize `package.json`, `js/version.mjs`, `sw.js` and `CHANGELOG.md`.

## API and auth

Endpoints need method allowlists, appropriate headers, `HttpOnly`/`Secure`/`SameSite` cookies, same-origin and CSRF controls, PKCE/`state`, rate limits/timeouts and redacted logs.

## Application Kit

Raw vacancy text must not enter kit schema/storage/API. Missing skills remain gaps. UI stays free of `fetch`, `localStorage` and `sessionStorage`.

## Resume Quality Audit

Audit rules must be deterministic and explainable, use stable issue codes, receive only normalized requirement names, and never fabricate achievements or automatically change the draft. Audit reports remain outside workspace, backup, public share, Redis/KV and API.

## PWA and APP_SHELL

Required same-origin runtime files belong in `APP_SHELL`; bump `APP_VERSION` on releases. `/api/*` must not be cached. Kit and audit modules must remain available offline.

## Documentation and security

Run `npm run docs:check`; keep one H1, valid relative links and sequential heading levels.

Never publish access token, OAuth cookie, client secret, Redis credential, private repository data or confidential resume. Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
