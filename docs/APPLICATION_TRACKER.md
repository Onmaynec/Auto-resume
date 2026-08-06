# Application Tracker — Auto Resume 3.8

Application Tracker остаётся отдельной локальной воронкой откликов с key `auto-resume:application-tracker:v1`.

Record хранит company, role, HTTPS vacancy URL, status, applied/follow-up dates, notes, timestamps и optional draft reference `{id, name}`. Resume content и presentation metadata не копируются.

Статусы: `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn`. Terminal statuses не считаются overdue. Follow-up сортируется overdue → ближайшие три дня → позже → без даты.

Dedicated JSON import/export versioned; duplicates объединяются по newest `updatedAt`. CSV export сохраняет formula-injection protection для `=`, `+`, `-`, `@`.

## Связь с Interview Prep

Prep session может сохранить только маленькую application reference: `id`, `company`, `role`. Tracker notes, vacancy URL, dates и полный record в Prep не копируются.

Tracker не получает Prep answers, STAR stories или readiness score обратно. Эти две базы остаются раздельными.

## Privacy

Tracker исключён из workspace backup, public share, API, Redis/KV, analytics, Application Kit и Audit. Public read-only mode скрывает Tracker panel. Dedicated JSON export нужен перед очисткой site data.

Engine/UI/CSS входят в PWA `APP_SHELL`; local CRUD, filters и exports работают offline после первой загрузки.
