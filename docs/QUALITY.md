# Browser quality workflow

Fast source/unit/docs checks are separate from Chromium and Lighthouse validation.

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Tests use deterministic local fixtures/stubs and never production credentials or real private resume/vacancy/tracker/prep/offer data.

Chromium coverage includes profile/vacancy/resume flow, exports, comparison, drafts, public links, OAuth, offline PWA, templates, Kit, Audit, Tracker, Interview Prep and Offer Decision Lab.

Offer scenarios should cover normalization, ratings/weights, red flags, zero-weight fallback, first-year compensation, deadline states, comparison by same currency, JSON/Markdown export, Tracker-reference boundary and public-read-only hiding.

Axe audits key application states. Lighthouse budgets remain Performance 70, Accessibility 95, Best Practices 90 and SEO 90.

Failure-only screenshots/traces/videos/reports are uploaded by CI. New Offer Lab tests must use synthetic compensation/notes and verify no offer records leak into API/share/cache payloads.
