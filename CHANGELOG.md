# Changelog

## v3.7.0 — 2026-08-02

- added fully local Application Tracker with a separate versioned schema;
- records contain company, role, HTTPS vacancy URL, status, dates, notes and optional draft reference;
- draft relation stores only ID/name, never resume content;
- added `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn` statuses;
- added actionable follow-up sorting, search, filters and local statistics;
- added versioned JSON import/export and CSV formula-injection protection;
- tracker data is excluded from workspace backup, public share, API, Redis/KV and analytics;
- public read-only resumes hide the Tracker panel;
- added offline app-shell assets, unit/privacy/Chromium/axe coverage.

## v3.6.0 — 2026-08-02

- added local explainable Resume Quality Audit with four scoring categories;
- audit does not rewrite resumes and remains outside workspace/share/API.

## v3.5.0 — 2026-08-02

- added browser-only Application Kit with cover letter, evidence, gap plan and interview questions.

## v3.4.0 — 2026-08-02

- added contributor/security governance and documentation checks.

## v3.3.0 — 2026-08-02

- added versioned visual/ATS template system and local custom logo.

## v3.2.0 — 2026-08-01

- added optional Redis/KV shared cache, rate limiting and session denylisting.

## v3.1.0 — 2026-08-01

- added controlled PWA updates and automated releases.

## v3.0.0 — 2026-08-01

- added GitHub OAuth with PKCE and encrypted HttpOnly sessions.

## v2.x

- introduced local exports, RU/EN localization, PWA/drafts, comparison, vacancy analysis and public links.

## v1.x

- initial GitHub-profile resume generation and editing.
