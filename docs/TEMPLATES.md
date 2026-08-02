# Auto Resume template system

Auto Resume 3.3 uses a versioned, data-driven presentation schema. Resume content remains independent from visual styling, so DOCX, Markdown and TXT exports continue to use the same resume model regardless of the selected browser theme.

## Built-in templates

| ID | Version | Mode | Purpose |
|---|---:|---|---|
| `visual-classic` | 1 | Visual | Balanced default layout with a skills chart |
| `visual-studio` | 1 | Visual | Editorial dark header and portfolio cards |
| `visual-minimal` | 1 | Visual | Monochrome layout with generous whitespace |
| `ats-basic` | 1 | ATS | Single-column, machine-readable fallback |

The editor also supports a safe system-font allowlist, compact/comfortable/spacious density, section spacing and a six-digit accent color. The accent is checked against a white background using the WCAG contrast-ratio formula. A warning is shown below 4.5:1.

## Presentation schema

Drafts, backups and public links store only this normalized object:

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

Unknown template IDs, incompatible future template versions and mode mismatches fall back to `visual-classic` or `ats-basic`. Old v2/v3 public links and workspace v1 backups are migrated during normalization.

`visualTemplateId` remembers the last visual theme while the user temporarily switches to ATS mode. This keeps ATS export simple without losing the preferred visual design.

## Custom logo privacy

A custom logo is accepted only from a local `File` object and rendered through `URL.createObjectURL()`.

- accepted formats: PNG, JPEG, WebP and SVG;
- maximum size: 2 MB;
- the object URL exists only in the current browser tab;
- it is revoked when replaced or removed;
- it is not written to local drafts, JSON backups or public links;
- it is not uploaded to Auto Resume or a third-party server.

ATS mode ignores the logo and all decorative accent settings.

## Data-only third-party definitions

A marketplace entry may describe a template only as JSON-compatible data. It cannot provide JavaScript, HTML, CSS URLs, event handlers or executable expressions.

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

Allowed renderer families are `classic`, `studio`, `minimal` and `ats`. Allowed capabilities are `accent`, `density`, `font`, `logo` and `spacing`. `normalizeTemplateDefinition()` rejects invalid IDs, unknown renderers, impossible mode/renderer combinations and unsupported capabilities. `createTemplateCatalog()` ignores duplicate IDs and never executes definition content.

Adding a new renderer still requires a reviewed source-code change. Marketplace data may select and configure a reviewed renderer, but it cannot introduce arbitrary code.

## Renderer contract

Every renderer receives the same sanitized model:

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

Renderers must escape all text. Project links accept HTTPS only. Image sources accept local relative files, HTTPS avatars and temporary `blob:` URLs created by the local logo control. External stylesheets and arbitrary HTML are never accepted from a template definition.

## Adding a built-in template

1. Add a data definition to `BUILT_IN_TEMPLATES` in `js/template-system.mjs`.
2. Reuse one of the reviewed renderer families or add a reviewed internal renderer.
3. Add theme-specific CSS under `TEMPLATE_STYLES`; do not use `@import` or external URLs.
4. Add a deterministic renderer fingerprint to `tests/template-system.test.mjs`.
5. Extend `tests/e2e/templates.spec.mjs` with browser assertions for layout, accessibility and persistence.
6. Run:

```bash
npm run verify
npm run test:e2e
npm run test:lighthouse
```

## Compatibility rules

- Increment `templateVersion` only when a template ID changes its rendering contract incompatibly.
- Increment `schemaVersion` only when the presentation object itself changes incompatibly.
- Continue accepting older supported versions through explicit migration.
- Never silently interpret a newer version with older code; use the safe fallback.
- Keep `ats-basic` available even when visual themes evolve.
