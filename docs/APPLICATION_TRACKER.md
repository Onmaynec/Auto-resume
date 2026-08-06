# Application Tracker — Auto Resume 3.7

Application Tracker — локальная воронка откликов рядом с основным workspace. Для неё не нужен аккаунт Auto Resume, серверная база или analytics endpoint: записи живут только в браузере.

## Хранилище

Tracker использует отдельный versioned key:

```text
auto-resume:application-tracker:v1
```

Запись содержит только разрешённые поля: ID, компанию, роль, HTTPS-ссылку вакансии, статус, даты отклика и follow-up, заметки, timestamps и optional reference на resume draft.

Draft reference хранит только `id` и `name`. Содержимое резюме, presentation settings, Application Kit, Audit report и исходный vacancy text в запись не копируются.

## Статусы

Поддерживаются:

- `saved`;
- `applied`;
- `screening`;
- `interview`;
- `offer`;
- `rejected`;
- `withdrawn`.

Неизвестное значение нормализуется к `saved`. `offer`, `rejected` и `withdrawn` считаются terminal statuses и не попадают в overdue follow-up.

## Follow-up

Список сортируется по полезности для следующего действия:

1. просроченные follow-up;
2. запланированные на ближайшие три дня;
3. более поздние;
4. без follow-up date.

Внутри одной группы используются дата, время последнего изменения и название компании, поэтому одинаковый набор данных сортируется предсказуемо.

## Import и export

Dedicated JSON export содержит versioned envelope и только tracker schema. При import данные нормализуются; записи с одинаковым ID объединяются по наиболее новому `updatedAt`. Future schema versions отклоняются.

CSV export экранирует ячейки и защищает от spreadsheet formula injection: значения, начинающиеся с `=`, `+`, `-` или `@`, получают безопасный префикс перед сериализацией.

## Ограничения входа

- максимум 120 записей;
- company — до 120 символов;
- role — до 160;
- vacancy URL — до 600 и только HTTPS;
- notes — до 2400;
- draft ID — до 180;
- draft name — до 160.

Некорректные даты и небезопасные URL не рендерятся как валидные значения.

## Privacy boundary

Tracker не входит в:

- workspace draft и общий workspace backup;
- public resume payload;
- GitHub profile API/OAuth data;
- Redis/KV;
- Application Kit;
- Resume Quality Audit;
- analytics и server logs.

В public read-only режиме панель Tracker не показывается. Export создаётся локально через browser `Blob`; UI не отправляет tracker records через `fetch` и не использует `sessionStorage`.

Очистка site data удаляет tracker database, поэтому перед переносом устройства или очисткой браузера нужен dedicated JSON export.

## Offline

Engine, UI и stylesheet входят в PWA `APP_SHELL`. После первой успешной загрузки CRUD, filters, statistics и local export работают без сети.

## Проверка

Тесты должны покрывать normalization, statuses, terminal-state logic, CRUD, сортировку follow-up, JSON version handling, duplicate merge, CSV injection protection, draft references и отсутствие tracker data в share/API schemas.

```bash
npm run verify
npm run test:e2e
```
