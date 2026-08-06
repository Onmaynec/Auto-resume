# Browser quality workflow

Fast source/unit/docs checks stay separate from Chromium and Lighthouse validation.

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Playwright uses deterministic local fixtures/stubs; production credentials, private repository data and real resume/vacancy content are not used.

Chromium coverage includes profile loading, vacancy matching, resume generation, exports, comparison, drafts, public links, PWA offline reload, OAuth flows, template persistence and Application Kit generation/edit/clipboard/download/privacy behavior.

Axe audits key user states. Lighthouse budgets remain Performance 70, Accessibility 95, Best Practices 90 and SEO 90.

Failure-only screenshots/traces/videos/reports are uploaded by CI. New scenarios should use fixed API responses and semantic locators. Application Kit tests must assert that raw vacancy text does not enter storage or API requests.
