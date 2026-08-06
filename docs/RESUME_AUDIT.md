# Resume Quality Audit

Resume Quality Audit проверяет текущий черновик резюме прямо в браузере. Он не переписывает текст за пользователя и не отправляет содержимое резюме или вакансии на сервер.

Функция появилась в Auto Resume 3.6 и работает как отдельный детерминированный слой поверх редактора.

## Как устроено подключение

```text
js/version.mjs
  └─ dynamic import → js/resume-audit-bootstrap.mjs
       ├─ следит за render lifecycle редактора
       └─ передаёт draft + requirement names
            └─ js/resume-audit-ui.mjs
                 └─ js/resume-audit.mjs
```

- `js/resume-audit.mjs` содержит правила и расчёт score;
- `js/resume-audit-ui.mjs` отвечает за live-панель, clipboard и локальные Markdown/TXT exports;
- `js/resume-audit-bootstrap.mjs` подключает аудит к существующему редактору;
- `resume-audit.css` содержит отдельные адаптивные стили и reduced-motion fallback.

Audit не меняет workspace/share schema.

## Формат результата

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

Raw vacancy text, HTML редактора, OAuth session, tokens, cookies и local logo в отчёт не входят.

## Как считается score

Есть четыре категории по 25 баллов.

### Completeness

Проверяются базовые части резюме: имя, headline, контакт, summary, проекты и навыки.

### Evidence

Проверяются HTTPS-ссылки, содержательность project descriptions, глаголы действия, измеримые результаты и повторяющиеся формулировки.

### ATS readiness

Проверяются объём текста, количество навыков, декоративные символы и покрытие только тех требований, которые уже были извлечены из вакансии.

Если часть требований не подтверждена, правило `KEYWORD_GAPS` предлагает проверить доказательства или оставить gap явно обозначенным. Audit не добавляет отсутствующий опыт.

### Readability

Проверяются длина headline и summary, слишком длинные предложения, размеры описаний проектов и повторяющиеся начала фраз.

## Stable issue codes

Каждое правило имеет стабильный machine-readable code. Текст заголовка и рекомендации может локализоваться, но смысл code не должен незаметно меняться.

Примеры:

- `SUMMARY_MISSING`;
- `PROJECT_URL_INVALID`;
- `METRICS_MISSING`;
- `KEYWORD_GAPS`;
- `LONG_SENTENCES`;
- `REPETITIVE_WORDING`.

Если появляется новое правило с другим смыслом, ему нужен новый code.

## Какие данные получает Audit

Engine получает только:

- текущий resume draft;
- локаль;
- массив `vacancyAnalysis.requirements`.

`vacancyText` не передаётся. UI и bootstrap не используют `fetch`, `localStorage` или `sessionStorage`.

Готовый audit report:

- не записывается в workspace draft;
- не входит в workspace JSON backup;
- не входит в public share payload;
- не отправляется в serverless API;
- исчезает после reload, если пользователь не сохранил Markdown/TXT export.

## Ограничения

Score — объяснимая локальная эвристика, а не гарантия прохождения конкретной ATS.

Audit не должен:

- придумывать достижения;
- автоматически менять пользовательский текст;
- утверждать наличие missing skills;
- оценивать личность кандидата;
- обращаться к скрытой сетевой модели.

## Добавление нового правила

1. Нормализуйте и ограничьте вход.
2. Добавьте новый stable issue code.
3. Добавьте RU/EN текст.
4. Привяжите правило к категории и понятному deduction.
5. Добавьте unit contract.
6. Проверьте, что raw vacancy text и report не сериализуются.

Полезные команды:

```bash
npm run check
node --test tests/resume-audit.test.mjs
npm run test:e2e
npm run verify
```