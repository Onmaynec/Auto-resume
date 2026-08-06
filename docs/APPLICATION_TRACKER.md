# Application Tracker — Auto Resume 3.9

Application Tracker остаётся отдельной local database `auto-resume:application-tracker:v1` для company/role, HTTPS vacancy URL, status, dates, notes и small draft reference `{id, name}`.

Tracker не копирует resume content. Status/follow-up logic, dedicated JSON import/export и CSV formula-injection protection остаются без изменений.

Interview Prep и Offer Decision Lab могут ссылаться на application только через `id`, `company` и `role`. Tracker notes, vacancy URL, dates и полный record в эти модули не копируются.

Tracker не получает обратно Prep answers/readiness или Offer ratings/compensation. Все три хранилища независимы.

Tracker data исключены из workspace backup, public share, API, Redis/KV и analytics. Public read-only mode скрывает panel. Dedicated JSON export нужен перед clearing site data.
