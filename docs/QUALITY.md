# Browser quality workflow

Fast source/unit/docs checks are separate from Chromium and Lighthouse validation.

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Tests use deterministic local fixtures/stubs and never production credentials or real private resume/vacancy data.

Chromium coverage includes profile/vacancy/resume flow, exports, comparison, drafts, public links, OAuth, offline PWA, templates, Application Kit and Resume Quality Audit. Audit scenarios verify live recalculation, stable findings, local export, public-link hiding and privacy boundaries. Axe checks key application states.

Lighthouse budgets: Performance 70, Accessibility 95, Best Practices 90, SEO 90.

Failure-only screenshots/traces/videos/reports are uploaded by CI. New audit/browser scenarios should assert user-visible results and confirm raw vacancy text/report content does not leak into storage or requests.
