# Application Kit

Application Kit превращает локальный результат анализа вакансии в редактируемый пакет отклика. Генерация выполняется в браузере и не вызывает serverless API.

## Состав пакета

Пакет версии 1 содержит:

- RU/EN сопроводительное письмо;
- match score из существующего vacancy analysis;
- evidence prompts для подтверждённых навыков и релевантных проектов;
- gap plan для требований, которые публичный GitHub-профиль не подтверждает;
- вопросы для технического интервью;
- выбранный вариант тона: `concise`, `balanced` или `detailed`.

## Правила достоверности

Генератор использует только:

- имя, login и bio текущего профиля;
- списки `matched`, `missing` и `requirements` из локального анализа;
- публичные metadata репозиториев;
- выбранную локаль и тон.

Навыки из `missing` никогда не описываются как существующий опыт. Они попадают только в план уточнения ожиданий, учебный демонстратор и вопросы для интервью.

Project links проходят allowlist: разрешён только протокол HTTPS. Пользовательский HTML и JavaScript не выполняются.

## Приватность

Исходный текст вакансии не передаётся генератору пакета. UI-модуль не использует `fetch`, `localStorage` или `sessionStorage`.

Application Kit не добавляется в:

- workspace drafts и JSON backup;
- public resume payload и URL fragment;
- Redis/KV;
- serverless API requests;
- telemetry или логи.

После перезагрузки страницы пакет исчезает. Пользователь может сохранить его локально через Markdown/TXT export.

## Схема

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "tone": "balanced",
  "profile": {
    "name": "Octo Cat",
    "login": "octocat"
  },
  "matchScore": 67,
  "coverLetter": "...",
  "evidence": [],
  "gapPlan": [],
  "interviewQuestions": [],
  "privacy": "..."
}
```

Нормализатор ограничивает длину строк, количество элементов и числовые диапазоны. Неизвестная локаль переключается на `ru`, неизвестный тон — на `balanced`.

## Offline и PWA

В Service Worker app shell входят:

- `application-kit.css`;
- `js/application-kit.mjs`;
- `js/application-kit-ui.mjs`.

После первой успешной загрузки генерация и экспорт работают offline. Обновление файлов происходит через обычный versioned PWA cache.

## Проверки

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
```

Unit-тесты проверяют RU/EN output, deterministic fingerprint, ограничения секций, HTTPS-ссылки и отсутствие исходного текста вакансии. Chromium flow проверяет редактирование, clipboard, Markdown/TXT export, смену локали и отсутствие секретной строки в storage/API requests.
