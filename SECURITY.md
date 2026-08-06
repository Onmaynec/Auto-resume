# Security Policy

Auto Resume 3.6 includes GitHub OAuth, serverless API, optional Redis/KV, local drafts/public links, Application Kit and Resume Quality Audit. Suspected vulnerabilities are reported privately.

## Supported versions

| Version | Status |
| --- | --- |
| 3.x | supported |
| 2.x and earlier | unsupported |

Use GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Do not post access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, client secrets, Redis credentials, private repository data, raw vacancy text or confidential resume/audit content publicly.

## Important boundaries

- OAuth PKCE/`state`, encrypted `HttpOnly`, `Secure`, `SameSite` session cookies;
- logout/grant revocation/optional denylist;
- same-origin/CSRF and API method/header/rate-limit/error controls;
- public/authenticated cache separation and no OAuth token in Redis/KV;
- public-link/template/custom-logo sanitization;
- Service Worker cache boundaries;
- Application Kit must exclude raw vacancy text from storage/API;
- Resume Quality Audit must not serialize reports into workspace/public share/API or automatically rewrite resume content;
- logs, screenshots, test fixtures and CI artifacts must not leak private data.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

Use test accounts and synthetic data. Do not access other users' accounts/private repositories/drafts/sessions or stress GitHub/Vercel/Upstash infrastructure.

A security fix stays private until impact is validated, regression coverage is added and a verified release is available. Do not create a public release tag before disclosure is ready.
