# Browser quality workflow

Auto Resume keeps fast source/unit checks separate from browser-heavy validation. This makes CI failures easier to diagnose and keeps local iteration quick.

## Commands

```bash
npm install
npx playwright install chromium
npm run verify
npm run test:e2e
npm run test:lighthouse
```

`npm run test:quality` runs both browser suites sequentially.

Playwright uses `scripts/test-server.mjs` with deterministic fixtures and local stubs for browser-only dependencies. Lighthouse runs against a separate local server. Production OAuth credentials, private repository data and real resume content are not used.

## Browser coverage

Chromium scenarios cover profile loading, vacancy matching, resume generation, DOCX/Markdown downloads, Visual/ATS PDF flows, comparison, drafts, public read-only links, Service Worker offline reload and OAuth session flows.

The v3.3 suite also covers template switching, presentation persistence, fallbacks and accessibility of the template controls.

Axe audits run on key application states.

## Lighthouse budgets

| Category | Minimum |
| --- | ---: |
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

Manifest structure remains a unit-test responsibility; Service Worker install/offline behavior is verified in Chromium.

## Artifacts

Screenshots, traces, videos and HTML/JSON reports are retained only after failure. CI uploads failure artifacts for seven days.

When adding a browser flow, use fixed API responses, stable semantic locators and a visible/persisted assertion. New external runtime scripts also need deterministic test-server stubs.
