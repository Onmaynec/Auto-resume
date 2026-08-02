export const APPLICATION_KIT_SCHEMA_VERSION = 1;
export const APPLICATION_KIT_TONES = Object.freeze(['concise', 'balanced', 'detailed']);

const LIMITS = Object.freeze({
  concise: { skills: 3, projects: 1, gaps: 2, questions: 4 },
  balanced: { skills: 5, projects: 2, gaps: 3, questions: 6 },
  detailed: { skills: 7, projects: 3, gaps: 5, questions: 8 },
});

export function normalizeApplicationKitInput(input = {}) {
  const locale = input.locale === 'en' ? 'en' : 'ru';
  const tone = APPLICATION_KIT_TONES.includes(input.tone) ? input.tone : 'balanced';
  const profile = normalizeProfile(input.profile);
  const analysis = normalizeAnalysis(input.analysis);
  const projects = normalizeProjects(input.projects);
  return { locale, tone, profile, analysis, projects };
}

export function generateApplicationKit(input = {}) {
  const normalized = normalizeApplicationKitInput(input);
  const { locale, tone, profile, analysis, projects } = normalized;
  const limits = LIMITS[tone];
  const matched = analysis.matched.slice(0, limits.skills);
  const missing = analysis.missing.slice(0, limits.gaps);
  const relevantProjects = rankProjects(projects, [...matched, ...analysis.requirements]).slice(0, limits.projects);
  const evidence = buildEvidence(locale, matched, relevantProjects).slice(0, limits.skills);
  const gapPlan = buildGapPlan(locale, missing).slice(0, limits.gaps);
  const interviewQuestions = buildInterviewQuestions(locale, matched, missing, relevantProjects)
    .slice(0, limits.questions);

  return {
    schemaVersion: APPLICATION_KIT_SCHEMA_VERSION,
    locale,
    tone,
    profile: { name: profile.name, login: profile.login },
    matchScore: analysis.score,
    coverLetter: buildCoverLetter({ locale, tone, profile, matched, missing, projects: relevantProjects }),
    evidence,
    gapPlan,
    interviewQuestions,
    privacy: locale === 'en'
      ? 'Generated locally from the current GitHub profile and vacancy analysis. The vacancy text is not included.'
      : 'Сгенерировано локально из текущего GitHub-профиля и результата анализа. Текст вакансии не включён.',
  };
}

export function normalizeApplicationKit(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const locale = value.locale === 'en' ? 'en' : 'ru';
  const tone = APPLICATION_KIT_TONES.includes(value.tone) ? value.tone : 'balanced';
  return {
    schemaVersion: APPLICATION_KIT_SCHEMA_VERSION,
    locale,
    tone,
    profile: {
      name: cleanText(value.profile?.name, 120) || cleanText(value.profile?.login, 39) || 'Developer',
      login: cleanText(value.profile?.login, 39),
    },
    matchScore: clampNumber(value.matchScore, 0, 100),
    coverLetter: cleanMultiline(value.coverLetter, 5000),
    evidence: normalizeEvidence(value.evidence, locale),
    gapPlan: normalizeGapPlan(value.gapPlan, locale),
    interviewQuestions: uniqueStrings(value.interviewQuestions, 12, 300),
    privacy: cleanText(value.privacy, 300),
  };
}

export function applicationKitToMarkdown(value) {
  const kit = normalizeApplicationKit(value);
  if (!kit) throw new TypeError('INVALID_APPLICATION_KIT');
  const labels = markdownLabels(kit.locale);
  const lines = [
    `# ${labels.title}`,
    '',
    `- ${labels.candidate}: ${escapeMarkdown(kit.profile.name)}${kit.profile.login ? ` (@${escapeMarkdown(kit.profile.login)})` : ''}`,
    `- ${labels.match}: ${kit.matchScore}%`,
    `- ${labels.tone}: ${labels.tones[kit.tone]}`,
    '',
    `## ${labels.letter}`,
    '',
    kit.coverLetter,
    '',
    `## ${labels.evidence}`,
    '',
  ];
  if (kit.evidence.length) {
    for (const item of kit.evidence) {
      const project = item.url
        ? `[${escapeMarkdown(item.project)}](${item.url})`
        : escapeMarkdown(item.project);
      lines.push(`- **${escapeMarkdown(item.skill)}** — ${project}: ${escapeMarkdown(item.proof)}`);
    }
  } else lines.push(`- ${labels.none}`);

  lines.push('', `## ${labels.gaps}`, '');
  if (kit.gapPlan.length) {
    for (const item of kit.gapPlan) lines.push(`- **${escapeMarkdown(item.skill)}** — ${escapeMarkdown(item.action)}`);
  } else lines.push(`- ${labels.noGaps}`);

  lines.push('', `## ${labels.questions}`, '');
  if (kit.interviewQuestions.length) {
    kit.interviewQuestions.forEach((question, index) => lines.push(`${index + 1}. ${escapeMarkdown(question)}`));
  } else lines.push(`1. ${labels.none}`);

  lines.push('', `> ${escapeMarkdown(kit.privacy)}`, '');
  return lines.join('\n');
}

export function applicationKitToText(value) {
  const kit = normalizeApplicationKit(value);
  if (!kit) throw new TypeError('INVALID_APPLICATION_KIT');
  const labels = markdownLabels(kit.locale);
  const lines = [
    labels.title.toUpperCase(),
    `${labels.candidate}: ${kit.profile.name}${kit.profile.login ? ` (@${kit.profile.login})` : ''}`,
    `${labels.match}: ${kit.matchScore}%`,
    `${labels.tone}: ${labels.tones[kit.tone]}`,
    '',
    labels.letter.toUpperCase(),
    kit.coverLetter,
    '',
    labels.evidence.toUpperCase(),
    ...(kit.evidence.length
      ? kit.evidence.map((item) => `- ${item.skill} — ${item.project}: ${item.proof}${item.url ? ` (${item.url})` : ''}`)
      : [`- ${labels.none}`]),
    '',
    labels.gaps.toUpperCase(),
    ...(kit.gapPlan.length
      ? kit.gapPlan.map((item) => `- ${item.skill} — ${item.action}`)
      : [`- ${labels.noGaps}`]),
    '',
    labels.questions.toUpperCase(),
    ...(kit.interviewQuestions.length
      ? kit.interviewQuestions.map((question, index) => `${index + 1}. ${question}`)
      : [`1. ${labels.none}`]),
    '',
    kit.privacy,
    '',
  ];
  return lines.join('\n');
}

export function applicationKitFingerprint(value) {
  const kit = normalizeApplicationKit(value);
  if (!kit) return '';
  return JSON.stringify({
    schemaVersion: kit.schemaVersion,
    locale: kit.locale,
    tone: kit.tone,
    profile: kit.profile,
    matchScore: kit.matchScore,
    coverLetter: kit.coverLetter,
    evidence: kit.evidence,
    gapPlan: kit.gapPlan,
    interviewQuestions: kit.interviewQuestions,
  });
}

export function sanitizeProjectUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:') return '';
    url.username = '';
    url.password = '';
    return url.href;
  } catch {
    return '';
  }
}

function normalizeProfile(profile = {}) {
  const login = cleanText(profile.login, 39);
  return {
    name: cleanText(profile.name, 120) || login || 'Developer',
    login,
    bio: cleanText(profile.bio, 320),
  };
}

function normalizeAnalysis(analysis = {}) {
  const requirements = uniqueStrings(analysis.requirements, 20, 60);
  const matched = uniqueStrings(analysis.matched, 20, 60)
    .filter((skill) => requirements.length === 0 || includesInsensitive(requirements, skill));
  const missing = uniqueStrings(analysis.missing, 20, 60)
    .filter((skill) => !includesInsensitive(matched, skill));
  return {
    score: clampNumber(analysis.score, 0, 100),
    requirements,
    matched,
    missing,
  };
}

function normalizeProjects(projects) {
  if (!Array.isArray(projects)) return [];
  const seen = new Set();
  const result = [];
  for (const project of projects) {
    if (!project || typeof project !== 'object') continue;
    const name = cleanText(project.name || project.full_name, 120);
    if (!name) continue;
    const key = String(project.full_name || name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      name,
      fullName: cleanText(project.full_name, 160),
      description: cleanText(project.description, 320),
      language: cleanText(project.language, 60),
      topics: uniqueStrings(project.topics, 12, 60),
      languages: uniqueStrings(Object.keys(project.languages || {}), 12, 60),
      url: sanitizeProjectUrl(project.html_url || project.url),
      stars: clampNumber(project.stargazers_count, 0, 1_000_000),
      forks: clampNumber(project.forks_count, 0, 1_000_000),
    });
    if (result.length >= 12) break;
  }
  return result;
}

function rankProjects(projects, skills) {
  return [...projects]
    .map((project, index) => ({ project, index, score: projectScore(project, skills) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.project);
}

function projectScore(project, skills) {
  const text = [project.name, project.description, project.language, ...project.topics, ...project.languages]
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const skill of skills) if (text.includes(String(skill).toLowerCase())) score += 20;
  score += Math.min(project.stars, 20);
  score += Math.min(project.forks, 10);
  if (project.description) score += 3;
  if (project.url) score += 2;
  return score;
}

function buildEvidence(locale, matched, projects) {
  if (!projects.length || !matched.length) return [];
  const output = [];
  for (const skill of matched) {
    const project = projects.find((item) => projectMentionsSkill(item, skill)) || projects[output.length % projects.length];
    if (!project) break;
    output.push({
      skill,
      project: project.name,
      url: project.url,
      proof: locale === 'en'
        ? `Show the implementation, trade-offs and measurable outcome for ${skill} in this project.`
        : `Покажите реализацию, компромиссы и измеримый результат применения ${skill} в этом проекте.`,
    });
  }
  return output;
}

function buildGapPlan(locale, missing) {
  return missing.map((skill) => ({
    skill,
    action: locale === 'en'
      ? `Clarify the expected depth, prepare a small demonstrator and describe the learning plan without presenting it as prior experience.`
      : `Уточнить ожидаемую глубину, подготовить небольшой демонстрационный пример и описать план изучения, не выдавая его за прошлый опыт.`,
  }));
}

function buildInterviewQuestions(locale, matched, missing, projects) {
  const questions = [];
  for (const skill of matched) {
    const project = projects.find((item) => projectMentionsSkill(item, skill)) || projects[0];
    questions.push(locale === 'en'
      ? `How did you apply ${skill}${project ? ` in ${project.name}` : ''}, and which trade-off mattered most?`
      : `Как вы применили ${skill}${project ? ` в проекте ${project.name}` : ''} и какой компромисс был самым важным?`);
  }
  for (const project of projects) {
    questions.push(locale === 'en'
      ? `Which measurable result from ${project.name} best demonstrates your contribution?`
      : `Какой измеримый результат проекта ${project.name} лучше всего показывает ваш вклад?`);
  }
  for (const skill of missing) {
    questions.push(locale === 'en'
      ? `What plan would you propose to reach the required level in ${skill}, and how would you validate progress?`
      : `Какой план вы предложите для достижения требуемого уровня в ${skill} и как проверите прогресс?`);
  }
  questions.push(locale === 'en'
    ? 'Which assumptions about the role should be clarified before committing to an implementation plan?'
    : 'Какие ожидания по роли нужно уточнить до того, как обещать конкретный план реализации?');
  return uniqueStrings(questions, 16, 300);
}

function buildCoverLetter({ locale, tone, profile, matched, missing, projects }) {
  const name = profile.name;
  const skillText = matched.join(', ');
  const projectText = projects.map((project) => project.name).join(', ');
  if (locale === 'en') {
    const intro = `Hello,\n\nMy name is ${name}. I am applying for the developer role.`;
    const evidence = matched.length
      ? ` My public GitHub profile provides evidence for ${skillText}.${projectText ? ` Relevant examples include ${projectText}.` : ''}`
      : ' My public GitHub profile does not yet provide a direct match for the extracted requirements, so I would prefer to clarify the role before making experience claims.';
    const bio = tone === 'concise' || !profile.bio ? '' : ` ${profile.bio}`;
    const detail = tone === 'detailed' && projects.length
      ? ' I can walk through implementation choices, testing strategy, accessibility considerations and the outcomes visible in the repositories.'
      : '';
    const gaps = missing.length
      ? ` I do not present ${missing.join(', ')} as existing experience; I am ready to clarify the expected depth and propose a verifiable learning plan.`
      : '';
    return `${intro}${bio}${evidence}${detail}${gaps}\n\nI would be glad to discuss the team’s priorities and demonstrate the relevant code.\n\nBest regards,\n${name}`;
  }
  const intro = `Здравствуйте!\n\nМеня зовут ${name}. Я откликаюсь на позицию разработчика.`;
  const evidence = matched.length
    ? ` Мой публичный GitHub-профиль подтверждает навыки: ${skillText}.${projectText ? ` Релевантные примеры: ${projectText}.` : ''}`
    : ' Публичный GitHub-профиль пока не подтверждает прямое совпадение с извлечёнными требованиями, поэтому я предпочитаю сначала уточнить роль и не делать неподтверждённых заявлений.';
  const bio = tone === 'concise' || !profile.bio ? '' : ` ${profile.bio}`;
  const detail = tone === 'detailed' && projects.length
    ? ' Я могу подробно разобрать архитектурные решения, тестирование, доступность и результаты, видимые в репозиториях.'
    : '';
  const gaps = missing.length
    ? ` Требования ${missing.join(', ')} я не выдаю за имеющийся опыт: готов уточнить ожидаемую глубину и предложить проверяемый план освоения.`
    : '';
  return `${intro}${bio}${evidence}${detail}${gaps}\n\nБуду рад обсудить приоритеты команды и показать релевантный код.\n\nС уважением,\n${name}`;
}

function normalizeEvidence(items, locale) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 12).map((item) => ({
    skill: cleanText(item?.skill, 60),
    project: cleanText(item?.project, 120),
    url: sanitizeProjectUrl(item?.url),
    proof: cleanText(item?.proof, 320) || (locale === 'en' ? 'Prepare a concrete code example.' : 'Подготовьте конкретный пример кода.'),
  })).filter((item) => item.skill && item.project);
}

function normalizeGapPlan(items, locale) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 12).map((item) => ({
    skill: cleanText(item?.skill, 60),
    action: cleanText(item?.action, 320) || (locale === 'en' ? 'Clarify expectations and prepare a learning plan.' : 'Уточните ожидания и подготовьте план изучения.'),
  })).filter((item) => item.skill);
}

function markdownLabels(locale) {
  if (locale === 'en') return {
    title: 'Application Kit', candidate: 'Candidate', match: 'Vacancy match', tone: 'Tone',
    letter: 'Cover letter', evidence: 'Evidence prompts', gaps: 'Gap plan', questions: 'Interview questions',
    none: 'No confirmed evidence prompts yet.', noGaps: 'No extracted gaps.',
    tones: { concise: 'Concise', balanced: 'Balanced', detailed: 'Detailed' },
  };
  return {
    title: 'Пакет отклика', candidate: 'Кандидат', match: 'Соответствие вакансии', tone: 'Тон',
    letter: 'Сопроводительное письмо', evidence: 'Подсказки по доказательствам', gaps: 'План закрытия пробелов', questions: 'Вопросы для интервью',
    none: 'Подтверждённые подсказки пока отсутствуют.', noGaps: 'Извлечённых пробелов нет.',
    tones: { concise: 'Краткий', balanced: 'Сбалансированный', detailed: 'Подробный' },
  };
}

function projectMentionsSkill(project, skill) {
  const text = [project.name, project.description, project.language, ...project.topics, ...project.languages]
    .join(' ')
    .toLowerCase();
  return text.includes(String(skill).toLowerCase());
}

function uniqueStrings(values, limit, maxLength) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const text = cleanText(value, maxLength);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function includesInsensitive(values, needle) {
  const normalized = String(needle).toLowerCase();
  return values.some((value) => String(value).toLowerCase() === normalized);
}

function cleanText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value, maxLength = 5000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function escapeMarkdown(value) {
  return String(value || '').replace(/([\\`*_[\]<>])/g, '\\$1');
}
