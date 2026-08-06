# Auto Resume 3.9

Auto Resume собирает GitHub-профиль в редактируемое RU/EN резюме и сопровождает локальный процесс от vacancy matching до сравнения полученных офферов. Версия 3.9 добавляет **Offer Decision Lab** поверх Application Tracker и Interview Prep.

## Возможности

- GitHub profile/repository analysis и optional OAuth `read:user`;
- local vacancy matching;
- Application Kit и explainable Resume Quality Audit;
- Application Tracker и Interview Prep Lab;
- Offer Decision Lab;
- visual/ATS templates и local custom logo;
- DOCX, Markdown, TXT и PDF exports;
- drafts, autosave, backup и public read-only links;
- PWA/offline shell, Redis/KV cache/rate limiting;
- governance и browser quality checks.

## Offer Decision Lab

Offer records хранятся отдельно:

```text
auto-resume:offer-lab:v1
```

Оффер может быть связан с Tracker только через application ID, company и role. Tracker notes, vacancy URL, resume draft, Application Kit, Audit report и Interview Prep answers в Offer Lab не копируются.

Матрица использует семь критериев: compensation, growth, team, product, work-life, stability и flexibility. Для каждого пользователь задаёт rating и weight 0–5.

Итоговый score 0–100 состоит из weighted fit и risk penalty. Каждый red flag снимает 3 балла, но общий penalty ограничен 18. Если все weights равны нулю, используется равный вес критериев.

First-year package считается как base + bonus + annual equity + sign-on + benefits − commute cost. Валюты не конвертируются; суммы корректно сравнивать только внутри одной валюты.

Deadline states рассчитываются локально: expired, urgent (до 3 дней), soon (до 7 дней), scheduled или none. Offer Lab не создаёт notifications или calendar events.

Score — персональная decision aid, а не прогноз job satisfaction, career success или employer quality.

Подробности: [`docs/OFFER_LAB.md`](docs/OFFER_LAB.md).

## Privacy

Offer Lab не входит в workspace backup, resume drafts, public share, GitHub/OAuth requests, Redis/KV, analytics, Kit/Audit или Interview Prep. Public read-only mode скрывает Offer Lab panel.

Dedicated JSON нужен перед очисткой site data. Markdown/JSON exports создаются локально.

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
