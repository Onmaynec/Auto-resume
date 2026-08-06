# Auto Resume 3.5

Auto Resume собирает GitHub-профиль в редактируемое RU/EN резюме. Версия 3.5 добавляет **Application Kit** — локальный пакет для отклика, который строится из уже нормализованного результата анализа вакансии.

## Основные возможности

- GitHub profile/repository analysis;
- optional OAuth `read:user` для собственной contribution statistics;
- локальный vacancy matching;
- редактируемое RU/EN резюме и versioned visual/ATS templates;
- DOCX, Markdown, TXT, Visual PDF и ATS PDF;
- drafts, autosave, JSON backup и public read-only links;
- PWA/offline shell, verified updates, Redis/KV cache/rate limiting;
- Playwright/axe/Lighthouse quality gates;
- structured contribution/security workflow.

## Application Kit

После vacancy matching приложение может построить:

- сопроводительное письмо;
- evidence prompts по подтверждённым навыкам и публичным проектам;
- gap plan для неподтверждённых требований;
- вопросы для интервью.

Доступны `concise`, `balanced` и `detailed`. Missing skills не превращаются в заявления об опыте. Project links проходят HTTPS allowlist.

Исходный vacancy text не передаётся генератору пакета. Application Kit не входит в drafts, backup, public share или serverless requests и исчезает после reload, если пользователь сам не сохранил Markdown/TXT.

Подробности: [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md).

## Приватность

OAuth token остаётся в encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Resume/vacancy content не хранится в Redis/KV. Application Kit работает в браузере без `fetch`, `localStorage` и `sessionStorage`.

См. [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

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

## Документация

- [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md) — generation/privacy contract;
- [`docs/TEMPLATES.md`](docs/TEMPLATES.md) — presentation system;
- [`docs/QUALITY.md`](docs/QUALITY.md) — browser quality workflow;
- [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SECURITY.md`](SECURITY.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — governance.

## Лицензия

MIT © Onmaynec
