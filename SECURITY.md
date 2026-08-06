# Security Policy

Auto Resume 3.8 includes GitHub OAuth, serverless API, optional Redis/KV, local resume data, Application Kit, Resume Quality Audit, Application Tracker and Interview Prep Lab. Suspected vulnerabilities must be reported privately.

## Supported versions

| Version | Status |
| --- | --- |
| 3.x | supported |
| 2.x and earlier | unsupported |

Use GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Do not post real access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, OAuth client secrets, Redis credentials, private repository data, raw vacancy text, resume content, tracker notes or interview answers publicly.

## Important boundaries

- OAuth PKCE/`state`, encrypted `HttpOnly`, `Secure`, `SameSite` session cookies;
- logout, grant revocation and optional session denylist;
- same-origin/CSRF and API method/header/rate-limit/error controls;
- public/authenticated cache separation and no private resume/tracker/prep payloads in Redis/KV;
- template/public-link/custom-logo sanitization;
- Application Kit and Audit stay browser-only/ephemeral;
- Tracker stays in its dedicated browser key and does not enter workspace/share/API/cache;
- Interview Prep stores only allowlisted session data, links to Tracker by ID/company/role only and excludes raw vacancy text, resume content, Kit output and Audit report;
- readiness score is a local heuristic, not an employment decision signal;
- logs, screenshots, downloads, fixtures and CI artifacts must not leak private records.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

Use test accounts and synthetic resume/vacancy/tracker/prep data. Do not access other users' accounts, private repositories, drafts or sessions and do not stress GitHub/Vercel/Upstash infrastructure.

Security fixes remain private until impact is validated, regression coverage is added and a verified release is available. Do not create a public release tag before disclosure is ready.
