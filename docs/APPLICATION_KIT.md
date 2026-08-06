# Application Kit — Auto Resume 3.6

Application Kit remains the browser-only application package introduced in 3.5. It is independent from the newer Resume Quality Audit.

The kit uses normalized vacancy-analysis data to create an editable RU/EN cover letter, evidence prompts, gap plan and interview questions in `concise`, `balanced` or `detailed` tone.

Raw vacancy text is not passed to the kit generator. Missing requirements remain gaps and cannot become claims of experience. Project links are HTTPS-only.

Application Kit is not written to workspace drafts, backup, public share, Redis/KV, API requests or analytics. Its UI does not use `fetch`, `localStorage` or `sessionStorage`; reload removes unsaved content.

Markdown/TXT export is created locally in the browser. Application Kit and Resume Quality Audit remain separate schemas and neither is serialized into the other.

The Application Kit modules are part of the PWA `APP_SHELL`. Changes should keep deterministic RU/EN generation, bounded fields and privacy tests.
