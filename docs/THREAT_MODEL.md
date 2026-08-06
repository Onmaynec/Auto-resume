# Auto Resume 3.4 threat model

Auto Resume 3.4 combines GitHub OAuth, optional Redis/KV, browser-only resume data and the versioned template system. Governance changes in 3.4 do not expand runtime privileges, but they define how security-sensitive changes must be reviewed and reported.

## Protected assets

- OAuth access token, encrypted session cookie, PKCE verifier and `state`;
- OAuth client secret and `SESSION_SECRET`;
- authenticated identity/private contribution statistics;
- local resume drafts/public-link payloads;
- cache/rate-limit identifiers;
- presentation/template data rendered in the browser.

## Boundaries and controls

OAuth uses Authorization Code Flow + PKCE S256, unpredictable `state`, scope `read:user` and AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser JavaScript never receives the token.

Public and authenticated cache namespaces are separate. Authenticated responses use `private, no-store`; `/api/*` is excluded from Service Worker caching. State-changing session requests use same-origin/CSRF controls.

Redis/KV never stores access tokens, cookies, raw vacancy text or resume content. Rate-limit/session identifiers are hashed. Optional denylisting stores only hashed `sid`, revocation time and TTL. If Redis is unavailable, the application falls back to process-local memory.

Template definitions are data-only and cannot inject JavaScript, arbitrary HTML, external CSS or event handlers. Custom logo data is represented only by a temporary local `blob:` URL and is not serialized.

## Reporting boundary

Security reports must use [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new), not public Issues. Public Issue Forms and PR templates explicitly warn against posting credentials/private data.

## Remaining limitations

A stolen valid cookie can be replayed until expiry unless its session is denylisted or session secrets are rotated. Memory fallback is instance-local. Availability depends on GitHub and, when configured, the external Redis/KV provider.

## Secret rotation

Rotate `SESSION_SECRET` to invalidate encrypted sessions. Rotate the GitHub OAuth client secret, Redis/KV credentials and `RATE_LIMIT_SECRET` independently after suspected exposure. Never store these values in fixtures, documentation or CI artifacts.
