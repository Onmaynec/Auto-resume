# Template system — Auto Resume 3.5

Presentation settings remain separate from resume content. Built-ins: `visual-classic`, `visual-studio`, `visual-minimal`, `ats-basic`.

The versioned presentation object stores template ID/version, visual fallback, accent, system font, density and spacing. Unknown/future-incompatible values use a safe built-in fallback.

Custom logo is local-only: accepted as a browser `File`, displayed with a temporary `blob:` URL and never serialized into drafts, backup, public share or Application Kit.

Template catalog definitions are data-only. They cannot inject JavaScript, arbitrary HTML, event handlers or external CSS. Renderers receive sanitized resume data; project links are HTTPS-only.

Application Kit is independent from presentation settings. Changing a resume theme must not alter kit content or its Markdown/TXT export.

When changing templates, add unit/migration/renderer coverage, Chromium assertions and run `npm run verify`, `npm run test:e2e` and `npm run test:lighthouse`.
