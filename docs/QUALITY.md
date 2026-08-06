# Browser quality workflow

Fast source/unit/documentation checks are kept separate from browser-heavy validation. CI runs them independently so a failing job points to the right layer.

## Commands

```bash
npm install
npx playwright install chromium
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Playwright uses deterministic local fixtures/stubs through `scripts/test-server.mjs`; Lighthouse runs against a separate local instance. Production credentials, OAuth cookies, private repository data and real resume content are not test fixtures.

Chromium coverage includes profile loading, vacancy matching, resume generation, exports, comparison, drafts, public links, Service Worker offline reload, OAuth flows and template persistence. Axe audits key user states.

## Lighthouse budgets

| Category | Minimum |
| --- | ---: |
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

Manifest structure is checked by unit tests; real Service Worker installation/offline behavior is verified in Chromium.

Failure-only Playwright/Lighthouse artifacts are uploaded by CI. New browser scenarios should use fixed API responses, semantic locators and visible/persisted assertions.

Documentation-only changes still run `npm run docs:check`; the browser suite is necessary when behavior, UI, accessibility or the PWA shell changes.
