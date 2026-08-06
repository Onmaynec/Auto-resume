# Security Policy

Auto Resume 3.5 работает с GitHub OAuth, serverless API, Redis/KV, локальными resume drafts/public links и browser-only Application Kit. Потенциальные уязвимости сообщаются приватно.

## Поддерживаемые версии

| Версия | Статус |
| --- | --- |
| 3.x | поддерживается |
| 2.x and earlier | не поддерживается |

## Reporting

Используйте GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new). Не публикуйте реальные access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, OAuth client secrets, Redis credentials, private repository data, IP addresses, resume content или raw vacancy text.

Полезный report содержит affected version/commit, boundary, synthetic reproduction, expected/observed behavior и impact.

## Security scope

- OAuth PKCE/`state`, encrypted `HttpOnly`, `Secure`, `SameSite` session cookie;
- logout/grant revocation/session denylist;
- same-origin/CSRF для state-changing requests;
- API method/headers/rate limits/timeouts/error sanitization;
- public/authenticated cache partitioning и Redis/KV data boundaries;
- public-link migrations/template rendering/custom logo;
- Service Worker cache boundaries;
- Application Kit: raw vacancy text must not enter generated schema, storage, public links, Redis/KV or API requests;
- leaks through logs, fixtures, screenshots, downloads or CI artifacts.

Подробности: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Safe testing

Используйте test accounts и synthetic resume/vacancy data. Не обращайтесь к чужим аккаунтам/private repositories/drafts/sessions и не создавайте нагрузку на GitHub/Vercel/Upstash.

## Disclosure

Report остаётся private до проверки impact и выпуска исправления. Fix должен получить relevant unit/browser/privacy regression coverage и пройти normal verified release workflow. Публичный release tag не создаётся до готовности disclosure.
