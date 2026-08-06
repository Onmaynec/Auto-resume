# Auto Resume 3.7

Auto Resume превращает GitHub-профиль в редактируемое RU/EN резюме. В 3.7 к Application Kit и Resume Quality Audit добавляется **Application Tracker** — локальная воронка откликов без аккаунта приложения и внешней базы.

## Возможности

- GitHub profile/repository analysis и optional OAuth `read:user`;
- local vacancy matching;
- Application Kit;
- explainable Resume Quality Audit;
- Application Tracker;
- visual/ATS templates и local custom logo;
- DOCX, Markdown, TXT и PDF exports;
- drafts, autosave, JSON backup, public read-only links;
- PWA/offline shell, Redis/KV cache/rate limiting;
- governance, Playwright/axe/Lighthouse checks.

## Application Tracker

Запись хранит company, role, HTTPS vacancy URL, status, applied/follow-up dates, notes и optional reference на resume draft. Reference содержит только ID и name — содержимое резюме в tracker не копируется.

Статусы: `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn`. Follow-up сортируются по actionable priority: overdue → ближайшие дни → позже → без даты; terminal statuses не считаются overdue.

Tracker использует отдельный versioned storage key:

```text
auto-resume:application-tracker:v1
```

Он не входит в workspace backup, public share, API, Redis/KV или analytics. Public read-only resume не показывает tracker panel.

Доступны dedicated JSON import/export и CSV export с защитой от spreadsheet formula injection.

Подробности: [`docs/APPLICATION_TRACKER.md`](docs/APPLICATION_TRACKER.md).

## Другие локальные инструменты

Application Kit и Resume Quality Audit остаются отдельными ephemeral schemas. См. [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md) и [`docs/RESUME_AUDIT.md`](docs/RESUME_AUDIT.md).

## Запуск и проверка

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
npm run verify
npm run test:e2e
npm run test:lighthouse
```

## Лицензия

MIT © Onmaynec
