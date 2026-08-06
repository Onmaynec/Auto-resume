# Auto Resume 3.5 threat model

Auto Resume 3.5 combines GitHub OAuth, optional Redis/KV, local resume data, versioned templates and browser-only Application Kit.

## Protected assets

- OAuth token/session/PKCE state and server-side secrets;
- authenticated contribution statistics;
- local resume drafts/public share data;
- raw vacancy text and normalized matching result;
- Application Kit output;
- template/presentation data.

## Controls

OAuth uses PKCE S256, unpredictable `state`, `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the token.

Public/authenticated cache namespaces are separate; private responses use `no-store`. Redis/KV stores no OAuth token, raw vacancy text or resume content. Optional denylisting stores only a hashed session id plus revocation metadata.

Template definitions are data-only and cannot inject arbitrary executable code. Custom logo remains a temporary local `blob:` URL.

Application Kit receives normalized requirement/skill names and public project metadata, not raw vacancy text. Its UI does not use `fetch`, `localStorage` or `sessionStorage`; kit data is excluded from drafts, backup, public share, Redis/KV and serverless API requests. Missing skills remain gaps rather than fabricated experience.

## Remaining limitations

A stolen valid session cookie can be replayed until expiry unless denylisted or secrets are rotated. Memory fallback is instance-local. Application Kit is intentionally ephemeral, so reload removes unsaved kit content.

## Reporting and rotation

Security reports use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Rotate `SESSION_SECRET`, OAuth client secret, Redis/KV credentials and `RATE_LIMIT_SECRET` independently after suspected exposure.
