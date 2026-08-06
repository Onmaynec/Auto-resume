# Changelog

## Unreleased — browser quality gates

- added deterministic Chromium E2E coverage for the main resume, export, sharing, OAuth and offline flows;
- added axe accessibility checks for key application states;
- added Lighthouse budgets for performance, accessibility, best practices and SEO;
- browser checks use local fixtures/stubs instead of production credentials or third-party CDN availability;
- failure-only Playwright and Lighthouse artifacts are uploaded by CI.

## v3.2.0 — 2026-08-01

- added optional Upstash Redis/Vercel KV storage for shared cache and distributed rate limiting;
- separated public and authenticated-self cache namespaces;
- added stale-while-revalidate and protection against duplicate concurrent GitHub requests;
- added memory fallback when the external store is missing or unavailable;
- added optional session denylisting without storing OAuth tokens;
- added privacy-safe cache/rate-limit metrics and tests.

## v3.1.0 — 2026-08-01

- added background checks for the latest stable GitHub Release;
- added user-confirmed PWA update activation and release notes links;
- added automated verified tagging/release workflow.

## v3.0.0 — 2026-08-01

- added GitHub OAuth Authorization Code Flow with PKCE and `read:user`;
- added encrypted `HttpOnly` session cookies, session status, logout and grant revocation;
- separated authenticated analytics from public cache;
- added the initial threat model and OAuth security tests.

## v2.4.0 — 2026-08-01

- added local DOCX and Markdown exports with editable text, links and RU/EN metadata.

## v2.3.0 — 2026-08-01

- added RU/EN localization across UI, exports, drafts and public links.

## v2.2.0 — 2026-08-01

- added PWA/offline shell, drafts, autosave and JSON backup.

## v2.1.0 — 2026-08-01

- added profile comparison, recent profiles, themes and CI.

## v2.0.0 — 2026-08-01

- added vacancy analysis, language history and public links.

## v1.1.0 — 2026-08-01

- added project selection, editing and ATS export.

## v1.0.0

- first public GitHub-profile resume generator.
