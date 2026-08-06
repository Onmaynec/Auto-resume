# Template system — Auto Resume 3.3

Presentation settings are versioned data. Resume content stays in the existing resume model, so changing a visual theme does not rewrite DOCX/Markdown/TXT output.

## Built-in templates

| ID | Mode | Renderer |
| --- | --- | --- |
| `visual-classic` | visual | classic |
| `visual-studio` | visual | studio |
| `visual-minimal` | visual | minimal |
| `ats-basic` | ATS | ats |

The editor also supports an allowlist of system fonts, density/spacing controls and a six-digit accent color. Accent contrast against white is checked and the UI warns below 4.5:1.

## Stored presentation data

Drafts, backups and public links persist only the normalized presentation object:

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

Unknown template IDs, unsupported future versions and mode/renderer mismatches fall back to a reviewed built-in template. Older workspace/public payloads are migrated during normalization.

## Custom logo

The logo control accepts a local PNG, JPEG, WebP or SVG up to 2 MB and displays it through `URL.createObjectURL()`.

The object URL exists only in the current tab, is revoked when replaced/removed and is never serialized into drafts, backups or public links. ATS mode ignores decorative logo/accent settings.

## Data-only catalog

External template definitions may select and configure a reviewed renderer but cannot provide executable code. Definitions containing invalid IDs, unknown renderers, unsupported capabilities or impossible mode/renderer combinations are rejected.

Allowed renderer families are `classic`, `studio`, `minimal` and `ats`. A genuinely new renderer requires a source-code change and review.

## Renderer contract

Every renderer receives sanitized resume content plus normalized presentation data. Text must be escaped; project links are HTTPS-only. Image sources are limited to allowed local/HTTPS sources and temporary local `blob:` URLs.

External stylesheets, `@import`, arbitrary HTML and event-handler code are not accepted from template definitions.

## Adding a built-in template

1. Add a data definition to `BUILT_IN_TEMPLATES` in `js/template-system.mjs`.
2. Use an existing reviewed renderer or add a reviewed internal renderer.
3. Add theme CSS without external imports.
4. Add deterministic renderer/migration tests.
5. Add a Chromium scenario for rendering, persistence and accessibility.
6. Run `npm run verify`, `npm run test:e2e` and `npm run test:lighthouse`.

Increment `templateVersion` for an incompatible template rendering contract and `schemaVersion` only for incompatible presentation-object changes. Never silently interpret a newer schema with older code.
