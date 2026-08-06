# Security Policy

Auto Resume 3.9 includes GitHub OAuth, serverless API, optional Redis/KV and several browser-only/local-data subsystems: Application Kit, Resume Quality Audit, Application Tracker, Interview Prep and Offer Decision Lab. Suspected vulnerabilities must be reported privately.

## Supported versions

| Version | Status |
| --- | --- |
| 3.x | supported |
| 2.x and earlier | unsupported |

Use GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Do not publish real access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, OAuth client secrets, Redis credentials, private repository data, raw vacancy text, resume content, tracker notes, interview answers or offer notes.

## Important boundaries

- OAuth PKCE/`state`, encrypted `HttpOnly`, `Secure`, `SameSite` session cookies;
- logout, grant revocation and optional session denylist;
- same-origin/CSRF and API method/header/rate-limit/error controls;
- public/authenticated cache separation and no private resume/tracker/prep/offer payloads in Redis/KV;
- template/public-link/custom-logo sanitization;
- Application Kit and Audit remain browser-only/ephemeral;
- Tracker/Prep/Offer use separate local keys and public read-only mode hides their panels;
- Offer Lab can copy from Tracker only application ID/company/role;
- Offer scoring is a personal heuristic, currencies are not converted and no hidden exchange-rate service is contacted;
- Offer import/export must preserve bounded normalization and version checks;
- logs, screenshots, downloads, fixtures and CI artifacts must not leak private records.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

Use test accounts and synthetic resume/vacancy/tracker/prep/offer data. Do not access other users' accounts, private repositories, drafts or sessions and do not stress GitHub/Vercel/Upstash infrastructure.

Security fixes remain private until impact is validated, regression coverage is added and a verified release is available. Do not create a public release tag before disclosure is ready.
