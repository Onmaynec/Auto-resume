# Contributing to Auto Resume

Изменения должны сохранять privacy boundaries, RU/EN интерфейс, offline PWA и совместимость существующих drafts/public links. В 3.5 к этим контрактам добавляется Application Kit: raw vacancy text не должен попадать в его schema/storage/API.

Перед работой прочитайте [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Уязвимости отправляются по процессу [`SECURITY.md`](SECURITY.md), не в public Issue.

## Окружение

CI использует Node.js 24.

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

Используйте только synthetic fixtures; production credentials, OAuth cookies, private repository data и confidential resume/vacancy content в tests не допускаются.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run check` | syntax checks |
| `npm run docs:check` | governance Markdown/links/forms contracts |
| `npm test` | unit/integration tests |
| `npm run test:e2e` | Chromium + axe |
| `npm run test:lighthouse` | Lighthouse budgets |
| `npm run verify` | syntax + docs + tests + `git diff --check` |

## Ветки и commits

Работайте от актуального `main` в `feat/*`, `fix/*`, `docs/*`, `test/*` или `agent/*`. Commit subjects используют стиль Conventional Commit.

## Pull request workflow

```text
branch → pull request → CI → main → release workflow → branch cleanup
```

До merge исправьте findings по tests, privacy, accessibility, Localization и compatibility. Обязательные jobs: `verify`, `documentation`, `browser-e2e`, `lighthouse`.

Release PR синхронно меняет `package.json`, `js/version.mjs`, `sw.js` и `CHANGELOG.md`; обычный tag вручную не создаётся.

## Serverless API

Endpoints должны ограничивать methods, выставлять security/cache headers, использовать cookie attributes `HttpOnly`, `Secure`, `SameSite`, защищать state-changing requests через same-origin и CSRF controls, сохранять PKCE/`state`, применять rate limits/timeouts и не логировать credentials/private content.

## Application Kit

`js/application-kit.mjs` получает только normalized requirement names/profile metadata. Raw vacancy text не является входом kit generator. Missing skills нельзя превращать в опыт. UI не должен добавлять `fetch`, `localStorage` или `sessionStorage`.

При изменениях Kit проверьте RU/EN output, HTTPS-only links, clipboard/export и privacy assertions.

## Localization

RU и EN dictionaries должны иметь одинаковые keys. Новый текст добавляется сразу в обе локали через `data-i18n*` или `t()`.

## PWA и APP_SHELL

Новый обязательный same-origin runtime file добавляется в `APP_SHELL`; release меняет `APP_VERSION`. `/api/*` кэшировать нельзя. Application Kit modules/CSS также должны оставаться доступны offline.

## Документация

```bash
npm run docs:check
```

Один H1, последовательные headings и рабочие relative links обязательны.

## Security reports

Не публикуйте access token, OAuth cookie, client secret, Redis credential, private repository data или confidential resume. Используйте [private vulnerability reporting](https://github.com/Onmaynec/Auto-resume/security/advisories/new).
