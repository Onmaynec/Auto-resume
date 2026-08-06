# Application Kit — Auto Resume 3.7

Application Kit остаётся browser-only пакетом отклика. Он использует нормализованный результат vacancy matching и не связан с постоянным хранением Application Tracker.

Kit создаёт RU/EN cover letter, evidence prompts, gap plan и interview questions в режимах `concise`, `balanced` и `detailed`. Raw vacancy text не передаётся generator; missing requirements не становятся заявлениями об опыте; project links ограничены HTTPS.

Application Kit не сохраняется в workspace, backup, public share, Tracker, Redis/KV или API. Его UI не использует `fetch`, `localStorage` или `sessionStorage`. Не сохранённый пользователем kit исчезает после reload.

Markdown/TXT export выполняется локально. Модули Kit входят в PWA `APP_SHELL` и остаются доступны offline после первой загрузки.
