# Auto Resume v3.0 Threat Model

## Assets

- GitHub OAuth access token;
- encrypted OAuth session cookie;
- PKCE verifier and OAuth `state`;
- user identity and private contribution statistics;
- server-side OAuth client secret and session encryption secret.

## Trust boundaries

1. Browser ↔ Auto Resume serverless API over HTTPS.
2. Auto Resume serverless API ↔ GitHub OAuth and API endpoints.
3. Public profile analytics ↔ authenticated self analytics.
4. Local drafts/public links ↔ OAuth session. These subsystems remain independent.

## Implemented controls

- Authorization Code Flow with PKCE S256.
- Unpredictable `state`, checked with a timing-safe comparison.
- OAuth token is encrypted with AES-256-GCM inside an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Browser JavaScript receives only a sanitized session summary; the token is never returned.
- OAuth scope is limited to `read:user`. Auto Resume cannot read private repository code.
- Authenticated self responses use a separate cache partition and `private, no-store` response headers.
- Logout clears the cookie; disconnect revokes the GitHub app grant.
- Session mutation requires a same-origin request and is excluded from the Service Worker cache.
- Callback errors use stable codes and never log access tokens, authorization codes or cookies.

## Known limitations

- Stateless encrypted cookies cannot be centrally revoked before expiration without rotating `SESSION_SECRET`; disconnect uses GitHub grant revocation to invalidate the token.
- A stolen valid cookie can be replayed until expiration. HTTPS, HttpOnly, SameSite and an eight-hour TTL reduce this risk.
- Availability depends on GitHub OAuth and API endpoints.
- Redis-backed server-side session revocation is tracked separately in Issue #13.

## Secret rotation

Rotate `SESSION_SECRET` to invalidate all local sessions. Rotate `GITHUB_OAUTH_CLIENT_SECRET` in GitHub and deployment settings after suspected exposure. Never commit either value.
