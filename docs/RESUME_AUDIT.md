# Resume Quality Audit

Resume Quality Audit в Auto Resume v3.6 проверяет текущий отредактированный черновик резюме полностью в браузере. Проверка не изменяет текст автоматически и не отправляет содержимое на сервер.

## Архитектура

```text
js/version.mjs
  └─ dynamic import → js/resume-audit-bootstrap.mjs
       ├─ наблюдает за render lifecycle редактора
       └─ передаёт draft + requirement names
            └─ js/resume-audit-ui.mjs
                 └─ js/resume-audit.mjs
```

- `js/resume-audit.mjs` — чистый детерминированный audit engine.
- `js/resume-audit-ui.mjs` — live-панель, clipboard и локальные Markdown/TXT exports.
- `js/resume-audit-bootstrap.mjs` — подключение к существующему редактору без изменения workspace/share schemas.
- `resume-audit.css` — отдельные адаптивные стили с reduced-motion fallback.

## Schema

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "score": 82,
  "grade": "good",
  "gradeLabel": "Хорошая основа",
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
  ],
  "stats": {
    "words": 218,
    "projects": 3,
    "skills": 8,
    "requirements": 6,
    "matchedRequirements": 5,
    "requirementCoverage": 83
  }
}
```

В отчёт не входят исходный текст вакансии, HTML редактора, OAuth session, токены, cookies или local logo.

## Категории

Каждая категория даёт максимум 25 баллов.

### Completeness

Проверяет имя, профессиональный headline, контакт, summary, проекты и навыки.

### Evidence

Проверяет HTTPS-ссылки, содержательность project descriptions, глаголы действия, измеримые результаты и повторяющиеся описания.

### ATS readiness

Проверяет общий объём текста, количество навыков, декоративные символы и покрытие только извлечённых названий требований.

Покрытие вакансии не добавляет неподтверждённый опыт. `KEYWORD_GAPS` предлагает проверить доказательства или оставить пробел честно обозначенным.

### Readability

Проверяет длину headline и summary, длинные предложения, размеры project descriptions и повторяющиеся начала.

## Stable issue codes

Issue code является машинно-стабильным идентификатором. Заголовок и рекомендация локализуются.

Примеры:

- `SUMMARY_MISSING`
- `PROJECT_URL_INVALID`
- `METRICS_MISSING`
- `KEYWORD_GAPS`
- `LONG_SENTENCES`
- `REPETITIVE_WORDING`

Новые правила должны получать новый code. Смысл существующего code нельзя незаметно менять.

## Privacy boundary

Audit engine получает только:

- текущий resume draft;
- локаль;
- массив `vacancyAnalysis.requirements`.

Он не получает `vacancyText`. UI и bootstrap не используют `fetch`, `localStorage` или `sessionStorage`.

Audit report:

- не записывается в workspace draft;
- не входит в JSON backup;
- не входит в public share payload;
- не отправляется в serverless API;
- исчезает после перезагрузки, если пользователь не скачал Markdown/TXT.

## Ограничения

Проверка является объяснимым heuristic audit, а не гарантией прохождения конкретной ATS. Она не должна:

- придумывать достижения;
- автоматически переписывать пользовательский текст;
- утверждать наличие missing skills;
- оценивать личность кандидата;
- использовать скрытую сетевую модель.

## Разработка

```bash
npm run check
node --test tests/resume-audit.test.mjs
npm run test:e2e
npm run verify
```

При добавлении правила:

1. Ограничьте и нормализуйте вход.
2. Добавьте стабильный issue code.
3. Добавьте RU/EN copy.
4. Укажите категорию и объяснимый deduction.
5. Добавьте unit contract.
6. Проверьте, что raw vacancy text и report не сериализуются.
