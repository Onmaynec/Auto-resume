# Application Tracker

Auto Resume v3.7 adds a local job-application pipeline next to the existing resume workspace. It is intended for lightweight follow-up planning without a server account, analytics endpoint or external database.

## Data model

The tracker uses a separate versioned key:

```text
auto-resume:application-tracker:v1
```

Each normalized record contains only allowlisted fields:

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

The linked draft is only a reference. Resume content, presentation settings, Application Kit output, audit reports and vacancy text are not copied into the tracker.

## Stable statuses

The schema accepts these values:

- `saved`
- `applied`
- `screening`
- `interview`
- `offer`
- `rejected`
- `withdrawn`

Unknown values fall back to `saved`. Terminal statuses (`offer`, `rejected`, and `withdrawn`) are excluded from overdue follow-up counts.

## Follow-up ordering

Records are sorted by actionable state:

1. overdue;
2. due within three days;
3. scheduled later;
4. no follow-up date.

Records in the same group use the follow-up date, update time and company name as deterministic tie breakers. The calculation uses local date values only and performs no background requests.

## Import and export

JSON export uses a dedicated envelope:

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

Import validates the type and version, normalizes every field, ignores invalid records and merges duplicate IDs by the newest `updatedAt` value.

CSV export quotes every cell and protects against CSV injection. Values beginning with `=`, `+`, `-` or `@` receive a leading apostrophe before serialization.

## Input limits

- up to 120 records;
- company: 120 characters;
- role: 160 characters;
- vacancy URL: 600 characters and HTTPS only;
- notes: 2,400 characters;
- draft ID: 180 characters;
- draft name: 160 characters.

Invalid dates and non-HTTPS URLs normalize to an empty value instead of being rendered or opened.

## Privacy boundary

Tracker data is stored only in the browser under its dedicated local-storage key. It is not included in:

- public resume hashes;
- workspace draft records;
- the existing workspace backup;
- GitHub profile API requests;
- OAuth session data;
- Redis/KV caches;
- Application Kit output;
- Resume Quality Audit reports;
- analytics or logs.

The tracker panel is removed in public read-only resume mode. Export happens through local `Blob` downloads. The UI module does not call `fetch` and does not use `sessionStorage`.

Because the tracker uses browser storage, clearing site data removes it. Users should export the dedicated JSON file before clearing browser storage or moving to another device.

## Offline behavior

The engine, UI module and stylesheet are part of the PWA app shell. After the application has loaded once, CRUD, filters, statistics and local export continue to work offline.

## Testing contracts

The release suite verifies:

- bounded deterministic normalization;
- stable statuses and terminal-state behavior;
- CRUD and merge semantics;
- follow-up ordering and statistics;
- JSON version handling;
- CSV injection protection;
- draft references without resume content;
- absence from share and API modules;
- Chromium CRUD, filters, downloads and public-link privacy;
- accessibility and Lighthouse budgets.
