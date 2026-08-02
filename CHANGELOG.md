# Changelog

## v3.6.0 — 2026-08-02

- добавлен полностью локальный Resume Quality Audit с versioned schema;
- итоговый score 0–100 разделён на completeness, evidence, ATS readiness и readability;
- добавлены проверки headline, контактов, summary, навыков, проектов, HTTPS-ссылок, метрик и action verbs;
- vacancy matching использует только извлечённые requirement names и не получает исходный vacancy text;
- добавлены стабильные RU/EN issue codes, severity и объяснимые deductions;
- audit panel автоматически появляется в редакторе и пересчитывается после пользовательских изменений;
- отчёт не изменяет резюме автоматически;
- добавлены clipboard и локальные Markdown/TXT exports;
- audit report не входит в drafts, backup, public share, API, Redis/KV или analytics;
- public read-only resumes не показывают audit panel;
- engine, bootstrap, UI и CSS добавлены в PWA app shell;
- добавлены unit, privacy contract и Chromium/axe tests;
- release metadata и Service Worker обновлены до 3.6.0.

## v3.5.0 — 2026-08-02

- добавлена versioned Application Kit schema с безопасной нормализацией;
- после vacancy analysis генерируются RU/EN cover letter, evidence prompts, gap plan и interview questions;
- добавлены варианты тона `concise`, `balanced` и `detailed`;
- генерация опирается только на matched skills и публичные metadata репозиториев;
- missing skills не описываются как имеющийся опыт;
- project links ограничены HTTPS;
- пакет редактируется, копируется и экспортируется локально в Markdown/TXT;
- исходный vacancy text не входит в generated schema, drafts, backup, public share, storage или API requests;
- Application Kit modules и CSS добавлены в PWA app shell;
- добавлены unit, integration и Chromium privacy/export tests;
- версия проекта повышена до 3.5.0.

## v3.4.0 — 2026-08-02

- добавлены `CONTRIBUTING.md`, `SECURITY.md` и `CODE_OF_CONDUCT.md`;
- добавлены YAML Issue Forms и pull request template;
- blank Issues отключены, vulnerability reports направляются в private Security Advisories;
- добавлен dependency-free documentation checker;
- CI получил отдельный `documentation` job;
- версия проекта повышена до 3.4.0.

## v3.3.0 — 2026-08-02

- добавлена versioned presentation schema и безопасные миграции;
- добавлены `visual-classic`, `visual-studio`, `visual-minimal` и `ats-basic`;
- добавлены font, density, spacing, accent и WCAG contrast check;
- custom logo остаётся локальным и не сериализуется;
- добавлены renderer, migration, persistence и Chromium tests;
- версия проекта повышена до 3.3.0.

## v3.2.0 — 2026-08-01

- добавлен Upstash Redis / Vercel KV REST adapter;
- добавлены distributed cache, rate limiting, stale-while-revalidate и memory fallback;
- добавлен optional session denylist без хранения OAuth token;
- версия проекта повышена до 3.2.0.

## v3.1.0 — 2026-08-01

- добавлена проверка последнего стабильного GitHub Release;
- Service Worker применяет update только после подтверждения;
- добавлен idempotent release workflow для tag и GitHub Release;
- версия проекта повышена до 3.1.0.

## v3.0.0 — 2026-08-01

- добавлен GitHub OAuth Authorization Code Flow + PKCE S256;
- используется минимальный scope `read:user`;
- OAuth token хранится в encrypted HttpOnly cookie;
- private/internal contributions доступны только для собственного профиля;
- версия проекта повышена до 3.0.0.

## v2.4.0 — 2026-08-01

- добавлены локальные DOCX и Markdown exports;
- DOCX содержит OOXML, Unicode и кликабельные ссылки.

## v2.3.0 — 2026-08-01

- добавлена полная RU/EN локализация;
- локаль сохраняется в preferences, drafts, backup и public share.

## v2.2.0 — 2026-08-01

- добавлены PWA, offline app shell, drafts, autosave и JSON backup.

## v2.1.0 — 2026-08-01

- добавлены сравнение профилей, recent profiles, темы и CI.

## v2.0.0 — 2026-08-01

- добавлены vacancy analysis, language history и public links.

## v1.1.0 — 2026-08-01

- добавлены project selection, editing и ATS export.

## v1.0.0

- первая версия генератора резюме по GitHub-профилю.
