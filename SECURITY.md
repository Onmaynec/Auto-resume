# Security Policy

Auto Resume handles GitHub profile data, OAuth sessions, serverless API requests, local resume drafts, and public-link payloads. Please report vulnerabilities privately and avoid exposing users or credentials while testing.

## Supported versions

| Version | Security support |
|---|---|
| 3.x | Supported |
| 2.x and earlier | No longer supported |

Security fixes are prepared against the latest `main` branch and released as a new SemVer version.

## Reporting a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).

Do not open a public Issue for a suspected vulnerability. Do not paste access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, GitHub OAuth client secrets, Redis credentials, private repository data, IP addresses, or confidential resume content into Issues, pull requests, screenshots, or logs.

A useful private report contains:

- the affected version or commit;
- the affected page, endpoint, cookie, storage key, or workflow;
- a minimal reproduction using synthetic accounts and redacted values;
- the expected and observed security boundary;
- impact and prerequisites;
- suggested remediation, when available.

The maintainer aims to acknowledge actionable reports promptly, validate them privately, coordinate a fix, and publish credit when requested and safe.

## Security scope

High-value areas include:

- OAuth Authorization Code Flow, PKCE, and `state`;
- encrypted `HttpOnly`, `Secure`, `SameSite` session cookies;
- logout, grant revocation, and optional session denylisting;
- same-origin and CSRF checks on state-changing requests;
- serverless method allowlists, rate limits, cache partitioning, and error sanitization;
- Redis/KV keys and the guarantee that OAuth tokens are not persisted there;
- public resume link parsing and legacy migrations;
- template rendering, URL sanitization, and custom-logo privacy;
- Service Worker cache boundaries and update activation;
- accidental secret disclosure in logs, fixtures, artifacts, or documentation.

The following generally are not vulnerabilities unless they cross a documented security boundary:

- public information already available from a GitHub profile;
- self-XSS requiring a user to paste code into developer tools;
- missing best-practice headers without a demonstrated impact;
- denial of service requiring unrealistic local-only interaction;
- reports against unsupported versions without impact on the current release.

## Safe testing

Use test accounts and synthetic resume data. Do not access another person's account, private repositories, drafts, or sessions. Do not degrade GitHub, Vercel, Upstash, or repository infrastructure. Stop testing when data exposure, persistence, or service impact becomes possible.

Automated scanning must respect rate limits and must not upload repository contents to an untrusted third party.

## Disclosure and release process

1. The report remains private while impact and affected versions are validated.
2. A fix is developed in a restricted branch or private advisory fork when appropriate.
3. Relevant unit, browser, privacy, and regression checks are added.
4. The fix is merged and released through the normal verified release workflow.
5. The advisory is published after users can update, with coordinated credit when requested.

Never create or move a public release tag before the fix is ready for disclosure.
