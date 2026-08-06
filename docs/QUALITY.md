# Browser quality workflow

Auto Resume keeps fast source/unit/documentation checks separate from browser-heavy validation so CI failures point to the right layer.

## Commands

```bash
npm install
npx playwright install chromium
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Playwright uses `scripts/test-server.mjs` with deterministic local fixtures and stubs. Production OAuth credentials, private repository data, raw vacancy text and real resume/tracker/prep content are not test fixtures.

## Chromium coverage

Browser scenarios cover:

- profile loading and vacancy matching;
- resume generation/editing and exports;
- profile comparison, drafts and public read-only links;
- OAuth success/failure/logout;
- Service Worker install, offline navigation and update behavior;
- template rendering/persistence;
- Application Kit generation/export/privacy;
- Resume Quality Audit recalculation/export/privacy;
- Application Tracker CRUD, follow-up, JSON/CSV and public-link hiding;
- Interview Prep questions, answers, STAR stories, readiness, import/export and Tracker-reference boundary.

Axe audits key application states.

## Lighthouse budgets

| Category | Minimum |
| --- | ---: |
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

Manifest structure stays in unit tests; real Service Worker behavior is checked in Chromium.

## Failure artifacts

Screenshots, traces, videos and reports are retained only after failed CI runs. New scenarios should use synthetic data, semantic locators and assert both user-visible behavior and the relevant privacy boundary.
