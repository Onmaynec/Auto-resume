# Auto Resume 3.3 threat model

Auto Resume 3.3 combines GitHub OAuth, optional Redis/KV infrastructure and a data-driven template system. Browser-only resume content remains separate from authentication and server-side caching.

## Protected assets

- GitHub OAuth access token and encrypted session cookie;
- PKCE verifier and OAuth `state`;
- OAuth client secret and `SESSION_SECRET`;
- authenticated user identity/private contribution statistics;
- local resume drafts and public-link payloads;
- template/presentation data accepted by the renderer.

## Main boundaries

1. Browser ↔ serverless API over HTTPS.
2. Serverless API ↔ GitHub OAuth/API.
3. Public profile cache ↔ authenticated-self cache.
4. Browser-only resume/presentation data ↔ OAuth/session subsystem.
5. Serverless instances ↔ optional Redis/KV backend.
6. Template definitions ↔ reviewed renderer code.

## Controls

OAuth uses Authorization Code Flow with PKCE S256, unpredictable `state`, `read:user` only and an AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` session cookie. Browser JavaScript never receives the access token.

Authenticated responses use a separate cache namespace and `private, no-store`. `/api/*` is excluded from Service Worker caching. Logout clears the cookie and disconnect revokes the GitHub grant.

Redis/KV never stores access tokens, cookies, vacancy text or resume content. Rate-limit identifiers are hashed/HMACed. Optional session denylisting stores only a hashed session id, revocation time and TTL; memory fallback is used when Redis is unavailable.

Template definitions are data-only. They cannot inject JavaScript, arbitrary HTML, external CSS or event handlers. Text is escaped, project URLs are HTTPS-only and unsupported template/schema versions use a safe fallback. Custom logos remain temporary `blob:` URLs and are not serialized.

## Remaining limitations

A stolen valid cookie can be replayed until expiry unless its session is denylisted or secrets are rotated. Disabling the optional denylist removes central early revocation. Availability still depends on GitHub and, when configured, Redis/KV.

## Secret rotation

Rotate `SESSION_SECRET` to invalidate local sessions and rotate the GitHub OAuth client secret after suspected exposure. Redis/KV credentials and `RATE_LIMIT_SECRET` are separate secrets and should be rotated independently.
