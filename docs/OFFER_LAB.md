# Offer Decision Lab

Offer Decision Lab is a browser-only decision matrix for comparing job offers after the Application Tracker and Interview Prep stages.

## Storage schema

The feature uses a dedicated versioned key:

```text
auto-resume:offer-lab:v1
```

The top-level payload contains only normalized offer records:

```json
{
  "version": 1,
  "records": [],
  "updatedAt": "2026-08-03T12:00:00.000Z"
}
```

Each offer stores allowlisted decision data:

```json
{
  "id": "acme-staff-engineer-1785758400000",
  "company": "Acme",
  "role": "Staff Engineer",
  "locale": "en",
  "application": {
    "id": "application-id",
    "company": "Acme",
    "role": "Staff Engineer"
  },
  "currency": "EUR",
  "compensation": {
    "base": 120000,
    "bonus": 12000,
    "equity": 15000,
    "signOn": 5000,
    "benefits": 3000,
    "commuteCost": 1200
  },
  "workModel": "hybrid",
  "contractType": "employment",
  "deadline": "2026-08-10",
  "ratings": {},
  "weights": {},
  "redFlags": [],
  "notes": "",
  "createdAt": "2026-08-03T12:00:00.000Z",
  "updatedAt": "2026-08-03T12:00:00.000Z"
}
```

The Application Tracker relation is intentionally limited to application ID, company and role. Tracker notes, vacancy URLs, resume drafts, vacancy text, Application Kit content, audit reports and interview answers are never copied.

## Decision matrix

The matrix contains seven user-controlled criteria:

- compensation;
- growth;
- team;
- product;
- work-life balance;
- stability;
- flexibility.

Every criterion has a rating from 0 to 5 and a weight from 0 to 5. The weighted fit score is normalized to 0–100. If all weights are zero, the engine uses an equal-weight average rather than returning an invalid score.

Each recorded red flag subtracts three points, with a maximum penalty of 18 points. The result is clamped to 0–100 and exposes the weighted score, risk penalty and per-criterion components.

The score is a personal decision aid. It is not a prediction of job satisfaction, career success or employer quality.

## Compensation model

The first-year package is calculated as:

```text
base + bonus + annual equity value + sign-on + benefits - commute cost
```

The application never converts currencies or fetches exchange rates. Amounts are compared only inside the same currency. Users remain responsible for taxes, vesting terms, exercise costs, benefit eligibility and legal interpretation.

## Deadlines

Decision deadlines are classified locally as:

- expired;
- urgent: within three days;
- soon: within seven days;
- scheduled;
- none.

No notifications, calendar events or server-side reminders are created.

## Import and export

Dedicated JSON export contains only the versioned Offer Lab schema. Import rejects future schema versions and merges duplicate record IDs using the newest `updatedAt` value.

Markdown exports are available for individual offer cards and the comparison table. Comparison exports keep each original currency and explicitly state that no currency conversion was performed.

## Privacy boundary

Offer Lab data is excluded from:

- workspace backup;
- resume drafts;
- public share payloads;
- GitHub API requests;
- OAuth sessions;
- Redis or KV caches;
- analytics;
- Application Kit and Resume Audit schemas;
- Interview Prep sessions.

The UI is removed in public read-only mode. Clearing browser site data removes Offer Lab records unless a dedicated JSON export was saved first.

## Offline behavior

`offer-lab.mjs`, `offer-lab-ui.mjs` and `offer-lab.css` are part of the PWA app shell. After one successful online load, existing offers, editing, scoring and local exports remain available offline.
