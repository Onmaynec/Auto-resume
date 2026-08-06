# Auto Resume 3.6

Auto Resume собирает GitHub-профиль в редактируемое RU/EN резюме. Версия 3.6 добавляет **Resume Quality Audit** — локальную объяснимую проверку текущего черновика без скрытой модели и без автоматического переписывания текста.

## Что есть в 3.6

- GitHub profile/repository analysis и optional OAuth `read:user`;
- local vacancy matching;
- Application Kit для отклика;
- Resume Quality Audit;
- versioned visual/ATS templates и local custom logo;
- DOCX, Markdown, TXT, Visual PDF, ATS PDF;
- drafts, autosave, backup, public read-only links;
- PWA/offline shell, Redis/KV cache/rate limiting;
- Playwright/axe/Lighthouse и governance checks.

## Resume Quality Audit

Audit оценивает четыре категории по 25 баллов: completeness, evidence, ATS readiness и readability. Он проверяет структуру черновика, HTTPS links, project descriptions, action verbs, metrics, объём, keyword coverage и читаемость.

Vacancy coverage строится только по извлечённым requirement names. Raw vacancy text audit engine не получает. Missing requirements не становятся утверждением об опыте.

Issue codes стабильны и локализуются отдельно. Audit report пересчитывается после ручного редактирования, но сам текст резюме не меняет.

Отчёт можно скопировать или сохранить локально как Markdown/TXT. Он не входит в drafts, backup, public share, API, Redis/KV или analytics.

Подробности: [`docs/RESUME_AUDIT.md`](docs/RESUME_AUDIT.md).

## Application Kit

Application Kit из 3.5 остаётся browser-only и использует normalized vacancy analysis без raw vacancy text. См. [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md).

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

## Документация

Технические boundaries описаны в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md), browser workflow — в [`docs/QUALITY.md`](docs/QUALITY.md), templates — в [`docs/TEMPLATES.md`](docs/TEMPLATES.md).

## Лицензия

MIT © Onmaynec
