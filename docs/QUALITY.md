# Browser quality workflow

Auto Resume keeps fast source and unit checks separate from browser-heavy validation. Pull requests run three independent CI jobs so a failure immediately identifies whether the regression is in source/unit tests, a user flow, or a Lighthouse budget.

## Local setup

Use Node.js 24, matching CI.

```bash
npm install
npx playwright install chromium
```

Run the existing fast checks:

```bash
npm run verify
```

Run Chromium E2E and axe audits:

```bash
npm run test:e2e
```

Run Lighthouse CI:

```bash
npm run test:lighthouse
```

Run both browser suites sequentially:

```bash
npm run test:quality
```

Playwright starts `scripts/test-server.mjs` automatically. Lighthouse starts a separate instance on port 4174. The server uses repository files directly and supplies deterministic local stubs for Chart.js, html2canvas, jsPDF and Google Fonts, so browser checks do not depend on third-party CDN availability.

## Covered scenarios

The Chromium suite validates:

- GitHub username → mocked profile → vacancy matching → resume generation;
- real browser downloads for DOCX and Markdown;
- Visual PDF generation and ATS print flow;
- profile comparison;
- automatic local draft creation;
- read-only public resume links;
- Service Worker installation and offline app-shell reload;
- OAuth success, denied callback, invalid state, logout and expired-session behavior;
- axe checks for the landing page, generated dashboard/editor and OAuth consent dialog.

GitHub endpoints are fulfilled with fixed fixtures. OAuth cookies, access tokens, private repository data and real user resume content are never used. The mocks intentionally expose only the documented `read:user` capability and explicitly mark private repository code as unavailable.

## Lighthouse budgets

`lighthouserc.cjs` enforces these minimum scores on the deterministic desktop shell:

| Category | Minimum |
|---|---:|
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

The audit also requires a working Service Worker and installable manifest. PWA offline behavior is additionally verified by Playwright rather than relying only on a static Lighthouse assertion.

## CI artifacts

Playwright retains screenshots, traces, videos and the HTML report only after failure. Lighthouse stores its HTML/JSON output only after failure. GitHub Actions uploads both artifact groups for seven days and uses at most one retry for browser tests.

Local output is written to:

```text
artifacts/playwright-report/
artifacts/lighthouse/
test-results/playwright/
```

These directories are ignored by Git.

## Adding a browser scenario

1. Reuse `tests/e2e/support.mjs` for profile and auth fixtures.
2. Intercept any new API endpoint with a fixed response; never add production credentials.
3. Prefer role, label or stable ID locators over CSS structure.
4. Assert a user-visible outcome, downloaded filename or persisted browser state.
5. Keep retries disabled locally and limited to one attempt in CI.
6. Run `npm run verify` and the relevant browser command before opening a PR.

When adding a new external runtime script to `index.html`, also add a deterministic quality stub in `scripts/test-server.mjs`. This keeps E2E and Lighthouse results reproducible while production continues to load the real library.
