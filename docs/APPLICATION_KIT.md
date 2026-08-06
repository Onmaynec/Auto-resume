# Application Kit — Auto Resume 3.5

Application Kit turns the normalized result of local vacancy analysis into editable application material. Generation happens in the browser and does not call the serverless API.

## Output

A kit contains:

- RU/EN cover letter;
- match score already calculated by vacancy analysis;
- evidence prompts for confirmed skills and relevant public projects;
- gap plan for requirements not confirmed by the profile;
- interview questions;
- tone: `concise`, `balanced` or `detailed`.

## Input boundary

The generator receives only normalized profile/vacancy-analysis data: profile name/login, `matched`, `missing`, requirement names, public repository metadata, locale and tone.

Raw vacancy text is not passed to the kit generator. A missing requirement never becomes a claim of experience; it can only appear as a gap, learning/demo suggestion or interview topic.

Project links are HTTPS-only and user-controlled text is escaped/normalized.

## Lifetime and storage

Application Kit is intentionally ephemeral. It is not written to:

- workspace drafts;
- JSON backup;
- public share payload;
- Redis/KV;
- OAuth/session data;
- analytics or server logs.

The UI module does not use `fetch`, `localStorage` or `sessionStorage`. Reloading the page removes the kit unless the user exported it.

## Export

The current edited result can be copied or saved locally as Markdown/TXT. Files are created in the browser; no upload is required.

## Offline behavior

`application-kit.css`, `js/application-kit.mjs` and `js/application-kit-ui.mjs` are part of the PWA `APP_SHELL`, so generation/edit/export continue to work offline after the app has loaded once.

## Development contract

Changes to the generator should preserve deterministic normalization, RU/EN output, bounded sections, HTTPS links and the rule that raw vacancy text is never serialized into the kit.

Run:

```bash
npm run verify
npm run test:e2e
```

Chromium coverage should verify editing, clipboard/download behavior and the absence of secret/raw vacancy data from storage and API requests.
