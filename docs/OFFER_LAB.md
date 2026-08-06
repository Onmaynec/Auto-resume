# Offer Decision Lab — Auto Resume 3.9

Offer Decision Lab — полностью локальная матрица для сравнения офферов после Tracker и Interview Prep. Она помогает разложить решение на пользовательские критерии, но не пытается предсказывать качество работодателя или карьерный результат.

## Хранилище

```text
auto-resume:offer-lab:v1
```

Top-level payload versioned и содержит только normalized offer records. Максимум — 60 офферов.

Record хранит ID, company, role, locale, небольшую application reference, currency, compensation fields, work model, contract type, deadline, ratings/weights, red flags, notes и timestamps.

Application reference ограничена `id`, `company`, `role`. Tracker notes, vacancy URL, resume draft, raw vacancy text, Application Kit, Audit report и Interview Prep answers не копируются.

## Нормализация

- company — до 120 символов;
- role — до 160;
- application ID — до 180;
- notes — до 4000;
- до 16 уникальных red flags, каждый до 300 символов;
- money fields — от 0 до 1,000,000,000 с точностью до двух знаков;
- rating и weight каждого критерия — целое 0–5.

Поддерживаемые currencies: EUR, USD, GBP, RUB, UAH, KZT, PLN, CHF, CAD, AUD и OTHER. Work models: remote, hybrid, onsite, flexible. Contract types: employment, contract, internship, other.

## Матрица решения

Семь критериев:

- compensation;
- growth;
- team;
- product;
- work-life balance;
- stability;
- flexibility.

Каждый criterion имеет rating и weight 0–5. Weighted score нормализуется к 0–100. Если все weights равны нулю, engine использует равный вес критериев вместо некорректного деления.

Каждый red flag вычитает 3 балла. Максимальный risk penalty — 18. Итоговый score ограничивается диапазоном 0–100 и отдельно показывает weighted score, penalty и component values.

Score — личная decision aid. Он не является прогнозом job satisfaction, employer quality, career success или юридической/финансовой рекомендацией.

## Compensation

First-year package:

```text
base + bonus + annual equity + sign-on + benefits - commute cost
```

Приложение не конвертирует валюты и не запрашивает exchange rates. Сравнение сумм имеет смысл только внутри одной currency. Taxes, vesting, exercise costs, eligibility и юридические условия пользователь оценивает самостоятельно.

## Deadlines

Deadline state вычисляется локально:

- `expired` — дата прошла;
- `urgent` — сегодня или в пределах 3 дней;
- `soon` — в пределах 7 дней;
- `scheduled` — позже;
- `none` — дата не задана.

Offer Lab не создаёт notifications, calendar events или server-side reminders.

## Import и export

Dedicated JSON export содержит только versioned Offer Lab schema. Import отклоняет future versions; duplicate IDs объединяются по newest `updatedAt`.

Markdown export доступен для отдельного оффера и comparison table. Оригинальные currencies сохраняются, рядом явно указывается отсутствие currency conversion.

## Privacy boundary

Offer Lab исключён из:

- workspace backup и resume drafts;
- public share payload;
- GitHub API/OAuth data;
- Redis/KV;
- analytics;
- Application Kit и Audit schemas;
- Interview Prep sessions.

Public read-only mode скрывает Offer Lab UI. Clearing site data удаляет records, если dedicated JSON export не сохранён заранее.

## Offline и tests

`offer-lab.mjs`, UI и CSS входят в PWA `APP_SHELL`; existing offers, editing, scoring и exports работают offline после первой загрузки.

Tests должны покрывать normalization/limits, score and penalty, zero-weight fallback, compensation, deadline states, same-currency comparison, import merge, privacy boundaries и public-read-only hiding.
