# Pull request

## Что меняется

Опишите проблему, решение и влияние.

Closes #

## Тип

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Tests / CI
- [ ] Security / privacy
- [ ] Release metadata

## Проверка

- [ ] `npm run verify`
- [ ] `npm run docs:check` для documentation/templates/links
- [ ] `npm run test:e2e` для UI/OAuth/export/storage/sharing/PWA/Kit/Audit/Tracker/Prep
- [ ] `npm run test:lighthouse` для shell/styling/loading/accessibility
- [ ] Artifacts/logs не содержат secrets или private data

## Контракты

- [ ] RU/EN localization синхронна
- [ ] Privacy boundaries сохранены
- [ ] Accessibility и keyboard navigation учтены
- [ ] Existing drafts/public links/exports/migrations остаются compatible
- [ ] Application Kit не получает raw vacancy text
- [ ] Resume Audit не переписывает draft автоматически
- [ ] Tracker хранит только draft reference и не попадает в workspace/share/API/Redis
- [ ] Interview Prep копирует из Tracker только application ID/company/role, не хранит raw vacancy/resume/Kit/Audit и не описывает readiness как hiring prediction
- [ ] API changes учитывают methods, headers, cookies, CSRF, rate limits и redaction
- [ ] Required runtime file добавлен в `APP_SHELL`
- [ ] Для visual changes приложены redacted screenshots или N/A

## Release

- [ ] Version files синхронны
- [ ] `CHANGELOG.md` содержит `## vX.Y.Z`
- [ ] Tag не создавался вручную

## Screenshots

N/A или redacted before/after screenshots.
