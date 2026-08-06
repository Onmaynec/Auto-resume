# Pull request

## Что меняется

Кратко опишите проблему, выбранное решение и влияние на пользователя или разработку.

Closes #

## Тип изменения

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Tests / CI
- [ ] Security / privacy
- [ ] Release metadata

## Проверка

- [ ] `npm run verify`
- [ ] `npm run docs:check` — если менялись documentation, templates или links
- [ ] `npm run test:e2e` — для UI, OAuth, export, storage, sharing, PWA, Application Kit, Audit, Tracker или Interview Prep
- [ ] `npm run test:lighthouse` — для shell, styling, loading или accessibility
- [ ] Logs и failure artifacts не содержат secrets/private data

## Контракты проекта

- [ ] RU/EN localization осталась синхронной
- [ ] Privacy и security boundaries не расширены случайно
- [ ] Accessibility, keyboard navigation, labels и reduced motion учтены
- [ ] Existing drafts, public links, exports и migrations остаются compatible
- [ ] Application Kit не получает raw vacancy text и не заявляет missing skills как опыт
- [ ] Resume Audit не переписывает пользовательский draft автоматически
- [ ] Tracker хранит только draft ID/name и остаётся вне workspace/share/API/Redis
- [ ] Interview Prep получает из Tracker только application ID/company/role, не копирует raw vacancy/resume/Kit/Audit и не трактует readiness как hiring prediction
- [ ] API changes учитывают methods, headers, cookies, CSRF, rate limits и redaction
- [ ] Новый обязательный runtime file добавлен в `APP_SHELL`
- [ ] Для visual changes приложены redacted screenshots или указано N/A
- [ ] Tests используют synthetic fixtures

## Release

Заполняется только при изменении версии.

- [ ] `package.json`, `js/version.mjs` и `sw.js` содержат один SemVer
- [ ] `CHANGELOG.md` содержит matching `## vX.Y.Z`
- [ ] Release tag не создавался вручную до прохождения CI

## Screenshots

N/A или приложите redacted before/after screenshots.
