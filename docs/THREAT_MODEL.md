# Auto Resume 3.9 threat model

Auto Resume 3.9 combines GitHub OAuth, optional Redis/KV, browser-only Kit/Audit and three separate persistent local databases: Application Tracker, Interview Prep and Offer Decision Lab.

## Protected data

OAuth/session secrets, authenticated contribution statistics, resume drafts/public links, raw vacancy text, Kit/Audit output, tracker records, interview answers/STAR stories and offer compensation/notes each have separate storage and transport boundaries.

## Controls

OAuth uses PKCE S256, unpredictable `state`, `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the token.

Public/authenticated cache namespaces are separate. Redis/KV stores no OAuth token, raw vacancy text, resume content, Kit/Audit output, Tracker, Prep or Offer records. Optional denylisting stores only hashed session metadata.

Template definitions are data-only; custom logo remains a temporary local `blob:` URL.

Kit receives normalized matching data, Audit receives draft + normalized requirement names. Tracker persists in its own key. Prep references Tracker only by application ID/company/role and excludes notes/vacancy/resume content.

Offer Lab persists in `auto-resume:offer-lab:v1`. Its Tracker relation is also limited to application ID/company/role. It excludes Tracker notes, vacancy URLs, resume drafts, raw vacancy text, Kit/Audit and Prep answers. Currency conversion is intentionally absent, so no exchange-rate network dependency exists. Offer score is an explainable personal heuristic, not an automated employment decision.

Public read-only resumes hide Audit, Tracker, Prep and Offer panels.

## Remaining limitations

A stolen valid session cookie can be replayed until expiry unless denylisted or secrets are rotated. Clearing browser site data deletes Tracker/Prep/Offer records unless dedicated JSON exports were saved. Financial values in Offer Lab are user-entered and do not account for taxes, vesting or legal interpretation.

## Reporting

Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Rotate OAuth/session/Redis secrets independently after suspected exposure.
