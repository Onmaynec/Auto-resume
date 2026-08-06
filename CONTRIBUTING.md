# Contributing to Auto Resume

Auto Resume принимает pull requests, если изменение не ломает четыре базовых свойства проекта: приватность пользовательских данных, RU/EN интерфейс, offline PWA и совместимость существующих drafts/public links.

Перед работой прочитайте [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Уязвимости не публикуются в обычных Issues — для них действует процесс из [`SECURITY.md`](SECURITY.md).

## Локальное окружение

В GitHub Actions используется Node.js 24.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

Quality server использует детерминированные fixtures и stubs. Не добавляйте туда production credentials, OAuth cookies, private repository data или реальные конфиденциальные резюме.

## Основные команды

| Команда | Что делает |
| --- | --- |
| `npm run check` | syntax-check production, API и quality scripts |
| `npm run docs:check` | проверка governance Markdown, ссылок, Issue Forms и security contacts |
| `npm test` | unit и integration tests |
| `npm run test:e2e` | Chromium flows и axe accessibility |
| `npm run test:lighthouse` | Lighthouse budgets |
| `npm run verify` | syntax, docs, tests и `git diff --check` |

Перед push запускайте `npm run verify`. Если изменение затрагивает UI, auth, sharing, export, browser storage, Service Worker или accessibility, прогоните и соответствующие browser tests.

## Где что находится

- `index.html`, `styles.css` и versioned CSS — browser shell;
- `app.js` — основная координация интерфейса;
- `js/*.mjs` — тестируемые модули приложения;
- `api/` — serverless GitHub/OAuth endpoints;
- `sw.js` — PWA cache и update lifecycle;
- `tests/*.test.mjs` — unit/integration contracts;
- `tests/e2e/` — Playwright и axe scenarios;
- `scripts/test-server.mjs` — локальные quality fixtures;
- `.github/workflows/` — CI и release automation.

Resume content должен оставаться независимым от presentation settings. DOCX, Markdown и TXT export не должны зависеть от выбранного visual template.

## Ветки и commits

Начинайте работу от актуального `main`.

Рекомендуемые имена веток:

- `feat/<short-description>`;
- `fix/<short-description>`;
- `docs/<short-description>`;
- `test/<short-description>`;
- `agent/<short-description>`.

Для commit subject используется стиль Conventional Commit:

```text
feat: add a resume section
fix: preserve locale in shared links
docs: update the OAuth threat model
test: cover an offline migration
chore: update release metadata
```

Не смешивайте в одном commit несвязанные refactors, generated artifacts и локальные credentials.

## Pull request workflow

Обычный путь изменения:

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

Перед merge:

1. Синхронизируйте ветку с последним `main`.
2. Заполните `.github/pull_request_template.md`.
3. Не выводите PR из draft, пока обязательные проверки заведомо падают.
4. Исправьте findings по tests, privacy, accessibility, Localization и compatibility.
5. Дождитесь успешных `verify`, `documentation`, `browser-e2e` и `lighthouse`.
6. После merge удалите ненужную ветку.

Для обычного релиза не создавайте tag вручную. Изменение версии, попавшее в `main`, запускает `.github/workflows/release.yml`.

Release PR должен синхронно обновить:

- `package.json`;
- `js/version.mjs`;
- `sw.js`;
- соответствующий `## vX.Y.Z` в `CHANGELOG.md`.

## Serverless API

Новый или изменённый endpoint в `api/` обязан:

- явно разрешать поддерживаемые HTTP methods и возвращать `405` для остальных;
- выставлять подходящие content type, cache, referrer, framing и sniffing headers;
- использовать осознанные cookie attributes `HttpOnly`, `Secure` и `SameSite`;
- защищать state-changing requests через same-origin и CSRF controls;
- сохранять OAuth `state` и PKCE validation;
- не писать в logs tokens, cookies, authorization codes, session identifiers, IP addresses, private profile data и resume content;
- использовать `no-store` для private/authenticated responses;
- ограничивать rate и timeout внешних запросов;
- возвращать стабильные очищенные error codes вместо upstream secrets.

Тесты должны покрывать методы, origin checks, cookie policy, redaction и failure behavior.

## Localization

Словари RU и EN в `js/i18n.mjs` должны иметь одинаковые keys.

При добавлении текста:

1. Добавьте обе локали.
2. Используйте `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label` или `t()`.
3. Не собирайте предложение из переводимых фрагментов.
4. Проверьте interpolation и fallback.
5. Запустите `npm run verify` и нужный browser scenario.

## PWA и APP_SHELL

Если в `index.html` появляется новый обязательный same-origin runtime file, добавьте его в `APP_SHELL` внутри `sw.js`.

При релизе также меняется `APP_VERSION`, чтобы появился новый cache namespace. `/api/*` кэшировать нельзя.

Изменения Service Worker проверяются как минимум в трёх состояниях: первая online installation, offline navigation reload и активация новой версии.

## Документация

Governance Markdown использует один H1, последовательные уровни headings и рабочие relative links.

Перед PR выполните:

```bash
npm run docs:check
```

Checker также проверяет Issue Forms и pull request template на предупреждения о секретах.

## Issues и security reports

Для обычного бага или feature request используйте structured Issue Forms и прикладывайте минимальный reproduction с synthetic data и redacted logs.

Не публикуйте access token, OAuth cookie, client secret, Redis credential, private repository data или confidential resume. Подозрение на уязвимость отправляйте через [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).