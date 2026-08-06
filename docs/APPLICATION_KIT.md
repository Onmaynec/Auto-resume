# Application Kit — Auto Resume 3.8

Application Kit остаётся browser-only пакетом отклика. Он использует normalized vacancy analysis для cover letter, evidence prompts, gap plan и interview questions в режимах `concise`, `balanced`, `detailed`.

Raw vacancy text не передаётся generator. Missing requirements остаются gaps; public project links ограничены HTTPS.

Kit не сохраняется в workspace, backup, public share, Tracker, Interview Prep, Audit, Redis/KV или API. Его UI не использует `fetch`, `localStorage` или `sessionStorage`. Не экспортированный пользователем kit исчезает после reload.

Interview Prep может использовать normalized skill/gap/project names из текущего состояния приложения, но не копирует сам Application Kit output.

Markdown/TXT export выполняется локально. Kit modules входят в PWA `APP_SHELL`.
