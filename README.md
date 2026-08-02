# ✨ Auto Resume v3.3

> GitHub-профиль превращается в адаптированное, редактируемое и публичное резюме на русском или английском языке.

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
- сравнение двух профилей;
- выбор и сортировка проектов;
- три visual-темы и отдельный ATS renderer;
- безопасное локальное брендирование резюме;
- экспорт в DOCX, Markdown, TXT и PDF;
- публичные ссылки;
- PWA и offline app shell;
- безопасное автообновление через GitHub Releases;
- локальные черновики, автосохранение и JSON backup;
- светлая, тёмная и системная темы;
- русский и английский интерфейс.

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

### Добавление новой локали

1. Добавьте код языка в `SUPPORTED_LOCALES`.
2. Создайте словарь с тем же набором ключей.
3. Добавьте option в `#localeSelect`.
4. Запустите `npm run verify`.

## 🔗 Публичные ссылки и черновики

Payload публичной ссылки v4 содержит локаль и совместимую presentation schema. Старые payload v2/v3 открываются через миграцию. Каждый локальный черновик также хранит собственный язык, шаблон и пользовательский текст. JSON backup переносит тему, язык, историю профилей и все черновики.

## ☁️ Развёртывание

Для полной GitHub GraphQL-аналитики добавьте в Vercel:

```text
GITHUB_TOKEN=ваш_токен
```

Токен используется только serverless-функцией `api/github.js`. Экспорт DOCX/Markdown работает и без этой переменной.

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

Auto Resume запрашивает только `read:user`. Этот scope добавляет собственные private/internal contributions, но не даёт доступа к коду приватных репозиториев. Токен не попадает в HTML, URL, JavaScript или `localStorage`. Подробности и ограничения описаны в `docs/THREAT_MODEL.md`.

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
npm run test:e2e
npm run test:lighthouse
```

Проверяются JavaScript-модули, RU/EN словари, ZIP/OOXML-структура DOCX, presentation schema, миграции черновиков и публичных ссылок, renderer contracts, PWA shell, update lifecycle, browser flows, accessibility и Lighthouse budgets.

## 🔐 Приватность

- анализируются только публичные данные GitHub;
- текст вакансии обрабатывается локально;
- настройки, язык и черновики находятся в браузере;
- custom logo остаётся временным object URL текущей вкладки;
- DOCX, Markdown, TXT и PDF формируются локально;
- `/api/*` не кэшируется Service Worker;
- проверка Releases не передаёт содержимое резюме;
- публичное резюме хранится в URL-фрагменте пользователя.

## 📜 Лицензия

MIT © Onmaynec
