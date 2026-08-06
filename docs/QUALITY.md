# Browser quality workflow

Fast source/unit/docs checks are separate from Chromium and Lighthouse validation.

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Tests use deterministic local fixtures/stubs and never production credentials or real private resume/vacancy/tracker/prep data.

Chromium coverage includes profile/vacancy/resume flow, exports, comparison, drafts, public links, OAuth, offline PWA, templates, Application Kit, Resume Quality Audit, Application Tracker and Interview Prep Lab.

Prep scenarios verify deterministic question generation, answer editing, completion/self-rating, STAR stories, readiness calculation, dedicated JSON/Markdown downloads, Tracker reference boundary, public-link hiding and absence of raw vacancy/resume content from storage/API requests.

Axe audits key application states. Lighthouse budgets remain Performance 70, Accessibility 95, Best Practices 90 and SEO 90.

Failure-only screenshots/traces/videos/reports are uploaded by CI. New Prep scenarios should use synthetic content and assert both visible behavior and privacy contracts.
