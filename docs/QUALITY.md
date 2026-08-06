# Browser quality workflow

Browser checks are intentionally separate from the fast `npm run verify` path. The goal is simple: when CI fails, it should be obvious whether the problem is source/unit logic, a real Chromium user flow or a Lighthouse budget.

## Local setup

CI uses Node.js 24.

```bash
npm install
npx playwright install chromium
```

Fast checks:

```bash
npm run verify
```

Chromium E2E + axe:

```bash
npm run test:e2e
```

Lighthouse:

```bash
npm run test:lighthouse
```

Both browser suites:

```bash
npm run test:quality
```

Playwright starts `scripts/test-server.mjs` automatically. Lighthouse uses a separate server instance. External browser dependencies are replaced with deterministic local stubs during quality runs so CDN availability does not affect results.

## Covered browser flows

The suite checks the main path from GitHub username to generated resume, DOCX/Markdown downloads, Visual/ATS PDF flows, profile comparison, drafts, public read-only links, Service Worker installation/offline reload and OAuth success/failure/logout cases.

Accessibility is checked with axe on the landing page, generated application state and OAuth consent dialog.

Fixtures contain synthetic public data only. Real access tokens, OAuth cookies, private repository contents and confidential resume data must never be used in browser tests.

## Lighthouse budgets

| Category | Minimum |
| --- | ---: |
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

Manifest structure is covered by unit tests. Service Worker installation and offline navigation are exercised in Chromium rather than relying on deprecated Lighthouse PWA assertion IDs.

## Failure artifacts

Screenshots, traces, videos, Playwright HTML reports and Lighthouse reports are retained only when a CI run fails. Artifacts are kept for seven days.

Local output:

```text
artifacts/playwright-report/
artifacts/lighthouse/
test-results/playwright/
```

## Adding a scenario

Use fixed API fixtures, stable role/label/ID locators and assert a user-visible result or persisted browser state. Any new external runtime script loaded by `index.html` also needs a deterministic stub in `scripts/test-server.mjs`.

Before pushing browser-facing changes, run `npm run verify` plus the relevant Playwright/Lighthouse command.
