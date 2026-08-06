# Auto Resume 3.8

Auto Resume собирает GitHub-профиль в редактируемое RU/EN резюме и помогает пройти путь от анализа вакансии до подготовки к интервью. Версия 3.8 добавляет **Interview Prep Lab** рядом с локальным Application Tracker.

## Возможности

- GitHub profile/repository analysis и optional OAuth `read:user`;
- local vacancy matching;
- Application Kit;
- explainable Resume Quality Audit;
- Application Tracker;
- Interview Prep Lab;
- visual/ATS templates и local custom logo;
- DOCX, Markdown, TXT и PDF exports;
- drafts, autosave, JSON backup, public read-only links;
- PWA/offline shell, Redis/KV cache/rate limiting;
- governance, Playwright/axe/Lighthouse checks.

## Interview Prep Lab

Prep session хранится отдельно в:

```text
auto-resume:interview-prep:v1
```

Сессия содержит компанию, роль, локаль, дату интервью, небольшую reference на Application Tracker, skill/project/gap names, вопросы, ответы и STAR stories.

Связь с Tracker ограничена `application id`, `company` и `role`. Notes, vacancy URL и полный tracker record не копируются.

Вопросы детерминированно строятся по категориям `intro`, `technical`, `project`, `behavioral`, `gap`, `candidate`. Генератор получает normalized skill names, missing-skill names и public project names, но не raw vacancy text или resume content.

Ответы имеют completion state и self-rating 0–5. STAR bank хранит situation, task, action и result.

Readiness score 0–100 — локальная эвристика: answer coverage 45, self-rating confidence 25, complete STAR evidence 20 и interview planning 10. Это не прогноз найма.

Prep data не входит в workspace backup, public share, API, Redis/KV или analytics. Public read-only resumes не показывают Prep panel.

Подробности: [`docs/INTERVIEW_PREP.md`](docs/INTERVIEW_PREP.md).

## Остальные локальные инструменты

Tracker хранится отдельно и не копирует resume content. Application Kit и Audit остаются ephemeral. Их boundaries описаны в [`docs/APPLICATION_TRACKER.md`](docs/APPLICATION_TRACKER.md), [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md) и [`docs/RESUME_AUDIT.md`](docs/RESUME_AUDIT.md).

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
