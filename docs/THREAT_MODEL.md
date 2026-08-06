# Threat model

Этот документ описывает границы безопасности Auto Resume 3.8. Он нужен в первую очередь разработчикам: какие данные считаются чувствительными, где они проходят и какие свойства нельзя сломать при изменениях.

## Что защищаем

К чувствительным данным относятся:

- GitHub OAuth access token;
- OAuth `state` и PKCE verifier во время авторизации;
- зашифрованная session cookie;
- GitHub OAuth client secret и `SESSION_SECRET` на стороне deployment;
- данные authenticated-self аналитики;
- локальные черновики резюме;
- записи Application Tracker и Interview Prep;
- текст вакансии и производные от него данные, если они могут раскрывать контекст пользователя.

Публичные данные GitHub-профиля сами по себе секретом не считаются, но смешивать public cache с authenticated-self ответами нельзя.

## Основные границы доверия

1. Браузер ↔ serverless API Auto Resume по HTTPS.
2. Serverless API ↔ GitHub OAuth/API.
3. Public profile requests ↔ authenticated-self requests.
4. OAuth session ↔ локальный workspace резюме.
5. Workspace ↔ отдельные локальные хранилища Application Tracker и Interview Prep.
6. Public read-only resume ↔ приватные локальные интерфейсы редактора, Audit, Tracker и Prep.
7. Serverless runtime ↔ Redis/KV, если внешнее хранилище включено.

Эти границы намеренные. Например, наличие активной OAuth-сессии не должно автоматически превращать локальный черновик или запись Tracker в серверные данные.

## OAuth и сессия

Авторизация использует Authorization Code Flow с PKCE S256 и проверкой `state`.

Access token не передаётся браузерному JavaScript. После обмена кода он хранится внутри зашифрованной AES-256-GCM session cookie с атрибутами `HttpOnly`, `Secure` и `SameSite=Lax`.

Scope ограничен `read:user`. Приложение не получает доступ к содержимому приватных репозиториев.

Для authenticated-self ответов используются отдельный cache namespace и `private, no-store`. Изменяющие состояние запросы требуют same-origin/CSRF-проверок и не должны попадать в Service Worker cache.

Logout удаляет локальную cookie. Disconnect дополнительно отзывает GitHub grant. При включённом Redis/KV может использоваться server-side denylist, где хранится только хэш `sid`, время отзыва и TTL до естественного истечения cookie.

## Данные резюме и вакансии

Текст вакансии анализируется в браузере. Serverless API не должен получать raw vacancy text.

Application Kit и Resume Quality Audit создаются из уже нормализованных структурированных данных. Они не сериализуются в workspace, public share, Redis/KV или analytics.

Публичная ссылка содержит только разрешённый read-only payload в URL fragment. Код, который разбирает публичную ссылку, обязан нормализовать схему и безопасно обрабатывать старые версии.

## Application Tracker

Tracker использует отдельный ключ `auto-resume:application-tracker:v1`.

Он может хранить компанию, роль, HTTPS-ссылку вакансии, статус, даты, заметки и ссылку на черновик по ID/имени. Содержимое резюме, Application Kit, Audit и raw vacancy text в запись не копируются.

Tracker не должен попадать в:

- public resume payload;
- workspace backup;
- GitHub API requests;
- OAuth session;
- Redis/KV;
- analytics или server logs.

CSV export обязан защищать значения от spreadsheet formula injection.

## Interview Prep

Interview Prep использует отдельный ключ `auto-resume:interview-prep:v1`.

Сессия может ссылаться на Application Tracker только через ограниченный набор полей: application ID, company и role. Notes, vacancy URL и полный tracker record не копируются.

Генератор вопросов получает нормализованные названия навыков и требований, missing skills и публичные названия проектов. Raw vacancy text и содержимое резюме входом генератора не являются.

Prep sessions не должны попадать в workspace backup, public share, API, Redis/KV или analytics.

## Redis/KV

Внешнее хранилище используется только для инфраструктурных задач: общего cache, rate limiting и опциональной session denylist.

Запрещено сохранять туда:

- OAuth access token;
- значение session cookie;
- raw vacancy text;
- содержимое резюме;
- Application Tracker records;
- Interview Prep sessions.

Rate-limit keys строятся из HMAC/хэша IP или session identifier, а не из исходного значения. Ошибка Redis/KV не должна возвращать клиенту credentials, storage keys или внутренние детали backend.

При недоступном внешнем хранилище приложение использует memory fallback. Переход в degraded mode не должен ослаблять границы между public и authenticated данными.

## Рендеринг и пользовательский ввод

Текстовые поля и данные GitHub должны экранироваться перед вставкой в HTML.

Ссылки проектов и вакансий принимают только HTTPS там, где это предусмотрено схемой. Template definitions являются данными и не могут приносить произвольный JavaScript, HTML, event handlers или внешние CSS URL.

Custom logo создаётся из локального `File` через временный `blob:` URL. Он не сериализуется в draft, backup или public share и не загружается на сервер.

## Service Worker

Service Worker кэширует versioned app shell, но не `/api/*`.

Изменения offline-логики должны сохранять следующие свойства:

- приватные API-ответы не попадают в Cache Storage;
- новая версия app shell получает новый namespace;
- обновление не активируется посреди работы пользователя без предусмотренного flow;
- удалённые из app shell приватные или устаревшие ресурсы не остаются доступными бесконечно.

## Логи и ошибки

В production logs нельзя писать access tokens, authorization codes, cookie values, client secrets, полные session identifiers, private profile data, raw vacancy text или содержимое резюме.

Клиент должен получать стабильные и очищенные error codes вместо текста upstream-ошибки с внутренними деталями.

## Остаточные риски

Зашифрованная stateless cookie остаётся bearer credential: если злоумышленник получит её целиком, она может быть использована до истечения или отзыва сессии. Риск уменьшают HTTPS, `HttpOnly`, `Secure`, `SameSite`, ограниченный TTL, logout/disconnect и опциональная denylist.

Доступность приложения зависит от GitHub OAuth/API, а при включённом shared cache — ещё и от внешнего Redis/KV. Memory fallback уменьшает влияние отказа хранилища, но не заменяет устойчивую production-инфраструктуру.

Локальные данные браузера исчезают при очистке site data. Для Tracker и Interview Prep предусмотрены отдельные JSON exports; пользователь должен сохранить их до очистки хранилища или переноса на другое устройство.

## При изменении чувствительного кода

Изменения OAuth, API, cookies, sharing, storage, Service Worker, templates, Tracker или Interview Prep должны сопровождаться тестом на соответствующую границу данных.

Минимальная проверка перед merge:

```bash
npm run verify
npm run test:e2e
```

Для изменений, влияющих на браузерную загрузку и PWA, дополнительно запускается:

```bash
npm run test:lighthouse
```