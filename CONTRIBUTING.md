# Contributing to Auto Resume

Changes must preserve privacy boundaries, RU/EN Localization, offline PWA behavior and compatibility of existing drafts/public links. In 3.8, Interview Prep is a separate local database: it may reference a Tracker record only by application ID/company/role and must not copy tracker notes, vacancy URL or resume content.

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

Use synthetic fixtures only.

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

## Local feature boundaries

Application Kit must not receive raw vacancy text. Resume Quality Audit never rewrites the draft. Tracker stores only small draft references and remains outside workspace/share/API/cache.

Interview Prep accepts normalized skills/gaps/public project names. Raw vacancy text, resume content, Kit output and Audit report are not Prep inputs. Tracker relation is limited to ID/company/role. Missing skills remain gap questions.

Readiness formula must stay explainable and must not be described as a hiring prediction. STAR completeness requires situation, task, action and result.

## PWA and APP_SHELL

Required same-origin runtime files belong in `APP_SHELL`; bump `APP_VERSION` for releases. `/api/*` must not be cached. Prep engine/UI/styles and sync module must remain available offline.

## Documentation and security

Run `npm run docs:check`; keep one H1, valid relative links and sequential heading levels.

Never publish access token, OAuth cookie, client secret, Redis credential, private repository data or confidential resume/tracker/prep data. Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
