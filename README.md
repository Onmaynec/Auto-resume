# ✨ Auto Resume v3.9

> GitHub-профиль превращается в адаптированное резюме, локальный пакет отклика, объяснимый ATS-аудит, приватную воронку, пространство подготовки к интервью и матрицу сравнения офферов на русском или английском языке.

## 💼 Что нового в v3.9

- добавлен полностью локальный **Offer Decision Lab** после Application Tracker и Interview Prep;
- оффер связывается с откликом только через application ID, company и role;
- матрица решения использует compensation, growth, team, product, work-life, stability и flexibility;
- каждый критерий получает пользовательские rating и weight 0–5;
- итоговая оценка 0–100 объясняется weighted fit и ограниченным risk penalty;
- first-year package учитывает base, bonus, annual equity, sign-on, benefits и commute cost;
- валюты не конвертируются и сравниваются только внутри исходной валюты;
- доступны дедлайны, urgent states, карточки, comparison table и Markdown/JSON export;
- Offer Lab data не входит в public share, workspace backup, API, Redis/KV или analytics;
- public read-only resume не показывает Offer Lab panel;
- engine, UI и CSS входят в offline PWA app shell.

Схема, scoring model и privacy boundary описаны в [`docs/OFFER_LAB.md`](docs/OFFER_LAB.md).

## 🎤 Что нового в v3.8

- добавлен полностью локальный **Interview Prep Lab** рядом с Application Tracker;
- сессия связывается с откликом только через application ID, company и role;
- RU/EN вопросы детерминированно строятся из matched skill names, missing skill names и публичных project names;
- доступны категории `intro`, `technical`, `project`, `behavioral`, `gap` и `candidate`;
- ответы редактируются локально, поддерживаются completion state и self-rating 0–5;
- добавлен банк STAR-историй с situation, task, action и result;
- readiness score 0–100 объясняется answer coverage, confidence, STAR evidence и interview planning;
- поддерживаются versioned JSON import/export и локальный Markdown export;
- исходный vacancy text, resume content, Application Kit и audit report в prep schema не входят;
- prep data не входит в public share, workspace backup, API, Redis/KV или analytics;
- public read-only resume не показывает Interview Prep panel;
- engine, UI и CSS входят в offline PWA app shell;
- добавлены unit, privacy contract и Chromium/axe tests.

Схема, readiness model и privacy boundary описаны в [`docs/INTERVIEW_PREP.md`](docs/INTERVIEW_PREP.md).

## 🗂️ Что нового в v3.7

- добавлен полностью локальный **Application Tracker** рядом с workspace;
- записи содержат компанию, роль, HTTPS-ссылку, статус, дату отклика, follow-up, заметки и optional draft reference;
- доступны этапы `saved`, `applied`, `screening`, `interview`, `offer`, `rejected` и `withdrawn`;
- просроченные и ближайшие follow-up автоматически поднимаются вверх;
- есть поиск, фильтры, статистика и быстрое изменение статуса;
- связь с резюме хранит только ID и название черновика, а не его содержимое;
- поддерживаются versioned JSON import/export и защищённый CSV export;
- tracker data не входит в public share, workspace backup, API, Redis/KV или analytics;
- public read-only resume не показывает tracker panel;
- engine, UI и CSS входят в offline PWA app shell;
- добавлены unit, privacy contract и Chromium/axe tests.

Схема, import/export и privacy boundary описаны в [`docs/APPLICATION_TRACKER.md`](docs/APPLICATION_TRACKER.md).

## 🔎 Что нового в v3.6

- после генерации резюме появляется локальная панель **Resume Quality Audit**;
- итоговый score 0–100 объясняется категориями completeness, evidence, ATS readiness и readability;
- проверяются headline, контакты, summary, навыки, проекты, HTTPS-ссылки, метрики, глаголы действия и повторяемость;
- vacancy matching использует только извлечённые названия требований, а не исходный текст вакансии;
- стабильные issue codes объясняют каждый deduction;
- отчёт пересчитывается после редактирования, но никогда не изменяет резюме автоматически;
- отчёт копируется и локально экспортируется в Markdown/TXT;
- audit report не входит в drafts, backup, public share, API или analytics.

Подробности: [`docs/RESUME_AUDIT.md`](docs/RESUME_AUDIT.md).

## 📬 Что нового в v3.5

- локальный RU/EN Application Kit после анализа вакансии;
- cover letter, evidence prompts, gap plan и вопросы для интервью;
- варианты тона `concise`, `balanced` и `detailed`;
- редактирование, clipboard и Markdown/TXT export;
- missing skills не выдаются за имеющийся опыт;
- исходный vacancy text не сохраняется и не отправляется на сервер.

Подробности: [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md).

## 🚀 Возможности

- анализ публичного GitHub-профиля и репозиториев;
- contribution heatmap и история языков;
- опциональный OAuth `read:user` для собственных private/internal contributions;
- локальный анализ требований вакансии;
- локальный Application Kit;
- локальный Resume Quality Audit;
- локальный Application Tracker;
- локальный Interview Prep Lab;
- локальный Offer Decision Lab;
- сравнение GitHub-профилей;
- выбор и сортировка проектов;
- редактируемые RU/EN резюме;
- visual-шаблоны и ATS renderer;
- локальный custom logo без загрузки;
- DOCX, Markdown, TXT, Visual PDF и ATS PDF;
- публичные read-only ссылки;
- PWA, offline app shell и безопасное автообновление;
- локальные drafts, autosave и JSON backup;
- light, dark и system themes.

## 💼 Offer Decision Lab

Offer Lab использует отдельный versioned storage key:

```text
auto-resume:offer-lab:v1
```

Каждый оффер хранит только allowlisted поля: company, role, минимальную application reference, исходную currency, компоненты compensation, work model, contract type, decision deadline, ratings, weights, red flags и notes.

Матрица нормализует пользовательские оценки в score 0–100. Каждый красный флаг уменьшает результат на три пункта, но общий risk penalty ограничен 18 пунктами. Это инструмент личного выбора, а не прогноз качества работодателя или карьерного успеха.

First-year package рассчитывается локально:

```text
base + bonus + annual equity + sign-on + benefits - commute cost
```

Приложение не запрашивает exchange rates и не конвертирует валюты. JSON import объединяет duplicate IDs по наиболее новому `updatedAt`; Markdown export сохраняет исходные валюты и объяснение score.

## 🎤 Interview Prep Lab

Prep Lab использует отдельный versioned storage key:

```text
auto-resume:interview-prep:v1
```

Сессия содержит только allowlisted структурированные данные:

```json
{
  "company": "Acme",
  "role": "Frontend Engineer",
  "locale": "ru",
  "interviewDate": "2026-08-12",
  "application": {
    "id": "application-id",
    "company": "Acme",
    "role": "Frontend Engineer"
  },
  "skills": ["JavaScript", "Accessibility"],
  "projects": ["resume-engine"],
  "gaps": ["Kubernetes"],
  "questions": [],
  "stories": []
}
```

Связь с откликом хранит только ID, компанию и роль. Notes, vacancy URL и полный tracker record не копируются.

Генератор получает только подтверждённые или введённые пользователем skill names, отдельные missing skill names и публичные project names. Исходный текст вакансии и содержимое резюме не передаются. Missing skills создают честные gap-вопросы и не становятся заявлением об опыте.

Readiness score является локальной эвристикой:

| Компонент | Максимум |
|---|---:|
| Answer coverage | 45 |
| Self-rating confidence | 25 |
| Complete STAR evidence | 20 |
| Interview planning | 10 |

STAR-история считается полной только при заполненных situation, task, action и result. Score не является прогнозом найма.

Dedicated JSON export переносит versioned prep schema. Markdown export содержит вопросы, ответы, self-ratings, STAR-истории и application ID. Все файлы создаются через browser Blob без загрузки на сервер.

## 🗂️ Application Tracker

Tracker использует отдельный versioned storage key:

```text
auto-resume:application-tracker:v1
```

Запись содержит только allowlisted поля:

```json
{
  "company": "Acme",
  "role": "Frontend Developer",
  "vacancyUrl": "https://jobs.example.com/frontend",
  "status": "applied",
  "appliedDate": "2026-08-01",
  "followUpDate": "2026-08-04",
  "notes": "Send portfolio link.",
  "draft": {
    "id": "octocat-1785663600000",
    "name": "Frontend Developer — Acme"
  }
}
```

Черновик связан ссылкой по ID и имени. Resume content, presentation metadata, Application Kit, audit report и исходный vacancy text в запись не копируются.

Follow-up сортируются в порядке: overdue → ближайшие три дня → позднее → без даты. Terminal statuses не считаются просроченными.

JSON import нормализует данные и объединяет duplicate IDs по наиболее новому `updatedAt`. CSV export защищён от spreadsheet formula injection.

## 🔎 Resume Quality Audit

Audit engine получает только текущий resume draft, локаль и массив `vacancyAnalysis.requirements`.

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "score": 82,
  "grade": "good",
  "categories": {
    "completeness": { "score": 23, "max": 25 },
    "evidence": { "score": 19, "max": 25 },
    "ats": { "score": 20, "max": 25 },
    "readability": { "score": 20, "max": 25 }
  },
  "issues": [
    {
      "code": "METRICS_MISSING",
      "severity": "info",
      "category": "evidence"
    }
  ]
}
```

Проверка является объяснимой эвристикой, а не гарантией прохождения конкретной ATS. Она не придумывает достижения, не переписывает текст и не утверждает наличие отсутствующих навыков.

## 📬 Application Kit

После vacancy analysis приложение строит пакет из структурированного результата:

- cover letter;
- project evidence prompts;
- honest gap plan;
- interview questions;
- локальный Markdown/TXT export.

Исходный текст вакансии не передаётся генератору пакета. UI не использует `fetch`, `localStorage` или `sessionStorage`.

## 🎨 Шаблоны и брендирование

Presentation schema отделена от контента резюме:

```json
{
  "schemaVersion": 1,
  "templateId": "visual-studio",
  "templateVersion": 1,
  "visualTemplateId": "visual-studio",
  "accent": "#0f766e",
  "font": "inter",
  "density": "comfortable",
  "spacing": "normal"
}
```

Встроены `visual-classic`, `visual-studio`, `visual-minimal` и `ats-basic`. Неизвестный template ID заменяется безопасным fallback. Custom logo живёт только как временный `blob:` URL и не сериализуется.

Подробности: [`docs/TEMPLATES.md`](docs/TEMPLATES.md).

## 📦 Экспорт

| Формат | Назначение | Особенности |
|---|---|---|
| DOCX | Редактирование и отправка | OOXML, A4, Unicode, стили и кликабельные ссылки |
| Markdown | GitHub и ручное редактирование | Читаемые секции и metadata |
| TXT | Максимальная совместимость | UTF-8 |
| ATS PDF | Системы подбора | Простой макет с выделяемым текстом |
| Visual PDF | Презентационная версия | Выбранная visual-тема |
| Application Kit Markdown/TXT | Отклик и интервью | Локальный редактируемый текст |
| Audit Markdown/TXT | Проверка перед отправкой | Score, категории и issue codes |
| Tracker JSON/CSV | Перенос и анализ воронки | Versioned import и CSV injection protection |
| Interview Prep Markdown/JSON | Репетиция и перенос | Ответы, readiness и STAR без raw vacancy text |
| Offer Lab Markdown/JSON | Сравнение решений | Score, риски и исходные валюты без conversion |

## 🔗 Черновики и публичные ссылки

Workspace хранит локаль, безопасную presentation schema и редактируемый resume draft. JSON backup переносит drafts, preferences и историю профилей.

Application Kit и Resume Quality Audit намеренно не входят в workspace, backup, public share payload, serverless API, Redis/KV или analytics.

Application Tracker, Interview Prep Lab и Offer Decision Lab хранятся отдельно. Их dedicated JSON exports нужно сохранить перед очисткой site data или переносом на другое устройство.

Public resume payload остаётся read-only и не показывает audit, tracker, interview prep или offer panels.

## 🔐 OAuth и API

OAuth использует Authorization Code Flow + PKCE S256 и минимальный scope `read:user`.

- OAuth token находится только в AES-256-GCM encrypted `HttpOnly`, `Secure`, `SameSite=Lax` cookie;
- browser JavaScript не получает token;
- private repository code недоступен;
- authenticated self analytics отделена от public cache;
- `/api/*` не кэшируется Service Worker.

Модель угроз: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## 🧱 Redis/KV

Для общего production cache и rate limiting:

```text
UPSTASH_REDIS_REST_URL=https://…upstash.io
UPSTASH_REDIS_REST_TOKEN=…
RATE_LIMIT_SECRET=случайная_строка
```

Поддерживаются `KV_REST_API_URL` и `KV_REST_API_TOKEN`. Без переменных используется memory fallback. OAuth tokens, vacancy text, resume content, tracker data, interview prep data и offer data в Redis не записываются.

## ☁️ Развёртывание

Минимальная GitHub GraphQL конфигурация:

```text
GITHUB_TOKEN=ваш_токен
```

Для OAuth добавьте переменные из `.env.example`:

```text
GITHUB_OAUTH_CLIENT_ID=…
GITHUB_OAUTH_CLIENT_SECRET=…
GITHUB_CALLBACK_URL=https://ваш-домен/api/auth/callback
SESSION_SECRET=случайная_строка_не_короче_32_символов
```

## 🏷️ Релизы и автообновление

Версия синхронизируется между `package.json`, `js/version.mjs`, `sw.js` и `CHANGELOG.md`.

После merge в `main` workflow `.github/workflows/release.yml` запускает verification, проверяет SemVer, создаёт тег `vX.Y.Z` и публикует GitHub Release. PWA загружает новый app shell в фоне и применяет его только после подтверждения пользователя.

## ▶️ Локальный запуск

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

## ✅ Проверка

```bash
npm run check
npm run docs:check
npm test
npm run test:e2e
npm run test:lighthouse
npm run verify
```

Проверяются source syntax, RU/EN contracts, OAuth, Redis/KV, exports, PWA lifecycle, templates, Application Kit, Resume Quality Audit, Application Tracker, Interview Prep Lab, Offer Decision Lab, privacy boundaries, Chromium/axe и Lighthouse budgets.

## 🤝 Участие и безопасность

Перед изменениями прочитайте:

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- [`SECURITY.md`](SECURITY.md)

Не публикуйте tokens, cookies, client secrets, Redis credentials, private repository data или конфиденциальное содержимое резюме. Уязвимости сообщаются через private GitHub Security Advisory.

## 🔐 Приватность

- GitHub profile analysis использует разрешённые публичные данные;
- vacancy text обрабатывается локально;
- drafts, preferences, tracker, interview prep и offer lab находятся в браузере;
- custom logo не загружается;
- Application Kit и audit report живут в памяти вкладки;
- exports создаются локально;
- public resume хранится в URL fragment;
- serverless API не получает содержимое резюме, вакансии, tracker records, prep sessions или offer records.

## 📜 Лицензия

MIT © Onmaynec
