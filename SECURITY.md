# Security Policy

Auto Resume работает с GitHub OAuth, serverless API, Redis/KV, локальными resume drafts и public links. Уязвимости нужно сообщать приватно; реальные credentials и чужие данные не должны попадать в Issues, PR, screenshots или logs.

## Поддерживаемые версии

| Версия | Статус |
| --- | --- |
| 3.x | поддерживается |
| 2.x and earlier | не поддерживается |

Security fixes готовятся для актуального `main` и выпускаются новой SemVer-версией.

## Как сообщить об уязвимости

Используйте GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).

Не создавайте публичный Issue для потенциальной security/privacy проблемы. Не прикладывайте реальные access tokens, OAuth cookies, authorization codes, `SESSION_SECRET`, OAuth client secret, Redis credentials, private repository data, IP addresses или confidential resume content.

Полезный отчёт содержит affected version/commit, затронутый endpoint/page/storage boundary, минимальный reproduction на synthetic data, expected/observed behavior, impact и prerequisites.

## Приоритетные области

- OAuth Authorization Code Flow, PKCE и `state`;
- encrypted `HttpOnly`, `Secure`, `SameSite` session cookie;
- logout, grant revocation и optional session denylist;
- same-origin/CSRF защита state-changing requests;
- API method allowlists, headers, rate limiting, timeout и sanitized errors;
- разделение public/authenticated cache и отсутствие OAuth token в Redis/KV;
- public-link parsing и migrations;
- template rendering, URL sanitization и local-logo privacy;
- Service Worker cache boundaries/update activation;
- утечки secrets через fixtures, artifacts, screenshots или documentation.

Подробные boundaries находятся в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Что обычно не является уязвимостью

Публичные данные уже открытого GitHub-профиля, self-XSS через DevTools, отсутствие необязательного header без demonstrated impact и локальный DoS без реалистичного сценария сами по себе не считаются security issue. Если такой случай пересекает документированную boundary, сообщите его приватно.

## Безопасное тестирование

Используйте test accounts и synthetic resume data. Не получайте доступ к чужим аккаунтам, private repositories, drafts или sessions. Не создавайте нагрузку, способную ухудшить GitHub, Vercel, Upstash или инфраструктуру проекта.

Автоматические scanners должны соблюдать rate limits и не выгружать repository contents на недоверенные сторонние сервисы.

## Исправление и disclosure

1. Report проверяется приватно.
2. Fix готовится без публичного раскрытия деталей.
3. Добавляются relevant unit/browser/privacy regression tests.
4. Изменение проходит verified release workflow.
5. Advisory публикуется после доступности исправленной версии.

Публичный release tag не должен появляться до готовности fix к disclosure.
