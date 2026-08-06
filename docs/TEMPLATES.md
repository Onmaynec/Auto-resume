# Template system — Auto Resume 3.4

Auto Resume хранит presentation settings отдельно от resume content. Поэтому Visual/ATS оформление можно менять без переписывания DOCX, Markdown или TXT.

## Встроенные шаблоны

| ID | Mode |
| --- | --- |
| `visual-classic` | visual |
| `visual-studio` | visual |
| `visual-minimal` | visual |
| `ats-basic` | ATS |

Presentation schema versioned и содержит template ID/version, visual fallback, accent, системный font, density и spacing. Неизвестные или несовместимые значения нормализуются к безопасному built-in template.

Custom logo принимается только как локальный файл до 2 MB и отображается через temporary `blob:` URL. Он не сохраняется в drafts, backup или public links и не используется ATS renderer.

Template catalog — data-only. Definition не может поставлять JavaScript, arbitrary HTML, event handlers или external CSS. Новый renderer требует обычного source-code review.

Renderer получает sanitized resume model и normalized presentation model. Text escaping обязателен; project links — HTTPS-only.

При добавлении template обновите definitions, renderer tests, Chromium scenario и документацию. Затем запустите `npm run verify`, `npm run test:e2e` и `npm run test:lighthouse`.
