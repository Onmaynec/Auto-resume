# Changelog

## v3.4.0 — 2026-08-02

- добавлен `CONTRIBUTING.md` с настройкой Node.js 24, архитектурой, командами и правилами pull request;
- задокументированы naming веток, Conventional Commit-style subjects и release workflow branch → PR → CI → main → cleanup;
- добавлен `SECURITY.md` с поддерживаемыми версиями и private vulnerability reporting;
- добавлен Code of Conduct с приватным процессом эскалации чувствительных обращений;
- добавлены YAML Issue Forms для bug reports и feature requests;
- blank Issues отключены, security reports направляются в GitHub Security Advisories;
- добавлен pull request template с checklist тестов, i18n, privacy, accessibility, совместимости, PWA и screenshots;
- описаны обязательные method allowlist, headers, cookie, CSRF, redaction и rate-limit требования для serverless API;
- добавлен dependency-free documentation checker структуры Markdown, локальных ссылок и governance contracts;
- добавлены пять автоматических тестов Issue Forms, policies, PR template, CI и release workflow;
- CI получил отдельный `documentation` job, а `npm run verify` теперь включает `npm run docs:check`;
- Service Worker и runtime metadata обновлены для v3.4.0;
- версия проекта повышена до 3.4.0.

## v3.3.0 — 2026-08-02

- добавлена versioned presentation schema с template id/version и безопасными миграциями;
- Visual и ATS вынесены в независимые renderers с единым sanitized resume model;
- добавлены встроенные темы `visual-classic`, `visual-studio`, `visual-minimal` и fallback `ats-basic`;
- редактор получил выбор системного шрифта, плотности, отступов секций и акцентного цвета;
- добавлена WCAG AA проверка контраста акцента с предупреждением о плохой читаемости;
- custom logo работает только локально через `URL.createObjectURL()` и не сериализуется;
- черновики, backup и публичные ссылки v4 сохраняют только allowlisted presentation metadata;
- старые workspace/public payload и неизвестные template ID безопасно переключаются на fallback;
- добавлен data-only template catalog без пользовательского JavaScript, HTML и внешнего CSS;
- добавлены renderer contract, migration, persistence и Chromium template tests;
- Service Worker и runtime metadata обновлены для v3.3.0;
- версия проекта повышена до 3.3.0.

## v3.2.0 — 2026-08-01

- добавлен общий Upstash Redis / Vercel KV REST-адаптер без обязательной npm-зависимости;
- публичный и authenticated-self кэш разделены независимыми namespace;
- добавлен распределённый fixed-window rate limiting по HMAC-отпечатку IP или OAuth-сессии;
- реализованы stale-while-revalidate, локальная дедупликация и distributed lock против cache stampede;
- при сбое Redis приложение автоматически использует безопасный memory fallback;
- добавлен опциональный session denylist с TTL без хранения OAuth-токена;
- добавлены privacy-safe заголовки и метрики HIT/MISS/STALE, backend latency и degraded mode;
- обновлены environment template, threat model и deployment documentation;
- добавлены unit и integration тесты Redis REST, TTL, partitioning, rate limits, fallback и denylist;
- полный набор из 77 автоматических проверок проходит без ошибок;
- версия проекта повышена до 3.2.0.

## v3.1.0 — 2026-08-01

- добавлена фоновая проверка последнего стабильного GitHub Release;
- добавлено RU/EN уведомление об обновлении с release notes и действиями «Обновить сейчас» / «Позже»;
- Service Worker загружает новый app shell в фоне и применяет его только после подтверждения пользователя;
- локальные черновики, настройки, история и OAuth-сессия не очищаются при обновлении;
- добавлены строгая SemVer-проверка и фильтрация недоверенных release payload/URL;
- добавлен идемпотентный GitHub Actions workflow: проверка → тег `vX.Y.Z` → GitHub Release;
- release notes автоматически извлекаются из соответствующей секции `CHANGELOG.md`;
- workflow поддерживает ручной `workflow_dispatch` и не создаёт дубликаты тегов или релизов;
- добавлены unit и integration проверки update lifecycle, PWA cache и release workflow;
- полный набор из 61 автоматической проверки проходит без ошибок;
- версия проекта повышена до 3.1.0.

## v3.0.0 — 2026-08-01

- добавлен GitHub OAuth Authorization Code Flow с PKCE S256 и `state`;
- запрашивается только `read:user`, без доступа к коду приватных репозиториев;
- OAuth token хранится только в AES-256-GCM encrypted HttpOnly-cookie;
- добавлены session status, logout и отзыв GitHub grant;
- собственная аналитика включает private/internal contributions;
- authenticated self responses отделены от публичного кэша и используют `no-store`;
- добавлены threat model, environment template и OAuth security tests;
- полный набор из 53 автоматических проверок проходит без ошибок;
- версия пакета обновлена до 3.0.0.

## v2.4.0 — 2026-08-01

- добавлен локальный экспорт в DOCX с настоящим текстовым слоем и кликабельными ссылками;
- добавлен Markdown-экспорт с YAML metadata и совместимостью с GitHub;
- DOCX содержит A4-разметку, стили заголовков и core properties документа;
- оба формата сохраняют пользовательский порядок проектов, отредактированный текст и выбранную локаль;
- генератор DOCX работает без внешнего сервера и сторонних runtime-зависимостей;
- добавлены проверки ZIP/OOXML-структуры, Unicode, ссылок, локализации и порядка проектов;
- PWA shell и документация обновлены, версия пакета повышена до 2.4.0.

## v2.3.0 — 2026-08-01

- добавлена полноценная RU/EN локализация без перезагрузки страницы;
- интерфейсные строки вынесены в единые словари `js/i18n.mjs`;
- локализованы статусы, ошибки, метрики, подсказки, графики, сравнение профилей и конструктор проектов;
- ATS/TXT/PDF используют выбранный язык;
- язык сохраняется в настройках, локальных черновиках и JSON backup;
- публичная ссылка передаёт язык резюме, а ссылки v2 автоматически открываются на русском;
- добавлены проверки одинакового набора ключей, fallback-языка и локализованного экспорта;
- версия пакета обновлена до 2.3.0.

## v2.2.0 — 2026-08-01

- добавлены PWA, offline app shell, локальные черновики, автосохранение и JSON backup;
- добавлены индикаторы сети и свежести GitHub-данных;
- Service Worker не кэширует `/api/*` ответы.

## v2.1.0 — 2026-08-01

- добавлены сравнение профилей, недавние профили, светлая/тёмная темы и CI.

## v2.0.0 — 2026-08-01

- добавлены анализ вакансии, история языков и публичные ссылки.

## v1.1.0 — 2026-08-01

- добавлены выбор проектов, редактирование и ATS-friendly экспорт.

## v1.0.0

- первая версия генератора резюме по публичному GitHub-профилю.
