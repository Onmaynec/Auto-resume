# Contributing to Auto Resume

Thank you for improving Auto Resume. Contributions should preserve the project's privacy guarantees, bilingual interface, offline PWA behavior, and compatibility with existing drafts and public resume links.

Before participating, read the [Code of Conduct](CODE_OF_CONDUCT.md). Security vulnerabilities must follow the private process in [SECURITY.md](SECURITY.md), not a public Issue.

## Development environment

Auto Resume uses Node.js 24 in GitHub Actions.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

The quality server provides deterministic local fixtures and stubs. Never add production credentials, OAuth cookies, private repository data, or real resume content to fixtures.

## Commands

| Command | Purpose |
|---|---|
| `npm run check` | Syntax-check production, API, test-server, and quality scripts |
| `npm run docs:check` | Validate governance Markdown, local links, Issue Forms, and security contacts |
| `npm test` | Run dependency-free unit and integration tests |
| `npm run test:e2e` | Run Chromium user flows and axe accessibility checks |
| `npm run test:lighthouse` | Run Lighthouse performance, accessibility, best-practices, and SEO budgets |
| `npm run verify` | Run syntax, documentation, unit/integration, and whitespace checks |

Run `npm run verify` before every push. Run the browser suite for user-visible flows, authentication, exports, sharing, storage, Service Worker, or accessibility changes.

## Architecture

The repository is intentionally dependency-light:

- `index.html`, `styles.css`, and versioned CSS files define the browser shell;
- `app.js` coordinates loading, rendering, preferences, workspace, and exports;
- `js/*.mjs` contains testable modules for localization, sharing, templates, OAuth state, updates, and persistence;
- `api/` contains serverless GitHub and OAuth endpoints;
- `sw.js` owns the offline app shell and update lifecycle;
- `tests/*.test.mjs` contains unit and integration contracts;
- `tests/e2e/` contains Playwright and axe scenarios;
- `scripts/test-server.mjs` provides deterministic browser fixtures;
- `.github/workflows/` defines CI and release automation.

Keep resume content independent from presentation settings. DOCX, Markdown, and TXT exports must not depend on a visual template.

## Branches and commits

Create work from the latest `main`.

Use one of these branch forms:

- `feat/<short-description>` for product features;
- `fix/<short-description>` for defects;
- `docs/<short-description>` for documentation-only work;
- `test/<short-description>` for quality infrastructure;
- `agent/<short-description>` for automated repository work.

Use Conventional Commit-style subjects:

```text
feat: add a resume section
fix: preserve locale in shared links
docs: document the OAuth threat model
test: cover an offline migration
chore: update release metadata
```

Keep commits focused. Do not mix generated artifacts, unrelated refactors, or local credentials into a pull request.

## Pull request workflow

The supported release path is:

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

1. Rebase or merge the latest `main` into the branch.
2. Open a pull request and complete `.github/pull_request_template.md`.
3. Keep the pull request in draft while required checks are failing.
4. Address test, privacy, accessibility, localization, and compatibility findings.
5. Merge only after `verify`, `documentation`, `browser-e2e`, and `lighthouse` succeed.
6. Delete the merged branch when it is no longer needed.

Do not create a release tag manually for a normal release. A version change merged into `main` triggers `.github/workflows/release.yml`, which verifies metadata, creates `vX.Y.Z`, and publishes GitHub Release notes from `CHANGELOG.md`.

A release pull request must update all of:

- `package.json`;
- `js/version.mjs`;
- `sw.js`;
- the matching `## vX.Y.Z` section in `CHANGELOG.md`.

## Serverless API requirements

Every new or changed endpoint under `api/` must:

- explicitly allow supported HTTP methods and return `405` for others;
- set appropriate content type, cache, referrer, framing, and sniffing headers;
- use `HttpOnly`, `Secure`, and intentional `SameSite` cookie attributes;
- protect state-changing requests with same-origin and CSRF controls;
- preserve OAuth `state` and PKCE validation where applicable;
- avoid tokens, cookies, authorization codes, session identifiers, IP addresses, private profile data, and resume content in logs;
- use `no-store` for authenticated or private responses;
- apply rate limiting and bounded timeouts to external requests;
- return stable, sanitized error codes rather than upstream secrets.

Tests must prove method handling, origin checks, cookie policy, redaction, and failure behavior.

## Localization

Russian and English dictionaries in `js/i18n.mjs` must contain identical keys.

When adding interface text:

1. add both RU and EN values;
2. use `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label`, or `t()`;
3. avoid concatenating translated sentence fragments;
4. test interpolation and fallback behavior;
5. run `npm run verify` and the relevant browser scenario.

## PWA cache and offline behavior

When adding a required same-origin runtime file to `index.html`, add it to `APP_SHELL` in `sw.js`. A release must also bump `APP_VERSION`, producing a new cache namespace.

Do not cache `/api/*`. Test online installation, an offline navigation reload, and update activation when changing Service Worker behavior.

## Documentation and links

Use one H1 per governance document, do not skip heading levels, and keep relative links valid. Run:

```bash
npm run docs:check
```

The checker also verifies that Issue Forms and the pull request template warn contributors not to publish secrets.

## Reporting bugs and proposing features

Use the repository's structured Issue Forms. Include a minimal reproduction with redacted logs and synthetic data.

Do not publish access tokens, OAuth cookies, client secrets, Redis credentials, private repository data, or confidential resume content. Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new) for suspected security issues.
