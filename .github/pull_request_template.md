# Pull request

## Summary

Describe the problem, the chosen solution, and the user or developer impact.

Closes #

## Change type

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Tests or CI
- [ ] Security or privacy
- [ ] Release metadata

## Validation

- [ ] `npm run verify`
- [ ] `npm run docs:check` when documentation, templates, or links changed
- [ ] `npm run test:e2e` for user-visible, OAuth, export, storage, sharing, or PWA changes
- [ ] `npm run test:lighthouse` for shell, styling, loading, or accessibility changes
- [ ] Failure artifacts and logs contain no secrets or private data

## Quality checklist

- [ ] RU and EN localization keys and copy remain aligned
- [ ] Privacy and security boundaries are preserved
- [ ] Accessibility, keyboard navigation, labels, and reduced motion were considered
- [ ] Existing drafts, public links, exports, and legacy migrations remain compatible
- [ ] New or changed API endpoints enforce method, headers, cookies, CSRF, rate limits, and redacted logs
- [ ] Required runtime files were added to the PWA `APP_SHELL`
- [ ] Screenshots or recordings are attached for visual changes, or marked not applicable
- [ ] Tests use synthetic fixtures and do not contain credentials or confidential resume data

## Release checklist

Complete this section only when the version changes.

- [ ] `package.json`, `js/version.mjs`, and `sw.js` use the same SemVer
- [ ] `CHANGELOG.md` contains the matching `## vX.Y.Z` section
- [ ] The branch will be merged through CI; no release tag was created manually

## Screenshots

Not applicable, or attach redacted before/after screenshots.
