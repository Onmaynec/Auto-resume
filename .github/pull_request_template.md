# Pull request

## Что меняется

Опишите проблему, решение и влияние на пользователя/разработку.

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
- [ ] `npm run docs:check` при изменении documentation/links/templates
- [ ] `npm run test:e2e` для UI/OAuth/export/storage/sharing/PWA/Application Kit
- [ ] `npm run test:lighthouse` для shell/styling/loading/accessibility
- [ ] Logs/artifacts не содержат secrets или private data

## Контракты

- [ ] RU/EN localization синхронна
- [ ] Privacy/security boundaries сохранены
- [ ] Accessibility и keyboard navigation учтены
- [ ] Drafts/public links/exports/migrations остаются compatible
- [ ] Application Kit не получает raw vacancy text и не превращает missing skills в опыт
- [ ] API changes учитывают methods, headers, cookies, CSRF, rate limits и redaction
- [ ] Новый runtime file добавлен в `APP_SHELL`
- [ ] Для visual changes приложены redacted screenshots или N/A

## Release

- [ ] `package.json`, `js/version.mjs`, `sw.js` синхронны
- [ ] `CHANGELOG.md` содержит matching `## vX.Y.Z`
- [ ] Release tag не создавался вручную

## Screenshots

N/A или redacted before/after screenshots.
