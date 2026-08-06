# Auto Resume 3.7 threat model

Auto Resume 3.7 combines GitHub OAuth, optional Redis/KV, local resume data, templates, browser-only Application Kit/Resume Quality Audit and a separate persistent Application Tracker.

## Protected data

OAuth/session secrets, authenticated contribution statistics, resume drafts/public links, raw vacancy text, Kit/Audit output and tracker records each have separate storage and transport boundaries.

## Controls

OAuth uses PKCE S256, unpredictable `state`, `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the access token.

Public/authenticated cache namespaces are separate. Redis/KV stores no OAuth token, raw vacancy text, resume content, Kit/Audit output or tracker records. Optional denylisting stores only hashed session metadata.

Template definitions are data-only; custom logo remains a temporary local `blob:` URL.

Application Kit receives normalized matching data, not raw vacancy text. Resume Quality Audit receives current draft plus normalized requirement names and does not rewrite the draft. Both remain outside workspace/share/API/cache.

Application Tracker persists only in `auto-resume:application-tracker:v1`. Draft relations contain ID/name only. Tracker data is excluded from workspace backup, public share, GitHub/OAuth API payloads, Redis/KV, analytics, Application Kit and Audit. Vacancy URLs are HTTPS-only, import is normalized/versioned and CSV export protects formula-like cell prefixes.

Public read-only resumes must not expose Tracker or Audit panels.

## Remaining limitations

A stolen valid session cookie can be replayed until expiry unless denylisted or secrets are rotated. Clearing browser site data deletes Tracker unless the user exported its dedicated JSON backup.

## Reporting

Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Rotate OAuth/session/Redis secrets independently after suspected exposure.
