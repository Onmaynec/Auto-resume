# Auto Resume 3.6 threat model

Auto Resume 3.6 combines GitHub OAuth, optional Redis/KV, local resume data, templates, browser-only Application Kit and browser-only Resume Quality Audit.

## Protected assets

OAuth/session secrets, authenticated contribution statistics, local resume drafts/public links, raw vacancy text, Application Kit output and Audit reports must stay inside their documented boundaries.

## Controls

OAuth uses PKCE S256, unpredictable `state`, `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the access token.

Public/authenticated cache namespaces are separate. Redis/KV stores no OAuth token, raw vacancy text, resume content, Kit output or Audit report. Optional denylisting stores only hashed session metadata.

Template definitions are data-only; custom logo remains a temporary local `blob:` URL.

Application Kit receives normalized matching data, not raw vacancy text, and is excluded from workspace/public share/API/storage.

Resume Quality Audit receives the current draft plus normalized requirement names. It does not receive raw vacancy text, does not rewrite the draft automatically and its report is excluded from workspace, backup, public share, Redis/KV, API and analytics.

## Remaining limitations

A stolen valid session cookie can be replayed until expiry unless denylisted or secrets are rotated. Browser-only Kit/Audit data is ephemeral unless the user explicitly exports it.

## Reporting

Use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Rotate OAuth/session/Redis secrets independently after suspected exposure.
