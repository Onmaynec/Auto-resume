# Resume Quality Audit — Auto Resume 3.6

Resume Quality Audit checks the current edited resume entirely in the browser. It is an explainable heuristic, not a promise that a specific ATS or recruiter will accept the resume.

## Input

The engine receives:

- current normalized resume draft;
- locale;
- normalized vacancy requirement names when available.

It does not receive raw vacancy text, OAuth session data, cookies or a local custom-logo file.

## Score

The 0–100 result is split evenly across:

- completeness;
- evidence;
- ATS readiness;
- readability.

Rules cover required sections, HTTPS links, project-description quality, action verbs, measurable evidence, text length, skill/requirement coverage, long sentences and repetitive wording.

## Issue codes

Findings use stable codes such as `SUMMARY_MISSING`, `PROJECT_URL_INVALID`, `METRICS_MISSING`, `KEYWORD_GAPS`, `LONG_SENTENCES` and `REPETITIVE_WORDING`.

The code is the stable machine contract; title/recommendation are localized. Existing code semantics should not be silently changed.

## What the audit must not do

- invent achievements;
- claim missing skills as experience;
- automatically rewrite user text;
- evaluate personality;
- send the draft to a hidden remote model.

Vacancy matching contributes only normalized requirement names. Keyword gaps should prompt the user to check evidence or leave an honest gap.

## Lifetime and export

The report is not stored in workspace drafts, JSON backup, public share, serverless API, Redis/KV or analytics. Public read-only resumes do not show the audit panel.

The user can copy the report or export Markdown/TXT locally. Otherwise it disappears with the page session.

## Development

The audit engine, UI and bootstrap are separate modules and are included in the PWA `APP_SHELL`.

Run:

```bash
npm run verify
npm run test:e2e
```

New rules need a stable issue code, RU/EN copy, explicit category/deduction, deterministic unit coverage and a privacy assertion proving raw vacancy text/report data are not serialized.
