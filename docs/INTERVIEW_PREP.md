# Interview Prep Lab

Interview Prep Lab is a browser-only workspace for practising interview answers and STAR stories. It can be linked to an Application Tracker record without copying the application notes, vacancy source, resume draft, Application Kit or Resume Audit.

## Storage schema

The feature uses a dedicated key:

```text
auto-resume:interview-prep:v1
```

The top-level payload is versioned:

```json
{
  "version": 1,
  "sessions": [],
  "updatedAt": "2026-08-02T10:00:00.000Z"
}
```

A session stores allowlisted structured data:

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

The application relation is intentionally a small reference. Tracker notes, URLs and full tracker records are not copied.

## Question generation

The generator accepts only:

- locale;
- role name;
- normalized requirement or skill names;
- normalized missing-skill names;
- public project names.

The raw vacancy text is never an input. The generated categories are stable:

- `intro`;
- `technical`;
- `project`;
- `behavioral`;
- `gap`;
- `candidate`.

Generation is deterministic for the same normalized input. Questions are bounded to 16 records and 420 characters each.

## Answers and self-rating

Every question stores:

- editable answer text;
- completion state;
- self-rating from 0 to 5.

Answers are capped at 5,000 characters. The application never claims that a high self-rating proves professional experience.

## STAR stories

A session can contain up to ten STAR stories. Each story has:

- title;
- situation;
- task;
- action;
- result;
- optional tags.

The readiness calculation counts a STAR story as complete only when all four sections contain meaningful text.

## Readiness model

The score is an explainable local heuristic from 0 to 100:

| Component | Maximum |
|---|---:|
| Answer coverage | 45 |
| Self-rating confidence | 25 |
| Complete STAR evidence | 20 |
| Interview planning | 10 |

Planning awards points for an interview date and a prepared answer to the candidate-questions prompt. The score is not a hiring prediction.

## Import and export

Dedicated JSON export contains the versioned prep schema. Import rejects future schema versions and merges duplicate session IDs using the newest `updatedAt`.

Markdown export contains:

- company, role and date;
- readiness score;
- questions and answers;
- self-ratings;
- STAR stories;
- application ID only.

Files are created with browser `Blob` and `URL.createObjectURL`; no upload is performed.

## Privacy boundary

Interview Prep Lab may read the current in-memory vacancy analysis only to extract normalized requirement names and may read public repository names. It does not persist or export raw vacancy text or resume content.

Prep data is excluded from:

- workspace drafts and workspace backup;
- public resume payloads;
- Application Kit and Resume Audit schemas;
- serverless API requests;
- Redis or KV;
- analytics.

The panel is removed in public read-only mode. Clearing site data removes the local prep database unless the dedicated JSON export was saved first.

## Offline behavior

`interview-prep.mjs`, `interview-prep-ui.mjs` and `interview-prep.css` are part of the PWA app shell. After one successful online load, existing sessions and all local editing/export operations remain available offline.
