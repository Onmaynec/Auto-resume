# ✨ Auto Resume v3.5

> GitHub-профиль превращается в адаптированное, редактируемое и публичное резюме, а анализ вакансии — в локальный пакет отклика на русском или английском языке.

## 📬 Что нового в v3.5

- после анализа вакансии создаётся редактируемый Application Kit;
- доступны RU/EN сопроводительное письмо, evidence prompts, gap plan и вопросы для интервью;
- варианты тона: `concise`, `balanced` и `detailed`;
- подтверждённые навыки связываются с релевантными публичными репозиториями;
- отсутствующие требования никогда не выдаются за имеющийся опыт;
- разрешены только HTTPS-ссылки на проекты;
- пакет копируется и локально экспортируется в Markdown или TXT;
- исходный текст вакансии не входит в generated schema, drafts, backup, public URL или API requests;
- Application Kit работает offline после загрузки PWA app shell;
- добавлены unit, integration и Chromium privacy/export tests.

Архитектура, схема и privacy boundary описаны в [`docs/APPLICATION_KIT.md`](docs/APPLICATION_KIT.md).

## 🤝 Что нового в v3.4

- добавлен подробный [`CONTRIBUTING.md`](CONTRIBUTING.md) с Node.js 24 setup, архитектурой и командами;
- добавлены структурированные Issue Forms для bug reports и feature requests;
- blank Issues отключены, а уязвимости направляются в private GitHub Security Advisories;
- добавлены [`SECURITY.md`](SECURITY.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) и pull request template;
- documented branch naming, Conventional Commit-style subjects и release workflow;
- зафиксированы method allowlist, headers, cookie, CSRF, redaction и rate-limit требования для API;
- добавлен dependency-free `npm run docs:check` для Markdown, ссылок, Issue Forms и governance contracts;
- CI получил отдельный `documentation` job, а release verification также проверяет документацию.

## 🎨 Что нового в v3.3

- versioned presentation schema с безопасным fallback для старых черновиков и публичных ссылок;
- независимые renderers для `visual-classic`, `visual-studio`, `visual-minimal` и `ats-basic`;
- настройка системного шрифта, плотности, отступов секций и акцентного цвета;
- автоматическая проверка контраста акцента по WCAG AA;
- локальный custom logo через `URL.createObjectURL()` без загрузки на сервер;
- логотип не попадает в черновики, backup или публичную ссылку;
- data-only template catalog без пользовательского JavaScript, HTML и внешнего CSS;
- миграция старых workspace/public payload и безопасный fallback неизвестных template ID;
- browser contract-тесты всех встроенных тем и сохранения presentation metadata.

Подробная схема и правила расширения описаны в [`docs/TEMPLATES.md`](docs/TEMPLATES.md).

## 🗄️ Что нового в v3.2

- общий serverless-кэш через Upstash Redis REST или совместимые Vercel KV переменные;
- распределённый rate limiting между разными serverless-инстансами;
- stale-while-revalidate и защита от одновременных одинаковых GitHub GraphQL-запросов;
- автоматический memory fallback при отсутствии или временном сбое Redis;
- опциональный denylist для принудительного завершения OAuth-сессий;
- Redis никогда не получает OAuth-токен, текст вакансии или содержимое резюме.

## 🔄 Что нового в v3.1

- приложение проверяет последний стабильный GitHub Release при запуске, возвращении на вкладку и восстановлении сети;
- новый Service Worker скачивается в фоне, но перезагрузка выполняется только после нажатия «Обновить сейчас»;
- уведомление показывает установленную и доступную версии, а также ведёт к release notes;
- ошибки GitHub API не блокируют запуск, offline-режим или работу с локальными черновиками;
- после merge в `main` GitHub Actions автоматически проверяет проект, создаёт тег `vX.Y.Z` и публикует GitHub Release;
- повторный запуск release workflow безопасен: существующие корректные тег и Release не дублируются.

## 🔐 Что нового в v3.0

- опциональный GitHub OAuth-вход через Authorization Code Flow + PKCE S256;
- минимальный scope `read:user`: приватная/internal статистика вкладов для собственного профиля без доступа к коду;
- AES-256-GCM encrypted session в `HttpOnly`, `Secure`, `SameSite=Lax` cookie;
- просмотр статуса сессии, выход и полное отключение с отзывом GitHub grant;
- отдельный cache partition и `no-store` для authenticated self analytics;
- гостевой режим, публичные ссылки, PWA и локальные черновики продолжают работать без OAuth.

## 🚀 Возможности

- анализ публичного GitHub-профиля и репозиториев;
- contribution heatmap и помесячная история языков;
- локальный анализ вакансии;
- локальный Application Kit для отклика и подготовки к интервью;
- сравнение двух профилей;
- выбор и сортировка проектов;
- три visual-темы и отдельный ATS renderer;
- безопасное локальное брендирование резюме;
- экспорт резюме в DOCX, Markdown, TXT и PDF;
- экспорт Application Kit в Markdown и TXT;
- публичные ссылки;
- PWA и offline app shell;
- безопасное автообновление через GitHub Releases;
- локальные черновики, автосохранение и JSON backup;
- светлая, тёмная и системная темы;
- русский и английский интерфейс.

## 📬 Application Kit

После нажатия «Сопоставить с профилем» приложение использует только структурированный результат существующего vacancy analysis:

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "tone": "balanced",
  "profile": {
    "name": "Octo Cat",
    "login": "octocat"
  },
  "matchScore": 67,
  "coverLetter": "...",
  "evidence": [],
  "gapPlan": [],
  "interviewQuestions": [],
  "privacy": "..."
}
```

Текст вакансии не передаётся генератору пакета. UI-модуль не использует `fetch`, `localStorage` или `sessionStorage`. После перезагрузки пакет исчезает, если пользователь не сохранил его локально через Markdown/TXT export.

Режим `concise` ограничивает письмо и количество вопросов, `balanced` подходит для обычного отклика, `detailed` добавляет больше project evidence и тем для технического интервью. Все результаты редактируются перед копированием или скачиванием.

## 🎛️ Шаблоны и брендирование

Контент резюме и presentation schema разделены. DOCX, Markdown и TXT не зависят от visual-темы. Черновик и публичная ссылка сохраняют только allowlisted поля:

```json
{
  "schemaVersion": 1,
  "templateId": "visual-studio",
  "templateVersion": 1,
  "visualTemplateId": "visual-studio",
  "accent": "#0f766e",
  "font": "inter",
  "density": "comfortable",
  "spacing": "normal"
}
```

Неизвестный или слишком новый template ID автоматически заменяется на `visual-classic` или `ats-basic`. Пользовательский логотип живёт только как временный `blob:` URL в текущей вкладке и никогда не сериализуется.

## 📦 Форматы экспорта

| Формат | Назначение | Особенности |
|---|---|---|
| DOCX | Редактирование и отправка рекрутеру | Настоящий текст, A4, стили заголовков, кликабельные ссылки, metadata |
| Markdown | GitHub, портфолио и ручное редактирование | YAML metadata, читаемые секции и ссылки |
| ATS PDF | Системы подбора персонала | Простой печатный макет с выделяемым текстом |
| Visual PDF | Презентационная версия | Выбранная visual-тема, брендирование и диаграмма навыков |
| TXT | Максимально простой текстовый экспорт | UTF-8, локализованные заголовки |
| Application Kit Markdown/TXT | Отклик и подготовка к интервью | Редактируемый локальный текст без server-side генерации |

DOCX создаётся модулем `js/docx-export.mjs` как стандартный OOXML ZIP-пакет. Файл не зависит от serverless API и создаётся из текущего отредактированного черновика.

## 🌐 Архитектура локализации

```text
index.html
  └─ data-i18n / data-i18n-placeholder / data-i18n-aria-label

js/i18n.mjs
  ├─ ru dictionary
  ├─ en dictionary
  ├─ t(key, variables, locale)
  ├─ setLocale(locale)
  └─ applyTranslations(document)
```

Application Kit содержит собственный компактный RU/EN словарь, но берёт текущую локаль из общего состояния приложения.

### Добавление новой локали

1. Добавьте код языка в `SUPPORTED_LOCALES`.
2. Создайте словарь с тем же набором ключей.
3. Добавьте option в `#localeSelect`.
4. Добавьте соответствующие строки Application Kit.
5. Запустите `npm run verify`.

## 🔗 Публичные ссылки и черновики

Payload публичной ссылки v4 содержит локаль и совместимую presentation schema. Старые payload v2/v3 открываются через миграцию. Каждый локальный черновик также хранит собственный язык, шаблон и пользовательский текст. JSON backup переносит тему, язык, историю профилей и все черновики.

Application Kit намеренно не входит в workspace draft, backup или public share. Исходный vacancy text также не сериализуется.

## ☁️ Развёртывание

Для полной GitHub GraphQL-аналитики добавьте в Vercel:

```text
GITHUB_TOKEN=ваш_токен
```

Токен используется только serverless-функцией `api/github.js`. Экспорт DOCX/Markdown и Application Kit работает и без этой переменной.

## 🏷️ Версии, GitHub Releases и автообновление

Версия задаётся в `package.json` и дублируется в `js/version.mjs` и Service Worker. Runtime metadata страницы синхронизируется из `js/version.mjs`. Автоматические тесты и release workflow проверяют совпадение версий.

После merge версии в `main` workflow `.github/workflows/release.yml`:

1. запускает `npm run verify`;
2. проверяет строгий SemVer `X.Y.Z`;
3. извлекает заметки из секции `## vX.Y.Z` в `CHANGELOG.md`;
4. создаёт аннотированный тег `vX.Y.Z`;
5. публикует GitHub Release.

Установленное PWA обращается только к публичному endpoint `releases/latest`. Ответ проверяется, а внешняя ссылка принимается только с домена GitHub и из репозитория `Onmaynec/Auto-resume`. Новый app shell остаётся в состоянии waiting до подтверждения пользователя, поэтому редактирование резюме не прерывается внезапной перезагрузкой.

## 🧱 Redis/KV для production

Для общего кэша и rate limiting между serverless-инстансами задайте:

```text
UPSTASH_REDIS_REST_URL=https://…upstash.io
UPSTASH_REDIS_REST_TOKEN=…
RATE_LIMIT_SECRET=случайная_строка
```

Также поддерживаются алиасы `KV_REST_API_URL` и `KV_REST_API_TOKEN`. Без этих переменных используется memory fallback. `SESSION_DENYLIST_ENABLED=true` включает распределённое завершение сессий; в Redis записываются только HMAC-хэш идентификатора сессии и время отзыва с TTL.

## 🔑 Настройка GitHub OAuth

1. Создайте GitHub OAuth App.
2. Укажите callback: `https://ваш-домен/api/auth/callback`.
3. Добавьте в Vercel переменные из `.env.example`: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` и случайный `SESSION_SECRET` длиной не менее 32 символов.
4. Выполните новый deployment.

Auto Resume запрашивает только `read:user`. Этот scope добавляет собственные private/internal contributions, но не даёт доступа к коду приватных репозиториев. Токен не попадает в HTML, URL, JavaScript или `localStorage`. Подробности и ограничения описаны в [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## ▶️ Локальный запуск

```bash
git clone https://github.com/Onmaynec/Auto-resume.git
cd Auto-resume
npm install
npx playwright install chromium
node scripts/test-server.mjs --port=4173 --quality-stubs
```

## ✅ Проверка

```bash
npm run verify
npm run docs:check
npm run test:e2e
npm run test:lighthouse
```

Проверяются JavaScript-модули, RU/EN словари, ZIP/OOXML-структура DOCX, presentation schema, Application Kit schema и exporters, миграции черновиков и публичных ссылок, renderer contracts, PWA shell, update lifecycle, governance Markdown/links, Issue Forms, browser flows, accessibility и Lighthouse budgets.

## 🤲 Участие и безопасность

Перед изменениями прочитайте [`CONTRIBUTING.md`](CONTRIBUTING.md) и [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Обычные дефекты и предложения создаются через структурированные Issue Forms.

Не публикуйте токены, cookies, client secrets, Redis credentials, private repository data, исходный текст закрытой вакансии или конфиденциальное содержимое резюме. Уязвимости сообщаются только через процесс в [`SECURITY.md`](SECURITY.md).

## 🔐 Приватность

- анализируются только публичные данные GitHub;
- текст вакансии обрабатывается локально и не входит в Application Kit schema;
- Application Kit существует только в памяти вкладки до локального export;
- настройки, язык и черновики находятся в браузере;
- custom logo остаётся временным object URL текущей вкладки;
- DOCX, Markdown, TXT, PDF и Application Kit exports формируются локально;
- `/api/*` не кэшируется Service Worker;
- проверка Releases не передаёт содержимое резюме;
- публичное резюме хранится в URL-фрагменте пользователя и не содержит vacancy text или Application Kit.

## 📜 Лицензия

MIT © Onmaynec
