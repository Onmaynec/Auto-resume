export const RESUME_AUDIT_SCHEMA_VERSION = 1;
export const RESUME_AUDIT_CATEGORY_MAX = 25;

const LOCALES = new Set(['ru', 'en']);
const MAX_PROJECTS = 8;
const MAX_SKILLS = 20;
const MAX_REQUIREMENTS = 30;
const MAX_ISSUES = 16;
const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

const COPY = {
  ru: {
    categories: { completeness: 'Полнота', evidence: 'Доказательность', ats: 'ATS-готовность', readability: 'Читаемость' },
    grades: { strong: 'Сильное резюме', good: 'Хорошая основа', needsWork: 'Нужны улучшения', weak: 'Требуется доработка' },
    reportTitle: 'Аудит качества резюме',
    score: 'Итоговый балл',
    issuesTitle: 'Рекомендации',
    noIssues: 'Критичных рекомендаций не найдено.',
    severity: { critical: 'Критично', warning: 'Важно', info: 'Совет' },
    stats: 'Статистика',
    words: 'слов',
    projects: 'проектов',
    skills: 'навыков',
    coverage: 'покрытие требований',
    privacy: 'Отчёт создан локально. Исходный текст вакансии и содержимое резюме не отправляются на сервер.',
    issues: {
      NAME_MISSING: ['Добавьте имя', 'Укажите имя или профессиональный псевдоним.'],
      HEADLINE_MISSING: ['Добавьте профессиональный заголовок', 'Сформулируйте роль и 1–3 ключевые специализации.'],
      HEADLINE_LENGTH: ['Скорректируйте заголовок', 'Оставьте примерно 20–100 символов без длинного перечня технологий.'],
      CONTACT_MISSING: ['Добавьте контакты', 'Укажите GitHub, email или другой проверяемый способ связи.'],
      SUMMARY_MISSING: ['Добавьте краткое описание', 'Сделайте профессиональное summary с направлением и сильными сторонами.'],
      SUMMARY_LENGTH: ['Уточните summary', 'Оптимальная длина summary — примерно 60–600 символов.'],
      PROJECTS_MISSING: ['Добавьте проекты', 'Добавьте минимум два релевантных проекта с результатом и HTTPS-ссылкой.'],
      PROJECT_COUNT_LOW: ['Добавьте ещё один проект', 'Два-три релевантных проекта дают больше проверяемых доказательств.'],
      SKILLS_MISSING: ['Добавьте навыки', 'Укажите подтверждённые навыки, которые видны в проектах.'],
      SKILL_COUNT: ['Скорректируйте список навыков', 'Оставьте примерно 4–15 наиболее релевантных навыков.'],
      PROJECT_URL_INVALID: ['Исправьте ссылки проектов', 'Используйте только рабочие HTTPS-ссылки.'],
      PROJECT_DESCRIPTION_WEAK: ['Усильте описания проектов', 'Опишите задачу, действие, технологию и проверяемый результат.'],
      METRICS_MISSING: ['Добавьте измеримые результаты', 'Где возможно, добавьте числа: производительность, охват, время, тесты или объём.'],
      ACTION_VERBS_MISSING: ['Начинайте с действия', 'Используйте глаголы: разработал, внедрил, оптимизировал, автоматизировал.'],
      DUPLICATE_PROJECT_TEXT: ['Уберите повторяющиеся описания', 'Каждый проект должен показывать отдельную задачу и результат.'],
      KEYWORD_GAPS: ['Проверьте требования вакансии', 'Добавляйте только подтверждённые ключевые слова; пробелы не выдавайте за опыт.'],
      TEXT_TOO_SHORT: ['Добавьте содержательности', 'Резюме слишком короткое для уверенной оценки опыта.'],
      TEXT_TOO_LONG: ['Сократите резюме', 'Уберите повторы и оставьте наиболее релевантные доказательства.'],
      EXCESSIVE_SYMBOLS: ['Упростите символы', 'Для ATS используйте обычный текст и минимум декоративных символов или emoji.'],
      LONG_SENTENCES: ['Сократите длинные предложения', 'Разделите длинные предложения, чтобы их было легче сканировать.'],
      PROJECT_DESCRIPTION_LENGTH: ['Скорректируйте описания', 'Держите описание проекта примерно в диапазоне 60–320 символов.'],
      REPETITIVE_WORDING: ['Разнообразьте формулировки', 'Не начинайте большинство описаний одним и тем же словом.'],
    },
  },
  en: {
    categories: { completeness: 'Completeness', evidence: 'Evidence', ats: 'ATS readiness', readability: 'Readability' },
    grades: { strong: 'Strong resume', good: 'Good foundation', needsWork: 'Needs improvement', weak: 'Requires revision' },
    reportTitle: 'Resume Quality Audit',
    score: 'Overall score',
    issuesTitle: 'Recommendations',
    noIssues: 'No important recommendations were found.',
    severity: { critical: 'Critical', warning: 'Important', info: 'Tip' },
    stats: 'Statistics',
    words: 'words',
    projects: 'projects',
    skills: 'skills',
    coverage: 'requirement coverage',
    privacy: 'This report is generated locally. The vacancy text and resume content are not sent to a server.',
    issues: {
      NAME_MISSING: ['Add your name', 'Include your name or professional alias.'],
      HEADLINE_MISSING: ['Add a professional headline', 'State the target role and one to three core specializations.'],
      HEADLINE_LENGTH: ['Adjust the headline', 'Keep it around 20–100 characters instead of listing every technology.'],
      CONTACT_MISSING: ['Add contact details', 'Include GitHub, email or another verifiable contact method.'],
      SUMMARY_MISSING: ['Add a summary', 'Write a professional summary with your direction and strengths.'],
      SUMMARY_LENGTH: ['Refine the summary', 'A useful summary is usually around 60–600 characters.'],
      PROJECTS_MISSING: ['Add projects', 'Include at least two relevant projects with outcomes and HTTPS links.'],
      PROJECT_COUNT_LOW: ['Add another project', 'Two or three relevant projects provide stronger verifiable evidence.'],
      SKILLS_MISSING: ['Add skills', 'List verified skills demonstrated by your projects.'],
      SKILL_COUNT: ['Refine the skill list', 'Keep roughly 4–15 of the most relevant verified skills.'],
      PROJECT_URL_INVALID: ['Fix project links', 'Use working HTTPS links only.'],
      PROJECT_DESCRIPTION_WEAK: ['Strengthen project descriptions', 'Describe the problem, action, technology and verifiable outcome.'],
      METRICS_MISSING: ['Add measurable outcomes', 'Where possible, add numbers for performance, reach, time, tests or scale.'],
      ACTION_VERBS_MISSING: ['Lead with action verbs', 'Use verbs such as built, implemented, optimized or automated.'],
      DUPLICATE_PROJECT_TEXT: ['Remove repeated descriptions', 'Each project should demonstrate a distinct problem and outcome.'],
      KEYWORD_GAPS: ['Review vacancy requirements', 'Add only verified keywords; never present missing skills as experience.'],
      TEXT_TOO_SHORT: ['Add more evidence', 'The resume is too short to demonstrate experience confidently.'],
      TEXT_TOO_LONG: ['Shorten the resume', 'Remove repetition and retain the most relevant evidence.'],
      EXCESSIVE_SYMBOLS: ['Simplify decorative symbols', 'For ATS, prefer plain text and minimize decorative symbols or emoji.'],
      LONG_SENTENCES: ['Shorten long sentences', 'Split long sentences so recruiters can scan them quickly.'],
      PROJECT_DESCRIPTION_LENGTH: ['Adjust project descriptions', 'Keep each description roughly between 60 and 320 characters.'],
      REPETITIVE_WORDING: ['Vary the wording', 'Avoid starting most descriptions with the same word.'],
    },
  },
};

export function normalizeResumeAuditInput(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const rawDraft = source.draft && typeof source.draft === 'object' ? source.draft : {};
  const locale = LOCALES.has(source.locale) ? source.locale : LOCALES.has(rawDraft.locale) ? rawDraft.locale : 'ru';
  const projects = Array.isArray(rawDraft.projects)
    ? rawDraft.projects.slice(0, MAX_PROJECTS).map((project) => ({
      name: cleanText(project?.name, 120),
      url: safeHttpsUrl(project?.url),
      description: cleanText(project?.description, 600),
    }))
    : [];
  const skills = Array.isArray(rawDraft.skills)
    ? uniqueStrings(rawDraft.skills.map((skill) => typeof skill === 'string' ? skill : skill?.name), MAX_SKILLS, 80)
    : [];
  return {
    schemaVersion: RESUME_AUDIT_SCHEMA_VERSION,
    locale,
    draft: {
      name: cleanText(rawDraft.name, 160),
      headline: cleanText(rawDraft.headline, 240),
      contact: cleanText(rawDraft.contact, 500),
      about: cleanText(rawDraft.about, 1600),
      projects,
      skills,
    },
    requirements: uniqueStrings(source.requirements, MAX_REQUIREMENTS, 80),
  };
}

export function auditResume(input = {}) {
  const normalized = normalizeResumeAuditInput(input);
  const { draft, locale, requirements } = normalized;
  const issues = [];
  const deductions = { completeness: 0, evidence: 0, ats: 0, readability: 0 };

  const addIssue = (code, severity, category, deduction, context = {}) => {
    if (!COPY[locale].issues[code] || issues.some((issue) => issue.code === code)) return;
    const [title, action] = COPY[locale].issues[code];
    issues.push({ code, severity, category, title, action, context: sanitizeContext(context) });
    deductions[category] = Math.min(RESUME_AUDIT_CATEGORY_MAX, deductions[category] + deduction);
  };

  if (!draft.name) addIssue('NAME_MISSING', 'critical', 'completeness', 5);
  if (!draft.headline) {
    addIssue('HEADLINE_MISSING', 'critical', 'completeness', 5);
    deductions.readability = Math.min(RESUME_AUDIT_CATEGORY_MAX, deductions.readability + 4);
  } else if (draft.headline.length < 20 || draft.headline.length > 100) addIssue('HEADLINE_LENGTH', 'warning', 'readability', 4, { length: draft.headline.length });
  if (!hasContact(draft.contact)) addIssue('CONTACT_MISSING', 'critical', 'completeness', 4);
  if (!draft.about) {
    addIssue('SUMMARY_MISSING', 'critical', 'completeness', 6);
    deductions.readability = Math.min(RESUME_AUDIT_CATEGORY_MAX, deductions.readability + 10);
  } else if (draft.about.length < 60 || draft.about.length > 600) addIssue('SUMMARY_LENGTH', 'warning', 'readability', 5, { length: draft.about.length });
  if (!draft.projects.length) {
    addIssue('PROJECTS_MISSING', 'critical', 'completeness', 5);
    deductions.evidence = RESUME_AUDIT_CATEGORY_MAX;
  } else if (draft.projects.length < 2) addIssue('PROJECT_COUNT_LOW', 'warning', 'completeness', 2, { count: draft.projects.length });
  if (!draft.skills.length) addIssue('SKILLS_MISSING', 'critical', 'completeness', 5);
  else if (draft.skills.length < 4 || draft.skills.length > 15) addIssue('SKILL_COUNT', 'warning', 'ats', 4, { count: draft.skills.length });

  const invalidLinks = draft.projects.filter((project) => !project.url).length;
  if (invalidLinks) addIssue('PROJECT_URL_INVALID', 'warning', 'evidence', Math.min(5, invalidLinks * 2), { count: invalidLinks });
  const weakDescriptions = draft.projects.filter((project) => wordCount(project.description) < 8).length;
  if (weakDescriptions) addIssue('PROJECT_DESCRIPTION_WEAK', 'warning', 'evidence', Math.min(6, weakDescriptions * 2), { count: weakDescriptions });
  if (draft.projects.length && !draft.projects.some((project) => hasMetric(project.description))) addIssue('METRICS_MISSING', 'info', 'evidence', 6);
  const actionProjects = draft.projects.filter((project) => hasActionVerb(project.description)).length;
  if (draft.projects.length && actionProjects < Math.ceil(draft.projects.length / 2)) addIssue('ACTION_VERBS_MISSING', 'warning', 'evidence', 5, { count: actionProjects });
  if (hasDuplicateDescriptions(draft.projects)) addIssue('DUPLICATE_PROJECT_TEXT', 'warning', 'evidence', 4);

  const fullText = resumePlainText(draft);
  const words = wordsOf(fullText);
  if (words.length < 90) addIssue('TEXT_TOO_SHORT', 'warning', 'ats', 5, { words: words.length });
  if (words.length > 900) addIssue('TEXT_TOO_LONG', 'warning', 'ats', 5, { words: words.length });
  const symbolRatio = decorativeSymbolRatio(fullText);
  if (symbolRatio > 0.018) addIssue('EXCESSIVE_SYMBOLS', 'warning', 'ats', 3, { ratio: Number(symbolRatio.toFixed(3)) });

  const normalizedText = normalizeToken(fullText);
  const matchedRequirements = requirements.filter((requirement) => normalizedText.includes(normalizeToken(requirement)));
  const missingRequirements = requirements.filter((requirement) => !matchedRequirements.includes(requirement));
  const requirementCoverage = requirements.length ? Math.round((matchedRequirements.length / requirements.length) * 100) : 100;
  if (requirements.length && missingRequirements.length) {
    const deduction = Math.min(10, Math.max(2, Math.round((missingRequirements.length / requirements.length) * 10)));
    addIssue('KEYWORD_GAPS', 'info', 'ats', deduction, { missing: missingRequirements.slice(0, 8), coverage: requirementCoverage });
  }

  const sentenceLengths = sentenceWordCounts([draft.about, ...draft.projects.map((project) => project.description)].join('. '));
  const longSentences = sentenceLengths.filter((count) => count > 30).length;
  if (longSentences) addIssue('LONG_SENTENCES', 'info', 'readability', Math.min(5, longSentences * 2), { count: longSentences });
  const poorlySizedProjects = draft.projects.filter((project) => project.description && (project.description.length < 60 || project.description.length > 320)).length;
  if (poorlySizedProjects) addIssue('PROJECT_DESCRIPTION_LENGTH', 'info', 'readability', Math.min(5, poorlySizedProjects * 2), { count: poorlySizedProjects });
  if (hasRepetitiveOpenings(draft.projects)) addIssue('REPETITIVE_WORDING', 'info', 'readability', 4);

  const categories = Object.fromEntries(Object.keys(deductions).map((key) => [key, {
    id: key,
    label: COPY[locale].categories[key],
    score: Math.max(0, RESUME_AUDIT_CATEGORY_MAX - deductions[key]),
    max: RESUME_AUDIT_CATEGORY_MAX,
  }]));
  const score = Object.values(categories).reduce((total, category) => total + category.score, 0);
  const grade = score >= 85 ? 'strong' : score >= 70 ? 'good' : score >= 50 ? 'needsWork' : 'weak';

  return {
    schemaVersion: RESUME_AUDIT_SCHEMA_VERSION,
    locale,
    score,
    grade,
    gradeLabel: COPY[locale].grades[grade],
    categories,
    issues: issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.code.localeCompare(b.code)).slice(0, MAX_ISSUES),
    stats: {
      words: words.length,
      projects: draft.projects.length,
      skills: draft.skills.length,
      requirements: requirements.length,
      matchedRequirements: matchedRequirements.length,
      requirementCoverage,
    },
  };
}

export function buildResumeAuditMarkdown(reportInput = {}) {
  const report = normalizeReport(reportInput);
  const copy = COPY[report.locale];
  const lines = [
    `# ${copy.reportTitle}`,
    '',
    `- ${copy.score}: **${report.score}/100** — ${report.gradeLabel}`,
    `- ${copy.stats}: ${report.stats.words} ${copy.words}, ${report.stats.projects} ${copy.projects}, ${report.stats.skills} ${copy.skills}, ${report.stats.requirementCoverage}% ${copy.coverage}`,
    '',
    '## Categories',
    '',
    ...Object.values(report.categories).map((category) => `- **${category.label}:** ${category.score}/${category.max}`),
    '',
    `## ${copy.issuesTitle}`,
    '',
  ];
  if (!report.issues.length) lines.push(copy.noIssues);
  else report.issues.forEach((issue) => lines.push(`- **[${copy.severity[issue.severity]}] ${issue.title}** (\`${issue.code}\`): ${issue.action}`));
  lines.push('', `> ${copy.privacy}`);
  return lines.join('\n').trim() + '\n';
}

export function buildResumeAuditText(reportInput = {}) {
  return buildResumeAuditMarkdown(reportInput)
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^>\s?/gm, '')
    .trim() + '\n';
}

export function resumeAuditFilename(login, locale = 'ru', extension = 'md') {
  const safeLogin = cleanText(login, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'developer';
  return `${safeLogin}-resume-audit-${LOCALES.has(locale) ? locale : 'ru'}.${extension === 'txt' ? 'txt' : 'md'}`;
}

function normalizeReport(reportInput) {
  const source = reportInput && typeof reportInput === 'object' ? reportInput : {};
  const locale = LOCALES.has(source.locale) ? source.locale : 'ru';
  const categories = {};
  for (const key of ['completeness', 'evidence', 'ats', 'readability']) {
    categories[key] = {
      id: key,
      label: COPY[locale].categories[key],
      score: clampInteger(source.categories?.[key]?.score, 0, RESUME_AUDIT_CATEGORY_MAX),
      max: RESUME_AUDIT_CATEGORY_MAX,
    };
  }
  const score = Object.values(categories).reduce((total, category) => total + category.score, 0);
  const grade = score >= 85 ? 'strong' : score >= 70 ? 'good' : score >= 50 ? 'needsWork' : 'weak';
  const issues = Array.isArray(source.issues) ? source.issues.slice(0, MAX_ISSUES).map((issue) => {
    if (!COPY[locale].issues[issue?.code]) return null;
    const [title, action] = COPY[locale].issues[issue.code];
    const severity = ['critical', 'warning', 'info'].includes(issue.severity) ? issue.severity : 'warning';
    return { code: issue.code, severity, title, action };
  }).filter(Boolean) : [];
  return {
    schemaVersion: RESUME_AUDIT_SCHEMA_VERSION,
    locale,
    score,
    grade,
    gradeLabel: COPY[locale].grades[grade],
    categories,
    issues,
    stats: {
      words: clampInteger(source.stats?.words, 0, 10000),
      projects: clampInteger(source.stats?.projects, 0, MAX_PROJECTS),
      skills: clampInteger(source.stats?.skills, 0, MAX_SKILLS),
      requirements: clampInteger(source.stats?.requirements, 0, MAX_REQUIREMENTS),
      matchedRequirements: clampInteger(source.stats?.matchedRequirements, 0, MAX_REQUIREMENTS),
      requirementCoverage: clampInteger(source.stats?.requirementCoverage, 0, 100),
    },
  };
}

function cleanText(value, maxLength) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function uniqueStrings(values, limit, maxLength) {
  if (!Array.isArray(values)) return [];
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const text = cleanText(value, maxLength);
    const key = normalizeToken(text);
    if (!text || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

function sanitizeContext(context) {
  const output = {};
  if (!context || typeof context !== 'object') return output;
  for (const key of ['count', 'length', 'words', 'coverage']) {
    if (Number.isFinite(context[key])) output[key] = clampInteger(context[key], 0, 10000);
  }
  if (Number.isFinite(context.ratio)) output.ratio = Math.max(0, Math.min(1, context.ratio));
  if (Array.isArray(context.missing)) output.missing = uniqueStrings(context.missing, 8, 80);
  return output;
}

function hasContact(value) {
  return /(?:https:\/\/|github\.com\/|linkedin\.com\/|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(value);
}

function hasMetric(value) {
  return /(?:\b\d+(?:[.,]\d+)?\s?(?:%|x|ms|s|sec|seconds?|мин|час|дн|users?|requests?|tests?|пользоват|запрос|тест)|\b(?:increased|reduced|improved|снизил|увеличил|ускорил)\b)/i.test(value);
}

function hasActionVerb(value) {
  return /\b(?:built|created|developed|implemented|designed|optimized|automated|migrated|integrated|improved|reduced|increased|разработал|создал|внедрил|спроектировал|оптимизировал|автоматизировал|мигрировал|интегрировал|улучшил|снизил|увеличил)\w*/i.test(value);
}

function hasDuplicateDescriptions(projects) {
  const seen = new Set();
  for (const project of projects) {
    const key = normalizeToken(project.description);
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function hasRepetitiveOpenings(projects) {
  const openings = projects.map((project) => wordsOf(project.description)[0]?.toLowerCase()).filter(Boolean);
  if (openings.length < 3) return false;
  const counts = new Map();
  openings.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  return Math.max(...counts.values()) >= Math.ceil(openings.length * 0.67);
}

function resumePlainText(draft) {
  return [draft.name, draft.headline, draft.contact, draft.about, ...draft.skills, ...draft.projects.flatMap((project) => [project.name, project.description])]
    .filter(Boolean)
    .join('. ');
}

function wordsOf(value) {
  return String(value || '').match(/[\p{L}\p{N}+#.%-]+/gu) || [];
}

function wordCount(value) {
  return wordsOf(value).length;
}

function sentenceWordCounts(value) {
  return String(value || '').split(/[.!?]+/).map((sentence) => wordCount(sentence)).filter(Boolean);
}

function decorativeSymbolRatio(value) {
  const text = String(value || '');
  if (!text.length) return 0;
  const symbols = text.match(/[^\p{L}\p{N}\s.,:;!?%+/#@()[\]_-]/gu) || [];
  return symbols.length / text.length;
}

function normalizeToken(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}+#]+/gu, '');
}

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}
