# Template system — Auto Resume 3.9

Presentation settings remain separate from resume content. Built-ins are `visual-classic`, `visual-studio`, `visual-minimal` and `ats-basic`.

The versioned presentation object stores template ID/version, visual fallback, accent, system font, density and spacing. Unsupported values use safe built-in fallbacks.

Custom logo is local-only via temporary `blob:` URL and is never serialized. Template catalog definitions are data-only and cannot inject executable code, arbitrary HTML or external CSS.

Application Kit, Audit, Tracker, Interview Prep and Offer Lab are independent from presentation state. Theme changes must not alter scores, records, local decision data or text-based exports. Cross-feature references never carry presentation metadata.

Renderers receive sanitized resume data; project URLs are HTTPS-only. New templates require renderer/migration tests, Chromium coverage and `npm run verify`, `npm run test:e2e`, `npm run test:lighthouse`.
