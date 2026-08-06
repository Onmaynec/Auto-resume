# Application Kit — Auto Resume 3.9

Application Kit остаётся browser-only пакетом отклика: RU/EN cover letter, evidence prompts, gap plan и interview questions из normalized vacancy analysis.

Raw vacancy text не передаётся generator; missing skills остаются gaps; public project links ограничены HTTPS.

Kit не сохраняется в workspace, backup, public share, Tracker, Interview Prep, Offer Lab, Audit, Redis/KV или API. UI не использует `fetch`, `localStorage` или `sessionStorage`.

Offer Decision Lab не получает Application Kit content. Markdown/TXT export Kit выполняется локально, а modules остаются в PWA `APP_SHELL`.
