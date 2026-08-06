# Template system

Система шаблонов Auto Resume отделяет содержимое резюме от его оформления. Один и тот же resume model используется для браузерного preview, DOCX, Markdown и TXT, а visual/ATS режимы меняют только presentation layer.

## Встроенные шаблоны

| ID | Версия | Режим | Назначение |
| --- | ---: | --- | --- |
| `visual-classic` | 1 | Visual | базовый сбалансированный макет |
| `visual-studio` | 1 | Visual | более выразительный layout с тёмным header |
| `visual-minimal` | 1 | Visual | монохромный вариант с большим количеством свободного пространства |
| `ats-basic` | 1 | ATS | простой одноколоночный layout для систем подбора |

Пользователь также может выбрать системный шрифт, плотность, интервалы и шестизначный accent color. Контраст акцентного цвета проверяется относительно белого фона; ниже 4.5:1 интерфейс показывает предупреждение.

## Presentation schema

В drafts, backups и public links сохраняется только нормализованный объект оформления:

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

Неизвестный template ID, несовместимая будущая версия или конфликт mode/renderer приводит к безопасному fallback на `visual-classic` или `ats-basic`.

`visualTemplateId` хранит последний visual template, когда пользователь временно переключается в ATS mode. Благодаря этому ATS export остаётся простым, а выбранный визуальный дизайн не теряется.

Старые v2/v3 public links и workspace v1 backups проходят явную миграцию при нормализации.

## Custom logo

Логотип принимается только из локального `File` и отображается через `URL.createObjectURL()`.

Ограничения:

- PNG, JPEG, WebP или SVG;
- максимум 2 MB;
- object URL существует только в текущей вкладке;
- старый URL отзывается при замене или удалении логотипа;
- logo не записывается в local drafts, JSON backups или public links;
- файл не загружается на Auto Resume или сторонний сервер.

ATS mode игнорирует logo и декоративные accent settings.

## Сторонние определения шаблонов

Внешнее определение шаблона является только данными. Оно может выбрать уже проверенный renderer и его возможности, но не может принести исполняемый код.

Пример:

```js
{
  id: 'partner-clean',
  version: 1,
  name: 'Partner Clean',
  description: 'A restrained partner theme.',
  mode: 'visual',
  renderer: 'minimal',
  capabilities: ['accent', 'font', 'spacing'],
  defaultAccent: '#334155'
}
```

Разрешённые renderer families:

- `classic`;
- `studio`;
- `minimal`;
- `ats`.

Разрешённые capabilities:

- `accent`;
- `density`;
- `font`;
- `logo`;
- `spacing`.

`normalizeTemplateDefinition()` отклоняет некорректные ID, неизвестные renderer, несовместимые mode/renderer и неподдерживаемые capabilities. `createTemplateCatalog()` игнорирует duplicate IDs и не исполняет содержимое definition.

Новый renderer всё равно требует обычного изменения исходного кода и code review. Data definition не может добавлять JavaScript, HTML, event handlers, внешние CSS URLs или выражения для выполнения.

## Renderer contract

Каждый renderer получает одинаковую санитизированную модель:

```text
resume model
  ├─ name, headline, contact, about
  ├─ projects[]: name, description, HTTPS URL
  ├─ skills[]: name, percentage/value
  └─ user: avatar metadata

presentation model
  ├─ template id + compatible version
  ├─ allowlisted font/density/spacing
  └─ validated six-digit accent color
```

Текст должен экранироваться перед вставкой в HTML. Project links принимают только HTTPS. Image sources ограничены локальными relative files, HTTPS avatars и временными `blob:` URL от custom-logo control.

Внешние stylesheets и произвольный HTML из template definition не поддерживаются.

## Как добавить встроенный шаблон

1. Добавьте data definition в `BUILT_IN_TEMPLATES` в `js/template-system.mjs`.
2. Используйте существующий renderer family или добавьте новый внутренний renderer отдельным изменением кода.
3. Добавьте theme-specific CSS в `TEMPLATE_STYLES`; без `@import` и внешних URL.
4. Обновите deterministic renderer fingerprint в `tests/template-system.test.mjs`.
5. Добавьте browser assertions в `tests/e2e/templates.spec.mjs`.
6. Запустите проверки:

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
```

## Совместимость

- `templateVersion` меняется только при несовместимом изменении конкретного template ID.
- `schemaVersion` меняется только при несовместимом изменении presentation object.
- Старые поддерживаемые версии должны проходить явную migration.
- Более новую неизвестную версию нельзя молча интерпретировать старым кодом — используется fallback.
- `ats-basic` должен оставаться доступным независимо от развития visual templates.