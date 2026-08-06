# Changelog

## v3.6.0 — 2026-08-02

- added fully local Resume Quality Audit with versioned result schema;
- split score 0–100 into completeness, evidence, ATS readiness and readability;
- added stable localized issue codes and explainable deductions;
- vacancy coverage uses normalized requirement names, not raw vacancy text;
- audit recalculates after user edits but never rewrites the resume automatically;
- added local Markdown/TXT export and clipboard support;
- audit report is excluded from drafts, backup, public share, API, Redis/KV and analytics;
- added unit/privacy/Chromium/axe coverage and PWA app-shell assets.

## v3.5.0 — 2026-08-02

- added browser-only Application Kit with cover letter, evidence prompts, gap plan and interview questions;
- added three tones and local Markdown/TXT export;
- raw vacancy text remains outside generated kit/storage/API.

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
