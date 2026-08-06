# Security Policy

Auto Resume 3.7 includes GitHub OAuth, serverless API, optional Redis/KV, local resume data, Application Kit, Resume Quality Audit and a separate local Application Tracker. Suspected vulnerabilities must be reported privately.

## Supported versions

| Version | Status |
| --- | --- |
| 3.x | supported |
| 2.x and earlier | unsupported |

Use GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Do not post real access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, OAuth client secrets, Redis credentials, private repository data, raw vacancy text, resume content or tracker notes publicly.

## Important boundaries

- OAuth PKCE/`state`, encrypted `HttpOnly`, `Secure`, `SameSite` session cookies;
- logout, grant revocation and optional session denylist;
- same-origin/CSRF and API method/header/rate-limit/error controls;
- public/authenticated cache separation and no OAuth token/private resume data in Redis/KV;
- template/public-link/custom-logo sanitization;
- Application Kit and Audit remain browser-only/ephemeral and outside share/API/cache;
- Tracker is stored only in its dedicated browser key and must not enter workspace backup, public share, API, Redis/KV or analytics;
- Tracker CSV export must remain protected against spreadsheet formula injection;
- logs, screenshots, downloads, test fixtures and CI artifacts must not leak private records.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

Use test accounts and synthetic resume/vacancy/tracker data. Do not access other users' accounts, private repositories, drafts or sessions and do not stress GitHub/Vercel/Upstash infrastructure.

Security fixes remain private until impact is validated, regression coverage is added and a verified release is available. Do not create a public release tag before disclosure is ready.
