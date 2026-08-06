# Application Kit

Application Kit собирает из результата локального анализа вакансии пакет для отклика. Он работает прямо в браузере: исходный текст вакансии не уходит в serverless API, а готовый пакет не сохраняется автоматически.

## Что входит в пакет

Application Kit версии 1 содержит:

- сопроводительное письмо на русском или английском;
- match score из уже выполненного vacancy analysis;
- evidence prompts для подтверждённых навыков и подходящих проектов;
- gap plan для требований, которые GitHub-профиль не подтверждает;
- вопросы для технического интервью;
- выбранный тон: `concise`, `balanced` или `detailed`.

Текст можно отредактировать перед копированием или экспортом.

## Какие данные использует генератор

Вход ограничен структурированными данными:

- name, login и bio профиля;
- `matched`, `missing` и `requirements` из vacancy analysis;
- публичными metadata выбранных репозиториев;
- локалью;
- выбранным tone.

Raw vacancy text входом генератора не является.

Навык из `missing` нельзя выдавать за существующий опыт. Такие требования используются только в gap plan, учебных предложениях и вопросах к интервью.

Project URLs проходят allowlist и принимаются только по HTTPS. Пользовательский HTML или JavaScript не исполняется.

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

Нормализатор ограничивает длину строк, количество элементов и числовые диапазоны. Неизвестная локаль переключается на `ru`, неизвестный tone — на `balanced`.

## Приватность

Application Kit не записывается в:

- workspace drafts;
- workspace JSON backup;
- public resume payload или URL fragment;
- Redis/KV;
- serverless API requests;
- analytics и logs.

UI-модуль не использует `fetch`, `localStorage` или `sessionStorage`.

После перезагрузки страницы пакет исчезает, если пользователь не сохранил его вручную. Для локального сохранения доступны Markdown и TXT.

## Offline

В app shell Service Worker входят:

- `application-kit.css`;
- `js/application-kit.mjs`;
- `js/application-kit-ui.mjs`.

После первой успешной загрузки генерация, редактирование и экспорт работают без сети.

## Проверка

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
```

Unit-тесты проверяют RU/EN output, deterministic fingerprint, ограничения секций, HTTPS-ссылки и отсутствие raw vacancy text. Browser flow покрывает редактирование, clipboard, Markdown/TXT export, смену локали и отсутствие чувствительной строки в storage/API requests.