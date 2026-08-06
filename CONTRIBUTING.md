# Contributing to Auto Resume

Auto Resume принимает изменения, если они не ломают четыре базовых свойства проекта: privacy boundaries, RU/EN интерфейс, offline PWA и совместимость существующих drafts/public links.

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

Quality server использует synthetic fixtures и deterministic stubs. Не добавляйте туда production credentials, OAuth cookies, private repository data или реальные конфиденциальные резюме.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run check` | syntax-check production/API/quality scripts |
| `npm run docs:check` | governance Markdown, links, Issue Forms и security contacts |
| `npm test` | unit/integration tests |
| `npm run test:e2e` | Chromium user flows и axe |
| `npm run test:lighthouse` | Lighthouse budgets |
| `npm run verify` | syntax + documentation + tests + `git diff --check` |

Перед push запускайте `npm run verify`. Browser suite обязателен для UI, OAuth, exports, sharing, browser storage, Service Worker и accessibility changes.

## Структура проекта

- `index.html`, CSS и `app.js` — browser shell и координация приложения;
- `js/*.mjs` — локализация, share/workspace, templates, OAuth state, updates и exports;
- `api/` — serverless GitHub/OAuth endpoints;
- `sw.js` — offline app shell и update lifecycle;
- `tests/*.test.mjs` — unit/integration contracts;
- `tests/e2e/` — Playwright/axe scenarios;
- `scripts/test-server.mjs` — deterministic browser fixtures;
- `.github/workflows/` — CI и release automation.

Resume content должен оставаться независимым от presentation settings. DOCX, Markdown и TXT не должны зависеть от visual template.

## Ветки и commits

Начинайте от актуального `main`. Используйте понятные ветки: `feat/*`, `fix/*`, `docs/*`, `test/*` или `agent/*`.

Commit subjects оформляются в стиле Conventional Commit, например:

```text
feat: add resume section
fix: preserve locale in shared links
docs: update threat model
test: cover offline migration
chore: update release metadata
```

Не смешивайте несвязанные refactors, generated artifacts и локальные credentials в одном PR.

## Pull request workflow

Обычный путь изменения:

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

Перед merge:

1. Синхронизируйте ветку с `main`.
2. Заполните `.github/pull_request_template.md`.
3. Держите PR в draft, пока обязательные проверки падают.
4. Исправьте findings по tests, privacy, accessibility, Localization и compatibility.
5. Дождитесь успешных `verify`, `documentation`, `browser-e2e` и `lighthouse`.
6. После merge удалите ненужную ветку.

Обычный release tag вручную не создаётся. Version change в `main` запускает `.github/workflows/release.yml`. Release PR должен синхронно обновить `package.json`, `js/version.mjs`, `sw.js` и соответствующий `## vX.Y.Z` в `CHANGELOG.md`.

## Serverless API

Новый или изменённый endpoint должен явно ограничивать HTTP methods, выставлять подходящие security/cache headers, использовать осознанные cookie attributes `HttpOnly`, `Secure`, `SameSite`, защищать state-changing requests через same-origin и CSRF controls и сохранять PKCE/`state` validation.

Нельзя писать в logs tokens, cookies, authorization codes, session identifiers, IP addresses, private profile data или resume content. Private/authenticated responses используют `no-store`; внешние requests должны иметь rate limits/timeouts и sanitized errors.

## Localization

RU и EN dictionaries должны иметь одинаковые keys. Новый интерфейсный текст добавляется сразу в обе локали через `data-i18n*` или `t()`, без склейки переводимых фрагментов.

## PWA и APP_SHELL

Если `index.html` начинает зависеть от нового same-origin runtime file, добавьте его в `APP_SHELL` внутри `sw.js`. При release меняется `APP_VERSION`. `/api/*` кэшировать нельзя.

Проверяйте первую online installation, offline navigation reload и активацию новой версии.

## Документация

Governance Markdown использует один H1, последовательные heading levels и рабочие relative links.

```bash
npm run docs:check
```

Checker также проверяет, что Issue Forms и pull request template предупреждают о secrets.

## Issues и security reports

Обычный bug/feature request создаётся через structured Issue Forms с synthetic data и redacted logs.

Не публикуйте access token, OAuth cookie, client secret, Redis credential, private repository data или confidential resume. Подозрение на уязвимость отправляйте через [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
