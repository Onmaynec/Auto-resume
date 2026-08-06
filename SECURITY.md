# Security Policy

Auto Resume работает с GitHub OAuth, serverless API, локальными черновиками резюме, public links и несколькими отдельными browser-storage подсистемами. Если вы нашли уязвимость, сообщайте о ней приватно и не прикладывайте реальные credentials или чужие данные к публичным материалам.

## Поддерживаемые версии

| Версия | Статус |
| --- | --- |
| 3.x | поддерживается |
| 2.x and earlier | не поддерживается |

Security fixes готовятся для актуального `main` и выпускаются новой SemVer-версией.

## Как сообщить об уязвимости

Используйте GitHub [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).

Не создавайте публичный Issue, если проблема может затрагивать безопасность или приватность.

В отчёт не нужно вставлять реальные:

- access tokens;
- OAuth cookie values;
- authorization codes;
- `SESSION_SECRET`;
- GitHub OAuth client secrets;
- Redis/KV credentials;
- private repository data;
- IP addresses;
- содержимое конфиденциального резюме или вакансии.

Хороший отчёт обычно содержит affected version/commit, затронутую страницу или endpoint, минимальный reproduction на synthetic data, ожидаемую и фактическую security boundary, impact и необходимые prerequisites.

## Что особенно важно проверять

К приоритетным областям относятся:

- OAuth Authorization Code Flow, PKCE и `state`;
- encrypted `HttpOnly`, `Secure`, `SameSite` session cookie;
- logout, GitHub grant revocation и session denylist;
- same-origin/CSRF защита state-changing requests;
- method allowlists, rate limiting, timeout и error sanitization в serverless API;
- разделение public cache и authenticated-self cache;
- гарантия, что OAuth tokens не сохраняются в Redis/KV;
- public resume parser и migrations старых ссылок;
- template rendering, URL sanitization и custom-logo privacy;
- Service Worker cache boundaries;
- отсутствие Tracker/Interview Prep data в public share, API, Redis/KV и analytics;
- утечки secrets через logs, fixtures, screenshots, artifacts или документацию.

Подробные trust boundaries описаны в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Что обычно не считается уязвимостью

Само по себе не является security issue:

- отображение информации, которая уже публична в GitHub-профиле;
- self-XSS, требующий вручную вставить код в DevTools;
- отсутствие необязательного best-practice header без реального impact;
- локальный denial of service, требующий нереалистичного ручного сценария;
- проблема только в неподдерживаемой версии без влияния на текущую 3.x.

Если такой случай всё же пересекает документированную security boundary, его стоит сообщить приватно.

## Правила безопасного тестирования

Используйте тестовые аккаунты и synthetic resume/vacancy data.

Не получайте доступ к чужим аккаунтам, private repositories, drafts, Tracker records, Prep sessions или OAuth sessions. Не создавайте нагрузку, которая может ухудшить работу GitHub, Vercel, Upstash или инфраструктуры репозитория.

Если во время проверки появляется риск реальной утечки, сохранения чужих данных или нарушения доступности, тест нужно остановить.

Автоматические scanners должны соблюдать rate limits и не загружать содержимое репозитория на недоверенные сторонние сервисы.

## Как проходит исправление

1. Maintainer проверяет отчёт приватно и определяет affected versions.
2. Fix готовится без публичного раскрытия деталей, при необходимости через private advisory fork или ограниченную ветку.
3. Добавляются unit, browser, privacy и regression tests.
4. Изменение проходит обычный verified release workflow.
5. Advisory публикуется после того, как исправленная версия доступна пользователям.

При желании автора отчёта можно указать в credits, если это безопасно и согласовано.

Публичный release tag не должен появляться до момента, когда исправление готово к раскрытию.