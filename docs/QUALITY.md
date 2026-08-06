# Browser quality workflow

Fast source/unit/docs checks are separate from Chromium and Lighthouse validation.

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Tests use deterministic local fixtures/stubs and never production credentials or real private resume/vacancy/tracker data.

Chromium coverage includes profile/vacancy/resume flow, exports, comparison, drafts, public links, OAuth, offline PWA, templates, Application Kit, Resume Quality Audit and Application Tracker. Tracker scenarios cover CRUD, status/follow-up filters, dedicated JSON/CSV downloads, public-link hiding and privacy boundaries. CSV fixtures include formula-like values to preserve injection protection.

Axe audits key application states. Lighthouse budgets remain Performance 70, Accessibility 95, Best Practices 90 and SEO 90.

Failure-only screenshots/traces/videos/reports are uploaded by CI. New tracker scenarios should assert visible/persisted behavior while confirming tracker records never appear in workspace share payloads or API requests.
