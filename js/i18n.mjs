export const SUPPORTED_LOCALES = ['ru', 'en'];
const dictionaries = {
  ru: {
    'meta.title': 'Auto Resume v2.3 — GitHub Resume Generator',
    'meta.description': 'Auto Resume v2.3 — двуязычный PWA-генератор резюме по GitHub с локальными черновиками, сравнением профилей и ATS-экспортом.',
    'meta.ogDescription': 'GitHub-профиль → адаптированное резюме на русском или английском, локальные черновики и публичная ссылка.',
    'nav.main': 'Основная навигация', 'nav.language': 'Язык', 'nav.theme': 'Тема',
    'theme.system': 'Системная', 'theme.dark': 'Тёмная', 'theme.light': 'Светлая',
    'nav.install': 'Установить', 'network.online': 'Онлайн', 'network.offline': 'Офлайн',
    'skip': 'Перейти к содержимому', 'shared.banner': 'Публичное резюме · данные зашиты в ссылку и не хранятся на сервере',
    'hero.eyebrow': 'GitHub + вакансия → персональное резюме',
    'hero.title': 'Покажите рекрутеру именно те навыки, которые он ищет.',
    'hero.description': 'Приложение анализирует профиль, историю языков и требования вакансии, сравнивает разработчиков и сохраняет редактируемые резюме локально.',
    'search.label': 'GitHub username', 'search.placeholder': 'GitHub username, например torvalds', 'search.button': 'Анализировать',
    'recent.title': 'Недавние профили', 'common.clear': 'Очистить',
    'workspace.kicker': 'Локальное рабочее пространство', 'workspace.title': 'Черновики и резервные копии',
    'workspace.freshness.empty': 'GitHub-данные ещё не загружены',
    'workspace.note': 'Черновики, тема, язык и история профилей хранятся только в этом браузере. Резервная копия позволяет перенести их на другое устройство.',
    'workspace.draftName': 'Название черновика', 'workspace.draftPlaceholder': 'Например: Frontend Developer — Acme',
    'workspace.save': 'Сохранить черновик', 'workspace.export': 'Экспорт JSON', 'workspace.import': 'Импорт JSON', 'workspace.clearCache': 'Очистить API-кэш',
    'privacy.microcopy': 'Используются публичные данные. История, черновики и настройки остаются в вашем браузере.',
    'overview.kicker': 'Обзор', 'overview.title': 'Ключевые показатели',
    'compare.kicker': 'Сравнение', 'compare.title': 'Сравнение GitHub-профилей', 'compare.public': 'публичные данные',
    'compare.note': 'Введите второй username, чтобы сравнить активность, популярность проектов и пересечение технологий.',
    'compare.label': 'Username второго профиля', 'compare.placeholder': 'Второй GitHub username', 'compare.button': 'Сравнить', 'compare.loading': 'Сравниваем…',
    'tips.kicker': 'Profile boost', 'tips.title': 'Подсказки по улучшению',
    'activity.lastYear': 'Последние 12 месяцев', 'activity.title': 'Активность', 'activity.calendar': 'Календарь активности',
    'activity.less': 'Меньше', 'activity.more': 'Больше', 'activity.monthly': 'По месяцам', 'activity.dynamics': 'Динамика активности',
    'languages.kicker': 'Реальная commit-активность', 'languages.title': 'История языков по месяцам', 'languages.pill': 'по primary language репозитория',
    'languages.note': 'График группирует реальные commit contributions пользователя по основному языку репозитория в каждом месяце.',
    'languages.empty': 'История языков недоступна в экономном REST-режиме.',
    'vacancy.kicker': 'Подбор под вакансию', 'vacancy.title': 'Анализ вакансии', 'vacancy.pill': 'локальный анализ · без отправки текста ИИ',
    'vacancy.note': 'Вставьте требования вакансии. Приложение найдёт технологии, сравнит их с профилем и поднимет самые релевантные проекты.',
    'vacancy.label': 'Описание вакансии', 'vacancy.placeholder': 'Вставьте описание вакансии: стек, обязанности, обязательные и желательные навыки…',
    'vacancy.analyze': 'Сопоставить с профилем',
    'repos.kicker': 'Портфолио', 'repos.title': 'Репозитории',
    'projects.kicker': 'Конструктор', 'projects.title': 'Проекты для резюме',
    'projects.note': 'Выберите до пяти проектов. Перетаскивайте выбранные карточки или используйте стрелки, чтобы задать порядок.',
    'generate.kicker': 'Следующий шаг', 'generate.title': 'Соберите адаптированное резюме',
    'generate.note': 'Если вакансия проанализирована, заголовок, описание и проекты будут ориентированы на её требования.', 'generate.button': 'Сгенерировать резюме ✨',
    'editor.kicker': 'Редактор', 'editor.title': 'Ваше резюме',
    'editor.note': 'Нажмите на любой текст в макете, чтобы изменить его. Изменения активного черновика сохраняются автоматически.',
    'editor.template': 'Шаблон резюме', 'editor.copy': 'Копировать текст', 'editor.txt': 'Скачать TXT', 'editor.visualPdf': 'Визуальный PDF',
    'editor.atsPdf': 'Сохранить ATS PDF', 'editor.share': 'Скопировать публичную ссылку',
    'editor.shareNote': 'Публичная ссылка содержит резюме в URL-фрагменте. Сервер его не хранит и не получает.',
    'footer': 'GitHub GraphQL API · Auto Resume v2.3 · RU/EN, PWA, локальные черновики и резервные копии',
    'profile.kicker': 'Профиль', 'profile.noBio': 'Описание профиля пока не добавлено.', 'profile.noLocation': 'Не указано',
    'profile.followers': '{count} подписчиков', 'profile.repositories': '{count} репозиториев',
    'metrics.stars': 'Звёзд', 'metrics.forks': 'Форков', 'metrics.commitsYear': 'Коммитов за год', 'metrics.commitsFallback': 'Коммитов*', 'metrics.languages': 'Языков',
    'tips.bio': 'Добавьте био с ролью, специализацией и ключевым стеком.',
    'tips.location': 'Укажите локацию или формат работы: remote / hybrid / onsite.', 'tips.projects': 'Добавьте минимум три содержательных проекта.',
    'tips.descriptions': 'Добавьте описания репозиториев: задача, стек и результат.', 'tips.readme': 'Улучшите README: демо, скриншоты и инструкция запуска повышают доверие.',
    'tips.history': 'История языков доступна в полном Vercel-режиме с GITHUB_TOKEN.',
    'heatmap.day': '{date}: {count} вкладов', 'heatmap.total': '{count} вкладов', 'heatmap.fallback': ' · экономный режим',
    'chart.contributions': 'Вклады', 'chart.commits': 'Коммиты',
    'repos.count': '{count} проектов', 'repos.noDescription': 'Описание не добавлено.', 'repos.empty': 'Публичные репозитории не найдены.',
    'vacancy.match': 'совпадение требований', 'vacancy.matched': 'Совпало', 'vacancy.noneMatched': 'Совпадения не найдены',
    'vacancy.missing': 'Не найдено в профиле', 'vacancy.noGaps': 'Критичных пробелов нет',
    'vacancy.summary.none': 'В вакансии не найдено совпадений с публичным GitHub-профилем. Добавьте релевантные проекты или уточните описание вакансии.',
    'vacancy.summary.strong': 'Профиль показывает сильное соответствие требованиям.', 'vacancy.summary.partial': 'Профиль показывает частичное соответствие требованиям.',
    'vacancy.summary.initial': 'Профиль показывает начальное соответствие требованиям.', 'vacancy.summary.confirmed': 'Подтверждённые навыки: {skills}.',
    'vacancy.summary.develop': 'Стоит подтвердить или развить: {skills}.',
    'projects.selected': '{count}/{limit} выбрано', 'projects.noDescription': 'Описание не добавлено', 'projects.up': 'Выше', 'projects.down': 'Ниже', 'projects.drag': 'Перетащите для сортировки',
    'compare.common': 'Общие технологии', 'compare.noCommon': 'Общие технологии в топ-5 не найдены',
    'compare.metrics.followers': 'Подписчики', 'compare.metrics.repos': 'Публичные репозитории', 'compare.metrics.stars': 'Звёзды проектов',
    'compare.metrics.forks': 'Форки проектов', 'compare.metrics.contributions': 'Вклады за год', 'compare.metrics.commits': 'Коммиты за год',
    'resume.visualLabel': 'GitHub Resume', 'resume.atsLabel': 'Professional Resume', 'resume.about': 'О себе', 'resume.projects': 'Проекты', 'resume.skills': 'Навыки',
    'resume.avatarAlt': 'Аватар {name}', 'resume.developer': 'разработчик', 'resume.software': 'Software',
    'resume.followers': '{count} подписчиков', 'resume.publicCommits': '{count} публичных коммитов за год',
    'resume.activity.high': 'высокую', 'resume.activity.stable': 'стабильную', 'resume.activity.growing': 'развивающуюся',
    'resume.aboutText': '{bio}Разработчик с публичным портфолио из {projects} проектов. Основной технологический фокус: {languages}. За последние 12 месяцев проявил {activity} активность — {commits} публичных коммитов и {contributions} вкладов.{vacancy}',
    'resume.softwareDevelopment': 'разработка программного обеспечения', 'resume.vacancySkills': ' Для целевой позиции подтверждены навыки: {skills}.',
    'resume.stackUnknown': 'не указан', 'resume.projectFallback': 'Проект на {language}.', 'resume.modernStack': 'современном технологическом стеке',
    'resume.projectDescription': '{description} Стек: {stack}. {stars} ★, {forks} форков.',
    'resume.text.link': 'Ссылка', 'resume.text.notSpecified': 'Не указаны', 'resume.text.about': 'О СЕБЕ', 'resume.text.projects': 'ПРОЕКТЫ', 'resume.text.skills': 'НАВЫКИ',
    'draft.empty': 'Сохранённых черновиков пока нет.', 'draft.open': 'Открыть', 'draft.rename': 'Переименовать', 'draft.delete': 'Удалить',
    'draft.renamePrompt': 'Новое название черновика', 'draft.deleteConfirm': 'Удалить черновик «{name}»?', 'draft.defaultName': 'Резюме @{login}',
    'draft.unknownDate': 'дата неизвестна',
    'status.primaryRequired': 'Сначала загрузите основной GitHub-профиль.', 'status.compareInvalid': 'Некорректный username для сравнения.',
    'status.compareDifferent': 'Для сравнения выберите другой GitHub-профиль.', 'status.compared': 'Профили {left} и {right} сопоставлены.',
    'status.vacancyShort': 'Добавьте более подробное описание вакансии — минимум 40 символов.',
    'status.vacancyDone': 'Вакансия проанализирована. Проекты и заголовок резюме адаптированы под требования.',
    'status.usernameInvalid': 'Некорректный GitHub username. Используйте латинские буквы, цифры и дефисы.',
    'status.loading': 'Анализируем профиль, проекты, активность и историю языков…',
    'status.cached': 'Показаны кэшированные данные.', 'status.proxyLoaded': 'Годовая аналитика загружена через безопасный API-прокси.',
    'status.requestsLeft': ' Осталось запросов GitHub: {count}.',
    'status.fallback': 'Включён экономный режим. История языков и точная годовая активность доступны после развёртывания на Vercel с GITHUB_TOKEN.',
    'status.resumeFirst': 'Сначала сгенерируйте или откройте резюме.', 'status.draftSaved': 'Черновик «{name}» сохранён локально.',
    'status.draftOpened': 'Открыт локальный черновик «{name}».', 'status.backupSaved': 'Резервная копия сохранена.',
    'status.backupImported': 'Импортировано черновиков: {count}.', 'status.cacheCleared': 'Удалено кэшированных профилей: {count}. Черновики и настройки сохранены.',
    'status.installed': 'Auto Resume установлен как приложение.',
    'freshness.cleared': 'API-кэш очищен', 'freshness.cache': 'кэш', 'freshness.fresh': 'свежие данные', 'freshness.source': 'Источник: {source}', 'freshness.unknown': 'неизвестен',
    'export.copied': 'Скопировано ✓', 'export.linkCopied': 'Ссылка скопирована ✓', 'export.creatingPdf': 'Создаём PDF…',
    'errors.userNotFound': 'Пользователь не найден. Проверьте username.', 'errors.rateLimit': 'Лимит GitHub API исчерпан. Он восстановится примерно в {time}.',
    'errors.rateLimitGeneric': 'Лимит GitHub API исчерпан. Попробуйте позже.', 'errors.proxy': 'Ошибка API-прокси: {status}',
    'errors.github': 'GitHub API вернул ошибку {status}.', 'errors.profileLoad': 'Не удалось загрузить данные GitHub.',
    'errors.compareLoad': 'Не удалось загрузить второй профиль.', 'errors.backupJson': 'Файл не является корректным JSON.',
    'errors.backupType': 'Это не резервная копия Auto Resume.', 'errors.backupNewer': 'Резервная копия создана более новой версией приложения.',
    'errors.backupImport': 'Не удалось импортировать резервную копию.', 'errors.shareDamaged': 'Ссылка резюме повреждена или слишком длинная.',
    'errors.shareVersion': 'Неподдерживаемая версия публичного резюме.', 'errors.shareLarge': 'Публичное резюме слишком большое.',
    'errors.shareOpen': 'Не удалось открыть публичное резюме.',
  },
  en: {
    'meta.title': 'Auto Resume v2.3 — GitHub Resume Generator',
    'meta.description': 'Auto Resume v2.3 — a bilingual PWA resume generator powered by GitHub, with local drafts, profile comparison and ATS export.',
    'meta.ogDescription': 'Turn a GitHub profile into a tailored resume in English or Russian, with local drafts and a public link.',
    'nav.main': 'Main navigation', 'nav.language': 'Language', 'nav.theme': 'Theme',
    'theme.system': 'System', 'theme.dark': 'Dark', 'theme.light': 'Light',
    'nav.install': 'Install', 'network.online': 'Online', 'network.offline': 'Offline',
    'skip': 'Skip to content', 'shared.banner': 'Public resume · data is embedded in the link and is not stored on the server',
    'hero.eyebrow': 'GitHub + job description → tailored resume',
    'hero.title': 'Show recruiters the skills they are actually looking for.',
    'hero.description': 'Analyze a profile, language history and job requirements, compare developers, and keep editable resumes locally.',
    'search.label': 'GitHub username', 'search.placeholder': 'GitHub username, for example torvalds', 'search.button': 'Analyze',
    'recent.title': 'Recent profiles', 'common.clear': 'Clear',
    'workspace.kicker': 'Local workspace', 'workspace.title': 'Drafts and backups',
    'workspace.freshness.empty': 'GitHub data has not been loaded yet',
    'workspace.note': 'Drafts, theme, language and profile history stay in this browser. A backup lets you move them to another device.',
    'workspace.draftName': 'Draft name', 'workspace.draftPlaceholder': 'For example: Frontend Developer — Acme',
    'workspace.save': 'Save draft', 'workspace.export': 'Export JSON', 'workspace.import': 'Import JSON', 'workspace.clearCache': 'Clear API cache',
    'privacy.microcopy': 'Only public data is used. History, drafts and settings stay in your browser.',
    'overview.kicker': 'Overview', 'overview.title': 'Key metrics',
    'compare.kicker': 'Comparison', 'compare.title': 'Compare GitHub profiles', 'compare.public': 'public data',
    'compare.note': 'Enter a second username to compare activity, project popularity and shared technologies.',
    'compare.label': 'Second profile username', 'compare.placeholder': 'Second GitHub username', 'compare.button': 'Compare', 'compare.loading': 'Comparing…',
    'tips.kicker': 'Profile boost', 'tips.title': 'Improvement suggestions',
    'activity.lastYear': 'Last 12 months', 'activity.title': 'Activity', 'activity.calendar': 'Activity calendar',
    'activity.less': 'Less', 'activity.more': 'More', 'activity.monthly': 'By month', 'activity.dynamics': 'Activity trend',
    'languages.kicker': 'Real commit activity', 'languages.title': 'Monthly language history', 'languages.pill': 'by repository primary language',
    'languages.note': 'The chart groups the user’s real commit contributions by each repository’s primary language for every month.',
    'languages.empty': 'Language history is unavailable in REST fallback mode.',
    'vacancy.kicker': 'Job matching', 'vacancy.title': 'Job description analysis', 'vacancy.pill': 'local analysis · no AI text upload',
    'vacancy.note': 'Paste the job requirements. The app will identify technologies, compare them with the profile and rank the most relevant projects.',
    'vacancy.label': 'Job description', 'vacancy.placeholder': 'Paste the job description: stack, responsibilities, required and preferred skills…',
    'vacancy.analyze': 'Match with profile',
    'repos.kicker': 'Portfolio', 'repos.title': 'Repositories',
    'projects.kicker': 'Builder', 'projects.title': 'Resume projects',
    'projects.note': 'Select up to five projects. Drag selected cards or use the arrows to set their order.',
    'generate.kicker': 'Next step', 'generate.title': 'Build a tailored resume',
    'generate.note': 'After job analysis, the headline, summary and projects will focus on the target requirements.', 'generate.button': 'Generate resume ✨',
    'editor.kicker': 'Editor', 'editor.title': 'Your resume',
    'editor.note': 'Click any text in the layout to edit it. Changes to the active draft are saved automatically.',
    'editor.template': 'Resume template', 'editor.copy': 'Copy text', 'editor.txt': 'Download TXT', 'editor.visualPdf': 'Visual PDF',
    'editor.atsPdf': 'Save ATS PDF', 'editor.share': 'Copy public link',
    'editor.shareNote': 'The public link contains the resume in the URL fragment. The server does not store or receive it.',
    'footer': 'GitHub GraphQL API · Auto Resume v2.3 · RU/EN, PWA, local drafts and backups',
    'profile.kicker': 'Profile', 'profile.noBio': 'No profile description yet.', 'profile.noLocation': 'Not specified',
    'profile.followers': '{count} followers', 'profile.repositories': '{count} repositories',
    'metrics.stars': 'Stars', 'metrics.forks': 'Forks', 'metrics.commitsYear': 'Commits this year', 'metrics.commitsFallback': 'Commits*', 'metrics.languages': 'Languages',
    'tips.bio': 'Add a bio with your role, specialization and core stack.',
    'tips.location': 'Add a location or work format: remote / hybrid / onsite.', 'tips.projects': 'Add at least three substantial projects.',
    'tips.descriptions': 'Add repository descriptions with the problem, stack and result.', 'tips.readme': 'Improve README files with demos, screenshots and setup instructions.',
    'tips.history': 'Language history is available in full Vercel mode with GITHUB_TOKEN.',
    'heatmap.day': '{date}: {count} contributions', 'heatmap.total': '{count} contributions', 'heatmap.fallback': ' · fallback mode',
    'chart.contributions': 'Contributions', 'chart.commits': 'Commits',
    'repos.count': '{count} projects', 'repos.noDescription': 'No description provided.', 'repos.empty': 'No public repositories found.',
    'vacancy.match': 'requirements match', 'vacancy.matched': 'Matched', 'vacancy.noneMatched': 'No matches found',
    'vacancy.missing': 'Not found in profile', 'vacancy.noGaps': 'No critical gaps',
    'vacancy.summary.none': 'No overlap was found between the job description and the public GitHub profile. Add relevant projects or refine the job description.',
    'vacancy.summary.strong': 'The profile shows a strong match with the requirements.', 'vacancy.summary.partial': 'The profile shows a partial match with the requirements.',
    'vacancy.summary.initial': 'The profile shows an early match with the requirements.', 'vacancy.summary.confirmed': 'Confirmed skills: {skills}.',
    'vacancy.summary.develop': 'Consider proving or developing: {skills}.',
    'projects.selected': '{count}/{limit} selected', 'projects.noDescription': 'No description provided', 'projects.up': 'Move up', 'projects.down': 'Move down', 'projects.drag': 'Drag to reorder',
    'compare.common': 'Shared technologies', 'compare.noCommon': 'No shared technologies in the top five',
    'compare.metrics.followers': 'Followers', 'compare.metrics.repos': 'Public repositories', 'compare.metrics.stars': 'Project stars',
    'compare.metrics.forks': 'Project forks', 'compare.metrics.contributions': 'Yearly contributions', 'compare.metrics.commits': 'Yearly commits',
    'resume.visualLabel': 'GitHub Resume', 'resume.atsLabel': 'Professional Resume', 'resume.about': 'About', 'resume.projects': 'Projects', 'resume.skills': 'Skills',
    'resume.avatarAlt': '{name} avatar', 'resume.developer': 'Developer', 'resume.software': 'Software',
    'resume.followers': '{count} followers', 'resume.publicCommits': '{count} public commits this year',
    'resume.activity.high': 'high', 'resume.activity.stable': 'consistent', 'resume.activity.growing': 'growing',
    'resume.aboutText': '{bio}Developer with a public portfolio of {projects} projects. Main technology focus: {languages}. Over the last 12 months, the profile shows {activity} activity with {commits} public commits and {contributions} contributions.{vacancy}',
    'resume.softwareDevelopment': 'software development', 'resume.vacancySkills': ' Confirmed skills for the target role: {skills}.',
    'resume.stackUnknown': 'not specified', 'resume.projectFallback': 'A project built with {language}.', 'resume.modernStack': 'a modern technology stack',
    'resume.projectDescription': '{description} Stack: {stack}. {stars} ★, {forks} forks.',
    'resume.text.link': 'Link', 'resume.text.notSpecified': 'Not specified', 'resume.text.about': 'ABOUT', 'resume.text.projects': 'PROJECTS', 'resume.text.skills': 'SKILLS',
    'draft.empty': 'No saved drafts yet.', 'draft.open': 'Open', 'draft.rename': 'Rename', 'draft.delete': 'Delete',
    'draft.renamePrompt': 'New draft name', 'draft.deleteConfirm': 'Delete draft “{name}”?', 'draft.defaultName': 'Resume @{login}',
    'draft.unknownDate': 'unknown date',
    'status.primaryRequired': 'Load the primary GitHub profile first.', 'status.compareInvalid': 'Invalid username for comparison.',
    'status.compareDifferent': 'Choose a different GitHub profile for comparison.', 'status.compared': 'Profiles {left} and {right} were compared.',
    'status.vacancyShort': 'Add a more detailed job description — at least 40 characters.',
    'status.vacancyDone': 'The job description was analyzed. Projects and the resume headline were tailored to the requirements.',
    'status.usernameInvalid': 'Invalid GitHub username. Use Latin letters, numbers and hyphens.',
    'status.loading': 'Analyzing profile, projects, activity and language history…',
    'status.cached': 'Showing cached data.', 'status.proxyLoaded': 'Yearly analytics loaded through the secure API proxy.',
    'status.requestsLeft': ' GitHub requests remaining: {count}.',
    'status.fallback': 'Fallback mode is active. Language history and accurate yearly activity require a Vercel deployment with GITHUB_TOKEN.',
    'status.resumeFirst': 'Generate or open a resume first.', 'status.draftSaved': 'Draft “{name}” was saved locally.',
    'status.draftOpened': 'Opened local draft “{name}”.', 'status.backupSaved': 'Backup saved.',
    'status.backupImported': 'Imported drafts: {count}.', 'status.cacheCleared': 'Removed cached profiles: {count}. Drafts and settings were preserved.',
    'status.installed': 'Auto Resume was installed as an app.',
    'freshness.cleared': 'API cache cleared', 'freshness.cache': 'cache', 'freshness.fresh': 'fresh data', 'freshness.source': 'Source: {source}', 'freshness.unknown': 'unknown',
    'export.copied': 'Copied ✓', 'export.linkCopied': 'Link copied ✓', 'export.creatingPdf': 'Creating PDF…',
    'errors.userNotFound': 'User not found. Check the username.', 'errors.rateLimit': 'The GitHub API limit is exhausted. It should reset around {time}.',
    'errors.rateLimitGeneric': 'The GitHub API limit is exhausted. Try again later.', 'errors.proxy': 'API proxy error: {status}',
    'errors.github': 'GitHub API returned error {status}.', 'errors.profileLoad': 'Could not load GitHub data.',
    'errors.compareLoad': 'Could not load the second profile.', 'errors.backupJson': 'The file is not valid JSON.',
    'errors.backupType': 'This is not an Auto Resume backup.', 'errors.backupNewer': 'The backup was created by a newer app version.',
    'errors.backupImport': 'Could not import the backup.', 'errors.shareDamaged': 'The resume link is damaged or too long.',
    'errors.shareVersion': 'Unsupported public resume version.', 'errors.shareLarge': 'The public resume is too large.',
    'errors.shareOpen': 'Could not open the public resume.',
  },
};

let activeLocale = 'ru';

export function normalizeLocale(value) {
  const short = String(value || '').toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(short) ? short : 'ru';
}

export function getLocale() { return activeLocale; }

export function setLocale(locale, { apply = true } = {}) {
  activeLocale = normalizeLocale(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = activeLocale;
    if (apply) applyTranslations(document);
  }
  return activeLocale;
}

export function t(key, vars = {}, locale = activeLocale) {
  const normalized = normalizeLocale(locale);
  const template = dictionaries[normalized][key] ?? dictionaries.ru[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

export function dictionaryKeys(locale = 'ru') {
  return Object.keys(dictionaries[normalizeLocale(locale)]).sort();
}

export function applyTranslations(root = document) {
  root.querySelectorAll?.('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
  root.querySelectorAll?.('[data-i18n-placeholder]').forEach((element) => { element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder)); });
  root.querySelectorAll?.('[data-i18n-aria-label]').forEach((element) => { element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel)); });
  root.querySelectorAll?.('[data-i18n-title]').forEach((element) => { element.setAttribute('title', t(element.dataset.i18nTitle)); });
  if (typeof document !== 'undefined') {
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', t('meta.title'));
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', t('meta.ogDescription'));
  }
}

export function formatNumber(value, locale = activeLocale) {
  return Number(value || 0).toLocaleString(normalizeLocale(locale) === 'en' ? 'en-US' : 'ru-RU');
}

export function formatDate(value, options = {}, locale = activeLocale) {
  return new Date(value).toLocaleDateString(normalizeLocale(locale) === 'en' ? 'en-US' : 'ru-RU', options);
}

export function formatDateTime(value, options = {}, locale = activeLocale) {
  return new Date(value).toLocaleString(normalizeLocale(locale) === 'en' ? 'en-US' : 'ru-RU', options);
}

export function translateError(error, fallbackKey = 'errors.profileLoad') {
  const keyByCode = {
    USER_NOT_FOUND: 'errors.userNotFound', RATE_LIMIT: 'errors.rateLimitGeneric', PROXY_ERROR: 'errors.proxy',
    GITHUB_ERROR: 'errors.github', BACKUP_JSON: 'errors.backupJson', BACKUP_TYPE: 'errors.backupType',
    BACKUP_NEWER: 'errors.backupNewer', SHARE_DAMAGED: 'errors.shareDamaged', SHARE_VERSION: 'errors.shareVersion', SHARE_LARGE: 'errors.shareLarge',
  };
  const key = keyByCode[error?.code] || fallbackKey;
  if (error?.code === 'RATE_LIMIT' && error.resetAt) {
    const time = new Date(error.resetAt).toLocaleTimeString(activeLocale === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
    return t('errors.rateLimit', { time });
  }
  return t(key, error?.details || {});
}
