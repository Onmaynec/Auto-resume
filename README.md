# Auto Resume

Auto Resume собирает данные GitHub-профиля в редактируемое резюме и помогает пройти весь путь от разбора вакансии до подготовки к интервью. Интерфейс работает на русском и английском, а данные, которым не нужен сервер, остаются в браузере.

Текущая версия — **3.8.0**.

## Что умеет приложение

### Резюме из GitHub-профиля

Auto Resume загружает публичные данные профиля и репозиториев, показывает вклад по языкам и позволяет выбрать проекты, которые попадут в резюме. После генерации текст можно править вручную.

Для собственного аккаунта можно подключить GitHub OAuth с минимальным scope `read:user`. Это даёт доступ к персональной статистике, но не к содержимому приватных репозиториев.

### Работа с вакансией

Текст вакансии анализируется локально. Из него извлекаются требования, после чего приложение сравнивает их с данными профиля и выбранными проектами.

На этом результате работают четыре отдельные функции:

- **Application Kit** — сопроводительное письмо, подсказки по доказательствам опыта, честный gap plan и вопросы к интервью;
- **Resume Quality Audit** — объяснимый аудит полноты, доказательности, ATS-readiness и читаемости резюме;
- **Application Tracker** — локальная воронка откликов со статусами и follow-up датами;
- **Interview Prep Lab** — вопросы, ответы, self-rating, STAR-истории и локальный readiness score.

Отсутствующий навык не превращается в «опыт» автоматически. Если требование не подтверждено, оно остаётся пробелом, который нужно объяснить или закрыть.

## Редактор и экспорт

Резюме можно оформить одним из встроенных шаблонов:

- `visual-classic`;
- `visual-studio`;
- `visual-minimal`;
- `ats-basic`.

Визуальные настройки отделены от содержимого резюме. Доступны системные шрифты, плотность, интервалы, акцентный цвет и локальный логотип. Пользовательский логотип создаётся как временный `blob:` URL и не загружается на сервер.

Поддерживаются:

| Формат | Для чего подходит |
| --- | --- |
| DOCX | дальнейшее редактирование и отправка |
| Markdown | GitHub, портфолио и ручная правка |
| TXT | простой переносимый текст |
| Visual PDF | презентационная версия |
| ATS PDF | одноколоночная версия с выделяемым текстом |
| Application Kit Markdown/TXT | сохранение пакета отклика |
| Audit Markdown/TXT | сохранение результатов проверки |
| Tracker JSON/CSV | резервная копия и анализ откликов |
| Interview Prep JSON/Markdown | перенос подготовки к интервью |

Также можно создать публичную read-only ссылку на резюме.

## Где хранятся данные

В проекте специально разделены данные с разным уровнем приватности.

- Черновики, настройки и история профилей хранятся локально в workspace.
- Текст вакансии обрабатывается в браузере и не отправляется в API.
- Application Kit и Resume Quality Audit живут только в памяти вкладки, если пользователь сам их не экспортировал.
- Application Tracker хранится отдельно в `auto-resume:application-tracker:v1`.
- Interview Prep Lab хранится отдельно в `auto-resume:interview-prep:v1`.
- Tracker и Interview Prep не попадают в публичные ссылки, workspace backup, Redis/KV или analytics.
- Public resume использует URL fragment и открывается в режиме только для чтения.

OAuth-сессия устроена отдельно от этих данных. Access token шифруется на серверной стороне и хранится только в `HttpOnly`, `Secure`, `SameSite=Lax` cookie; браузерный JavaScript сам token не получает.

Подробная модель угроз описана в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## PWA и offline-режим

Auto Resume устанавливается как PWA. Основные интерфейсные модули входят в versioned app shell Service Worker.

После первой успешной загрузки локальная работа с уже доступными данными, редактором, Tracker и Interview Prep продолжает работать offline. `/api/*` Service Worker не кэширует.

При появлении новой версии приложение загружает обновлённый app shell в фоне и применяет его после подтверждения пользователя.

## Локальный запуск

Для разработки нужен Node.js и Chromium для браузерных тестов.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

`test-server` поднимает локальное окружение с детерминированными заглушками, поэтому для обычной проверки интерфейса не нужны реальные OAuth credentials.

## Переменные окружения

Для serverless GitHub API нужен токен:

```text
GITHUB_TOKEN=...
```

Для OAuth используются значения из `.env.example`:

```text
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://example.com/api/auth/callback
SESSION_SECRET=случайная_строка_не_короче_32_символов
```

Redis/KV необязателен. Если он настроен, приложение использует общий cache, rate limiting и при необходимости session denylist. Поддерживаются переменные Upstash и совместимые `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Без внешнего хранилища используется memory fallback.

## Проверка проекта

```bash
npm run check
npm run docs:check
npm test
npm run test:e2e
npm run test:lighthouse
npm run verify
```

`npm run verify` выполняет syntax checks, проверку документации, unit/integration tests и `git diff --check`. Playwright и Lighthouse запускаются отдельными командами, потому что требуют браузерного окружения.

Тесты покрывают локализацию RU/EN, OAuth и session boundaries, Redis/KV, экспорт, PWA lifecycle, шаблоны, Application Kit, Resume Quality Audit, Application Tracker, Interview Prep, accessibility и основные browser flows.

## Документация

| Документ | Содержание |
| --- | --- |
| [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md) | генерация пакета отклика и границы данных |
| [`docs/RESUME_AUDIT.md`](docs/RESUME_AUDIT.md) | правила и scoring Resume Quality Audit |
| [`docs/APPLICATION_TRACKER.md`](docs/APPLICATION_TRACKER.md) | схема, импорт/экспорт и follow-up логика Tracker |
| [`docs/INTERVIEW_PREP.md`](docs/INTERVIEW_PREP.md) | сессии подготовки, STAR и readiness model |
| [`docs/TEMPLATES.md`](docs/TEMPLATES.md) | шаблоны, presentation schema и custom logo |
| [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) | OAuth, API, storage и основные trust boundaries |
| [`CHANGELOG.md`](CHANGELOG.md) | история версий |

## Участие в разработке

Правила веток, pull request workflow и требования к проверкам находятся в [`CONTRIBUTING.md`](CONTRIBUTING.md). Общие правила общения — в [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Уязвимости не нужно публиковать в Issues. Для них есть процесс из [`SECURITY.md`](SECURITY.md).

## Релизы

Версия синхронизируется между `package.json`, `js/version.mjs`, `sw.js` и `CHANGELOG.md`. После изменения версии в `main` release workflow проверяет метаданные, создаёт тег `vX.Y.Z` и публикует GitHub Release.

## Лицензия

MIT © Onmaynec