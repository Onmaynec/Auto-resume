# Auto Resume 3.8 threat model

Auto Resume 3.8 combines GitHub OAuth, optional Redis/KV, local resume data, templates, browser-only Application Kit/Resume Quality Audit and two separate local databases: Application Tracker and Interview Prep.

## Protected data

OAuth/session secrets, authenticated contribution statistics, resume drafts/public links, raw vacancy text, Kit/Audit output, tracker records and interview answers/STAR stories each have separate storage and transport boundaries.

## Controls

OAuth uses PKCE S256, unpredictable `state`, `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the access token.

Public/authenticated cache namespaces are separate. Redis/KV stores no OAuth token, raw vacancy text, resume content, Kit/Audit output, tracker records or prep sessions. Optional denylisting stores only hashed session metadata.

Template definitions are data-only; custom logo remains a temporary local `blob:` URL.

Application Kit receives normalized matching data, not raw vacancy text. Resume Quality Audit receives current draft plus normalized requirement names and does not rewrite it.

Application Tracker persists in `auto-resume:application-tracker:v1`; draft relations contain ID/name only. Tracker is excluded from workspace backup, public share, API, Redis/KV and analytics.

Interview Prep persists in `auto-resume:interview-prep:v1`. Its Tracker relation is limited to application ID/company/role. Raw vacancy text, resume content, Kit output, Audit report, Tracker notes and vacancy URL are excluded. Readiness is an explainable local heuristic and must not be treated as an employment decision or hiring prediction.

Public read-only resumes hide Audit, Tracker and Prep panels.

## Remaining limitations

A stolen valid session cookie can be replayed until expiry unless denylisted or secrets are rotated. Clearing browser site data deletes Tracker and Prep unless the user exported their dedicated JSON backups.

## Reporting

Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Rotate OAuth/session/Redis secrets independently after suspected exposure.
