# Interview Prep Lab — Auto Resume 3.8

Interview Prep Lab — browser-only workspace для репетиции ответов и STAR stories. Он может быть связан с записью Application Tracker, но не копирует её целиком.

## Хранилище

```text
auto-resume:interview-prep:v1
```

Top-level payload versioned. Session содержит allowlisted поля: ID, company, role, locale, interview date, маленькую application reference, skills, projects, gaps, questions, stories и timestamps.

Application reference включает только `id`, `company` и `role`. Tracker notes, vacancy URL и полный record не копируются.

## Генерация вопросов

Generator принимает normalized role/skill/requirement names, отдельные missing-skill names и public project names. Raw vacancy text и resume content не являются входом.

Категории стабильны:

- `intro`;
- `technical`;
- `project`;
- `behavioral`;
- `gap`;
- `candidate`.

Для одинакового normalized input генерация детерминирована. В одной сессии не больше 16 вопросов; текст каждого ограничен 420 символами. Missing skills создают gap-вопросы, а не заявления об опыте.

## Ответы и self-rating

У каждого вопроса есть редактируемый answer, completion state и self-rating 0–5. Answer ограничен 5000 символами. Высокий self-rating не считается доказательством реального опыта.

## STAR stories

В сессии может быть до 10 STAR stories. История содержит title, situation, task, action, result и optional tags. Для readiness story считается полной только когда meaningful text присутствует во всех четырёх STAR-полях.

## Readiness score

| Компонент | Максимум |
| --- | ---: |
| Answer coverage | 45 |
| Self-rating confidence | 25 |
| Complete STAR evidence | 20 |
| Interview planning | 10 |

Planning учитывает наличие interview date и подготовленный ответ в категории candidate. Score — объяснимая локальная эвристика, не прогноз результата интервью или найма.

## Import и export

Dedicated JSON export переносит versioned prep schema. Import отклоняет future versions и при duplicate session IDs сохраняет запись с наиболее новым `updatedAt`.

Markdown export включает company/role/date, readiness, вопросы/ответы/self-ratings, STAR stories и application ID. Файлы создаются локально через browser `Blob`; upload не выполняется.

## Privacy boundary

Prep data исключены из:

- workspace drafts и общего backup;
- public resume payload;
- Application Kit и Audit schemas;
- serverless API requests;
- Redis/KV;
- analytics.

Raw vacancy text, resume content, Application Kit output и Audit report в prep schema не сохраняются. Public read-only mode удаляет Prep panel.

Очистка site data удаляет prep database, если пользователь заранее не сделал dedicated JSON export.

## Offline и tests

Prep engine/UI/CSS входят в PWA `APP_SHELL`. После первой online загрузки existing sessions, editing и local exports работают offline.

Tests должны покрывать normalization, deterministic questions, limits, readiness formula, STAR completeness, import/export, Tracker reference boundary, public-link hiding и отсутствие raw vacancy/resume data в storage/API.
