# Application Tracker

Application Tracker — локальная воронка откликов внутри Auto Resume. Она нужна для простого учёта вакансий, статусов и follow-up без отдельного аккаунта, внешней базы данных или фоновой синхронизации.

Функция появилась в версии 3.7 и хранится отдельно от черновиков резюме.

## Хранилище

Tracker использует отдельный versioned key:

```text
auto-resume:application-tracker:v1
```

Нормализованная запись выглядит так:

```json
{
  "id": "acme-frontend-developer-1785663600000",
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
  },
  "createdAt": "2026-08-02T09:40:00.000Z",
  "updatedAt": "2026-08-02T09:40:00.000Z"
}
```

Ссылка на resume draft содержит только ID и имя. Сам текст резюме, presentation settings, Application Kit, Resume Quality Audit и raw vacancy text в Tracker не копируются.

## Статусы

Поддерживаются семь значений:

- `saved`;
- `applied`;
- `screening`;
- `interview`;
- `offer`;
- `rejected`;
- `withdrawn`.

Неизвестное значение после нормализации становится `saved`.

`offer`, `rejected` и `withdrawn` считаются terminal statuses и не попадают в счётчик просроченных follow-up.

## Follow-up

Активные записи сортируются так:

1. просроченные;
2. запланированные на ближайшие три дня;
3. запланированные позже;
4. без даты follow-up.

Если несколько записей находятся в одной группе, используются дата follow-up, `updatedAt` и название компании. Расчёт выполняется локально и не требует фоновых сетевых запросов.

## Импорт и экспорт

JSON export имеет собственный envelope:

```json
{
  "type": "auto-resume-application-tracker",
  "version": 1,
  "exportedAt": "2026-08-02T09:40:00.000Z",
  "tracker": {
    "version": 1,
    "records": []
  }
}
```

При импорте проверяются type и version, затем каждая запись проходит нормализацию. Некорректные записи пропускаются. Если встречаются одинаковые ID, остаётся запись с наиболее новым `updatedAt`.

CSV export экранирует ячейки и защищает от spreadsheet formula injection: значения, начинающиеся с `=`, `+`, `-` или `@`, получают ведущий апостроф перед сериализацией.

## Ограничения полей

- максимум 120 записей;
- company — до 120 символов;
- role — до 160 символов;
- vacancy URL — до 600 символов, только HTTPS;
- notes — до 2 400 символов;
- draft ID — до 180 символов;
- draft name — до 160 символов.

Некорректная дата или не-HTTPS URL нормализуется в пустое значение вместо того, чтобы попадать в интерфейс как есть.

## Приватность

Tracker находится только в browser storage под своим ключом и не включается в:

- public resume payload;
- workspace drafts;
- workspace JSON backup;
- GitHub profile API requests;
- OAuth session;
- Redis/KV;
- Application Kit;
- Resume Quality Audit;
- analytics и server logs.

В public read-only режиме панель Tracker скрыта. Export создаётся локально через browser `Blob`.

UI-модуль Tracker не должен выполнять сетевые запросы и не использует `sessionStorage`.

Очистка site data удалит записи. Перед очисткой браузера или переносом на другое устройство нужно сохранить dedicated JSON export.

## Offline

Engine, UI и стили Tracker входят в PWA app shell. После первой загрузки без сети остаются доступны CRUD, фильтры, статистика и локальный export.

## Что проверяют тесты

Тесты фиксируют основные контракты:

- нормализацию и лимиты полей;
- статусы и terminal-state behavior;
- CRUD и merge по `updatedAt`;
- порядок follow-up и статистику;
- обработку версии JSON;
- защиту CSV export;
- связь с draft без копирования содержимого резюме;
- отсутствие Tracker data в public share и API;
- browser flows, downloads и public-mode privacy;
- accessibility и Lighthouse budgets.