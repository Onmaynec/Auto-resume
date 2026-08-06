# Interview Prep Lab

Interview Prep Lab — локальное пространство для подготовки к собеседованию. Здесь можно собрать вопросы по конкретной роли, записать ответы, оценить уверенность и подготовить STAR-истории, не отправляя содержимое резюме или вакансии на сервер.

Функция появилась в Auto Resume 3.8 и хранит данные отдельно от основного workspace.

## Хранилище

Используется отдельный versioned key:

```text
auto-resume:interview-prep:v1
```

Верхний уровень имеет версию и список сессий:

```json
{
  "version": 1,
  "sessions": [],
  "updatedAt": "2026-08-02T10:00:00.000Z"
}
```

Пример сессии:

```json
{
  "id": "acme-frontend-engineer-1785664800000",
  "company": "Acme",
  "role": "Frontend Engineer",
  "locale": "en",
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

Связь с Application Tracker намеренно маленькая: копируются только ID отклика, компания и роль. Notes, vacancy URL и полный tracker record в Prep не переходят.

## Откуда берутся вопросы

Генератор работает с уже нормализованными данными:

- локалью;
- названием роли;
- подтверждёнными или явно введёнными skill/requirement names;
- missing skill names;
- публичными названиями проектов.

Raw vacancy text не используется. Один и тот же нормализованный вход должен давать одинаковый набор вопросов.

Категории фиксированы:

- `intro`;
- `technical`;
- `project`;
- `behavioral`;
- `gap`;
- `candidate`.

Missing skill остаётся gap-вопросом. Генератор не должен превращать его в утверждение о том, что пользователь уже владеет этим навыком.

За один раз хранится не более 16 вопросов, длина одного вопроса ограничена 420 символами.

## Ответы

У каждого вопроса есть:

- редактируемый текст ответа;
- отметка о готовности;
- self-rating от 0 до 5.

Ответ ограничен 5 000 символами. Self-rating — только самооценка подготовки, а не доказательство профессионального опыта.

## STAR-истории

В одной сессии можно хранить до десяти STAR-историй. Для каждой предусмотрены:

- название;
- situation;
- task;
- action;
- result;
- необязательные tags.

История считается полной для readiness score только тогда, когда заполнены все четыре смысловые части STAR.

## Readiness score

Score находится в диапазоне от 0 до 100 и считается локально.

| Компонент | Максимум |
| --- | ---: |
| Готовые ответы | 45 |
| Self-rating | 25 |
| Полные STAR-истории | 20 |
| Планирование интервью | 10 |

Баллы за планирование учитывают дату интервью и подготовленный ответ на вопрос категории `candidate`.

Это индикатор заполненности подготовки, а не прогноз результата собеседования или найма.

## Импорт и экспорт

JSON export содержит versioned Prep schema. При импорте будущая неизвестная версия отклоняется, а дубликаты session ID объединяются по наиболее новому `updatedAt`.

Markdown export включает:

- компанию, роль и дату;
- readiness score;
- вопросы и ответы;
- self-ratings;
- STAR-истории;
- application ID, если сессия связана с Tracker.

Файлы создаются локально через browser `Blob` и `URL.createObjectURL()`.

## Приватность

Interview Prep может прочитать текущий in-memory vacancy analysis только для извлечения нормализованных названий требований. Также могут использоваться публичные названия репозиториев.

В Prep не сохраняются и не экспортируются:

- raw vacancy text;
- содержимое resume draft;
- Application Kit;
- Resume Quality Audit;
- Tracker notes и vacancy URL.

Prep sessions не входят в workspace backup, public resume, serverless API, Redis/KV или analytics. В public read-only режиме панель Interview Prep не показывается.

Очистка site data удалит локальную базу Prep, поэтому для переноса на другое устройство нужно заранее сохранить dedicated JSON export.

## Offline

`js/interview-prep.mjs`, `js/interview-prep-ui.mjs`, `js/interview-prep-sync.mjs` и `interview-prep.css` входят в PWA app shell.

После первой загрузки существующие сессии, редактирование, расчёт score и локальный экспорт работают без сети.