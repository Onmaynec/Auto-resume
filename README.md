# Auto Resume 3.3

Auto Resume собирает данные GitHub-профиля в редактируемое RU/EN резюме. Версия 3.3 отделяет содержимое резюме от его оформления: визуальный шаблон можно менять, не затрагивая текст и не ломая текстовые exports.

## Основные возможности

- анализ публичного GitHub-профиля и репозиториев;
- опциональный OAuth `read:user` для собственной contribution statistics;
- локальный анализ вакансии и сравнение профилей;
- выбор проектов и ручное редактирование;
- RU/EN интерфейс;
- DOCX, Markdown, TXT, Visual PDF и ATS PDF;
- drafts, autosave, JSON backup и публичные read-only ссылки;
- PWA/offline app shell и контролируемое автообновление;
- Redis/KV cache, distributed rate limiting и optional session denylist;
- Playwright/axe и Lighthouse quality gates.

## Шаблоны 3.3

Встроены четыре template ID:

- `visual-classic`;
- `visual-studio`;
- `visual-minimal`;
- `ats-basic`.

Presentation settings хранятся отдельно от resume content. Схема содержит версию, template ID/version, акцент, системный шрифт, плотность и интервалы. Неизвестные или несовместимые значения переходят на безопасный fallback.

Custom logo выбирается локально и отображается через временный `blob:` URL. Он не попадает в drafts, backup или public share.

Template catalog принимает только data definitions и не исполняет сторонний JavaScript/HTML/CSS. Новый renderer всё равно требует обычного изменения исходного кода.

Подробности: [`docs/TEMPLATES.md`](docs/TEMPLATES.md).

## Приватность и OAuth

Текст вакансии и содержимое резюме не отправляются в Redis/KV. OAuth access token хранится в зашифрованной `HttpOnly`, `Secure`, `SameSite=Lax` cookie и не доступен browser JavaScript.

Модель угроз: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Локальный запуск

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

## Проверка

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
```

Browser quality workflow описан в [`docs/QUALITY.md`](docs/QUALITY.md).

## История версий

Список релизных изменений находится в [`CHANGELOG.md`](CHANGELOG.md).

## Лицензия

MIT © Onmaynec
