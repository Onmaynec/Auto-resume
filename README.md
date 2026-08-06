# Auto Resume 3.2 — browser quality branch

Auto Resume превращает GitHub-профиль в редактируемое RU/EN резюме, умеет локально анализировать вакансию, экспортировать результат и работать как PWA. Эта ветка основана на **3.2.0** и добавляет полноценные браузерные quality gates без изменения номера релиза.

## Возможности 3.2

- анализ публичного GitHub-профиля и репозиториев;
- опциональный OAuth `read:user` для собственной private/internal contribution statistics;
- локальный анализ вакансии и сравнение профилей;
- выбор/сортировка проектов и ручное редактирование резюме;
- RU/EN интерфейс;
- DOCX, Markdown, TXT, Visual PDF и ATS PDF;
- локальные drafts, autosave и JSON backup;
- публичные read-only ссылки;
- PWA/offline app shell и обновления через GitHub Releases;
- Redis/KV cache, distributed rate limiting и optional session denylist.

## Что проверяет эта ветка

Помимо быстрых source/unit checks добавлены два независимых браузерных слоя:

- Playwright + Chromium для пользовательских сценариев и axe accessibility audits;
- Lighthouse CI для performance, accessibility, best-practices и SEO budgets.

Тестовый сервер использует локальные deterministic fixtures и stubs, поэтому проверки не зависят от сторонних CDN и не требуют production credentials.

Подробная схема находится в [`docs/QUALITY.md`](docs/QUALITY.md).

## Приватность

Текст вакансии, черновики и exports обрабатываются локально. OAuth access token не доступен browser JavaScript и хранится в зашифрованной `HttpOnly`, `Secure`, `SameSite=Lax` cookie.

Redis/KV не получает OAuth token, содержимое резюме или текст вакансии. Подробности — в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Локальный запуск

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

## Проверки

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
npm run test:quality
```

`npm run verify` оставлен быстрым и не запускает Chromium/Lighthouse. Это позволяет сразу отличать ошибки исходников и unit tests от browser-only regressions.

## Развёртывание

Для GitHub GraphQL нужен `GITHUB_TOKEN`. OAuth и Redis/KV настраиваются переменными из `.env.example`. Без Redis приложение переходит на memory fallback.

## История версий

Релизная история находится в [`CHANGELOG.md`](CHANGELOG.md). Browser quality gates этой ветки пока не меняют версию 3.2.0.

## Лицензия

MIT © Onmaynec
