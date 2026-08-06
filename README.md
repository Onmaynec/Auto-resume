# Auto Resume 3.4

Auto Resume превращает GitHub-профиль в редактируемое RU/EN резюме. Версия 3.4 не меняет основной resume engine: её задача — сделать разработку проекта предсказуемой через нормальные правила участия, security reporting и документационные проверки.

## Что умеет приложение

- анализировать публичный GitHub-профиль и репозитории;
- подключать OAuth `read:user` для собственной contribution statistics;
- локально разбирать требования вакансии;
- сравнивать профили, выбирать проекты и редактировать результат;
- работать на русском и английском;
- экспортировать DOCX, Markdown, TXT, Visual PDF и ATS PDF;
- хранить drafts/autosave/backup в браузере;
- создавать public read-only links;
- работать как PWA с offline shell;
- использовать versioned visual/ATS templates и локальный custom logo;
- использовать Redis/KV для shared cache/rate limiting без хранения резюме или OAuth token.

## Что изменилось в 3.4

В репозитории появились единые правила для Issues, pull requests, security reports и releases. Blank Issues отключены; баги и предложения создаются через structured Issue Forms, а уязвимости направляются в private GitHub Security Advisories.

Документация теперь проверяется командой `npm run docs:check`: checker контролирует структуру Markdown, относительные ссылки, Issue Forms, security contacts и обязательные governance contracts.

Основные документы:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — setup, ветки, PR workflow и технические правила;
- [`SECURITY.md`](SECURITY.md) — поддерживаемые версии и private reporting;
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — правила участия;
- [`docs/TEMPLATES.md`](docs/TEMPLATES.md) — presentation/template contracts;
- [`docs/QUALITY.md`](docs/QUALITY.md) — Playwright/axe/Lighthouse workflow;
- [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) — OAuth, Redis/KV и renderer boundaries.

## Локальный запуск

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

## Проверка

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

`npm run verify` включает syntax, documentation, unit/integration и whitespace checks. Browser suites запускаются отдельно.

## Приватность

Resume content, vacancy text и local logo не должны попадать в serverless cache, logs или test artifacts. OAuth token остаётся недоступным browser JavaScript. Для тестов используются synthetic fixtures.

## История версий

См. [`CHANGELOG.md`](CHANGELOG.md).

## Лицензия

MIT © Onmaynec
