# Auto Resume 3.2 threat model

This document describes the security boundaries of the 3.2 branch, including the Redis/KV infrastructure introduced after OAuth.

## Protected assets

- GitHub OAuth access token;
- encrypted OAuth session cookie;
- PKCE verifier and OAuth `state`;
- authenticated user identity and private/internal contribution statistics;
- OAuth client secret and `SESSION_SECRET`;
- cache/rate-limit identifiers stored by the server-side infrastructure.

## Trust boundaries

1. Browser ↔ Auto Resume serverless API over HTTPS.
2. Auto Resume serverless API ↔ GitHub OAuth/API.
3. Public profile cache ↔ authenticated-self cache.
4. Browser-only resume data ↔ OAuth/session subsystem.
5. Serverless instances ↔ optional Redis/KV backend.

## OAuth controls

- Authorization Code Flow with PKCE S256 and unpredictable `state`;
- access token encrypted with AES-256-GCM inside an `HttpOnly`, `Secure`, `SameSite=Lax` cookie;
- browser JavaScript receives only a sanitized session summary;
- scope is limited to `read:user`, which does not grant private repository code access;
- authenticated-self responses use a separate cache partition and `private, no-store`;
- logout clears the local cookie and disconnect revokes the GitHub grant;
- state-changing session requests require same-origin checks;
- `/api/*` is excluded from Service Worker caching;
- callback errors use stable codes without logging tokens, authorization codes or cookies.

## Redis/KV controls

Redis/KV is optional. When configured it is used for shared cache, distributed rate limiting, distributed request coordination and, when enabled, session denylisting.

It must never store OAuth access tokens, OAuth cookies, raw vacancy text or resume content. Rate-limit keys use an HMAC/hash of the IP or session identifier instead of the original identifier. Authenticated-self cache entries use a separate namespace from public profile data.

`SESSION_DENYLIST_ENABLED=true` enables server-side revocation before cookie expiry. The denylist stores only a hash of `sid`, revocation time and TTL. Without Redis/KV, the application falls back to process-local memory; availability is reduced but private payloads are not moved into another storage class.

## Remaining limitations

- a stolen valid session cookie may be replayed until expiry unless its session is denylisted or `SESSION_SECRET` is rotated;
- disabling the optional denylist removes central early revocation, though GitHub grant revocation still invalidates the upstream token;
- availability depends on GitHub OAuth/API and, when configured, the Redis/KV provider;
- memory fallback is instance-local, so cache and rate-limit state are not shared across serverless instances while the external backend is unavailable.

## Secret rotation

Rotate `SESSION_SECRET` to invalidate encrypted local sessions. Rotate `GITHUB_OAUTH_CLIENT_SECRET` through GitHub and deployment settings after suspected exposure. Redis/KV credentials and `RATE_LIMIT_SECRET` should be rotated independently if exposed. None of these values belong in the repository, fixtures or CI artifacts.
