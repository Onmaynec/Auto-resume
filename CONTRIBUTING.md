# Contributing to Auto Resume

Changes must preserve privacy boundaries, RU/EN Localization, offline PWA behavior and compatibility of existing drafts/public links. In 3.9, Tracker, Interview Prep and Offer Lab are separate local databases and may share only explicitly allowlisted references.

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

Application Kit excludes raw vacancy text. Audit never rewrites the draft. Tracker stores a small draft reference only. Prep can reference Tracker only by application ID/company/role and excludes tracker notes/raw vacancy/resume content.

Offer Lab also receives only application ID/company/role from Tracker. It must not copy Tracker notes, vacancy URL, resume draft, Kit/Audit or Prep answers. Decision score is a personal heuristic, not an employer-quality or career-success prediction. No currency conversion or hidden exchange-rate request may be added without an explicit product/privacy design change.

Offer import must remain versioned/bounded; red-flag penalty and zero-weight fallback need deterministic tests.

## PWA and APP_SHELL

Required same-origin runtime files belong in `APP_SHELL`; bump `APP_VERSION` for releases. `/api/*` must not be cached. Offer Lab engine/UI/styles must remain available offline.

## Documentation and security

Run `npm run docs:check`; keep one H1, valid relative links and sequential heading levels.

Never publish access token, OAuth cookie, client secret, Redis credential, private repository data or confidential resume/tracker/prep/offer data. Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
