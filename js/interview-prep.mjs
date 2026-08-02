export const INTERVIEW_PREP_VERSION = 1;
export const INTERVIEW_PREP_KEY = 'auto-resume:interview-prep:v1';
export const INTERVIEW_CATEGORIES = Object.freeze(['intro', 'technical', 'project', 'behavioral', 'gap', 'candidate']);
export const MAX_INTERVIEW_SESSIONS = 60;

const LIMITS = Object.freeze({
  id: 180,
  company: 120,
  role: 160,
  skill: 80,
  project: 140,
  prompt: 420,
  answer: 5000,
  storyTitle: 140,
  storyField: 2400,
  applicationId: 160,
});

function clean(value, limit) {
  return String(value ?? '').replace(/\0/g, '').trim().slice(0, limit);
}

function list(value, max, limit) {
  const output = [];
  const seen = new Set();
  for (const item of Array.isArray(value) ? value : []) {
    const normalized = clean(item, limit);
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (output.length >= max) break;
  }
  return output;
}

function isoDate(value) {
  const candidate = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return '';
  const date = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === candidate ? candidate : '';
}

function timestamp(value, fallback) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function clamp(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : min;
}

export function normalizeInterviewQuestion(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const prompt = clean(value.prompt, LIMITS.prompt);
  if (!prompt) return null;
  const category = INTERVIEW_CATEGORIES.includes(value.category) ? value.category : 'technical';
  return {
    id: clean(value.id, LIMITS.id) || `question-${category}-${index + 1}`,
    category,
    prompt,
    answer: clean(value.answer, LIMITS.answer),
    rating: clamp(value.rating, 0, 5),
    completed: Boolean(value.completed),
  };
}

export function normalizeStarStory(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const title = clean(value.title, LIMITS.storyTitle);
  if (!title) return null;
  return {
    id: clean(value.id, LIMITS.id) || `star-${index + 1}`,
    title,
    situation: clean(value.situation, LIMITS.storyField),
    task: clean(value.task, LIMITS.storyField),
    action: clean(value.action, LIMITS.storyField),
    result: clean(value.result, LIMITS.storyField),
    tags: list(value.tags, 8, LIMITS.skill),
  };
}

export function generateInterviewQuestions(input = {}) {
  const locale = input.locale === 'en' ? 'en' : 'ru';
  const role = clean(input.role, LIMITS.role) || (locale === 'en' ? 'developer role' : 'позиция разработчика');
  const skills = list(input.skills, 8, LIMITS.skill);
  const projects = list(input.projects, 5, LIMITS.project);
  const gaps = list(input.gaps, 5, LIMITS.skill).filter((gap) => !skills.some((skill) => skill.toLocaleLowerCase() === gap.toLocaleLowerCase()));
  const prompts = [];
  const add = (category, prompt) => prompts.push({ category, prompt });

  add('intro', locale === 'en'
    ? `Give a concise introduction for the ${role} interview and connect your strongest evidence to the role.`
    : `Кратко представьтесь для интервью на роль «${role}» и свяжите сильнейшие доказательства опыта с этой позицией.`);

  skills.forEach((skill) => add('technical', locale === 'en'
    ? `Explain a real decision involving ${skill}: context, alternatives, trade-off and measurable outcome.`
    : `Разберите реальное решение с ${skill}: контекст, альтернативы, компромисс и измеримый результат.`));

  projects.forEach((project) => add('project', locale === 'en'
    ? `Walk through ${project}: your contribution, the hardest constraint, validation and the result.`
    : `Разберите проект ${project}: ваш вклад, главное ограничение, проверку решения и результат.`));

  add('behavioral', locale === 'en'
    ? 'Describe a disagreement or failure using STAR and explain what changed in your next decision.'
    : 'Опишите разногласие или неудачу по STAR и объясните, что изменилось в вашем следующем решении.');
  add('behavioral', locale === 'en'
    ? 'Describe a time you reduced ambiguity, aligned stakeholders and delivered under a constraint.'
    : 'Опишите случай, когда вы уменьшили неопределённость, согласовали ожидания и выполнили задачу в условиях ограничения.');

  gaps.forEach((skill) => add('gap', locale === 'en'
    ? `How would you close the gap in ${skill} without presenting it as prior experience, and how would you validate progress?`
    : `Как вы закроете пробел в ${skill}, не выдавая его за прошлый опыт, и как проверите прогресс?`));

  add('candidate', locale === 'en'
    ? 'Which questions will you ask about success criteria, ownership, team constraints and the first 90 days?'
    : 'Какие вопросы вы зададите о критериях успеха, зоне ответственности, ограничениях команды и первых 90 днях?');

  return prompts.slice(0, 16).map((item, index) => normalizeInterviewQuestion({
    id: `question-${item.category}-${index + 1}`,
    category: item.category,
    prompt: item.prompt,
  }, index));
}

export function normalizeInterviewSession(value, { now = new Date().toISOString() } = {}) {
  if (!value || typeof value !== 'object') return null;
  const company = clean(value.company, LIMITS.company);
  const role = clean(value.role, LIMITS.role);
  if (!company || !role) return null;
  const createdAt = timestamp(value.createdAt, now);
  const updatedAt = timestamp(value.updatedAt, createdAt);
  const applicationSource = value.application && typeof value.application === 'object' ? value.application : {};
  const applicationId = clean(applicationSource.id ?? value.applicationId, LIMITS.applicationId);
  const questions = (Array.isArray(value.questions) ? value.questions : [])
    .map(normalizeInterviewQuestion)
    .filter(Boolean)
    .slice(0, 20);
  const stories = (Array.isArray(value.stories) ? value.stories : [])
    .map(normalizeStarStory)
    .filter(Boolean)
    .slice(0, 10);
  const id = clean(value.id, LIMITS.id) || buildSessionId(company, role, createdAt);
  return {
    id,
    company,
    role,
    locale: value.locale === 'en' ? 'en' : 'ru',
    interviewDate: isoDate(value.interviewDate),
    application: applicationId ? {
      id: applicationId,
      company: clean(applicationSource.company, LIMITS.company) || company,
      role: clean(applicationSource.role, LIMITS.role) || role,
    } : null,
    skills: list(value.skills, 12, LIMITS.skill),
    projects: list(value.projects, 8, LIMITS.project),
    gaps: list(value.gaps, 8, LIMITS.skill),
    questions,
    stories,
    createdAt,
    updatedAt,
  };
}

export function createInterviewSession(input = {}, { now = new Date().toISOString() } = {}) {
  const base = normalizeInterviewSession({ ...input, createdAt: now, updatedAt: now }, { now });
  if (!base) throw new TypeError('INTERVIEW_SESSION_INVALID');
  const questions = base.questions.length ? base.questions : generateInterviewQuestions(base);
  return { ...base, questions };
}

export function normalizeInterviewPrep(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sessions = (Array.isArray(source.sessions) ? source.sessions : [])
    .map((session) => normalizeInterviewSession(session))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id));
  const unique = [];
  const seen = new Set();
  for (const session of sessions) {
    if (seen.has(session.id) || unique.length >= MAX_INTERVIEW_SESSIONS) continue;
    seen.add(session.id);
    unique.push(session);
  }
  return { version: INTERVIEW_PREP_VERSION, sessions: unique, updatedAt: timestamp(source.updatedAt, null) };
}

export function upsertInterviewSession(sessions, value, { now = new Date().toISOString() } = {}) {
  const current = (Array.isArray(sessions) ? sessions : []).map((item) => normalizeInterviewSession(item)).filter(Boolean);
  const existing = current.find((item) => item.id === value?.id);
  const normalized = normalizeInterviewSession({
    ...existing,
    ...value,
    createdAt: existing?.createdAt || value?.createdAt || now,
    updatedAt: now,
  }, { now });
  if (!normalized) throw new TypeError('INTERVIEW_SESSION_INVALID');
  return [normalized, ...current.filter((item) => item.id !== normalized.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id))
    .slice(0, MAX_INTERVIEW_SESSIONS);
}

export function removeInterviewSession(sessions, id) {
  return (Array.isArray(sessions) ? sessions : []).map((item) => normalizeInterviewSession(item)).filter((item) => item && item.id !== id);
}

export function updateInterviewAnswer(session, questionId, patch = {}) {
  const normalized = normalizeInterviewSession(session);
  if (!normalized) throw new TypeError('INTERVIEW_SESSION_INVALID');
  return {
    ...normalized,
    questions: normalized.questions.map((question, index) => question.id === questionId
      ? normalizeInterviewQuestion({ ...question, ...patch }, index)
      : question),
  };
}

export function upsertStarStory(session, value) {
  const normalized = normalizeInterviewSession(session);
  if (!normalized) throw new TypeError('INTERVIEW_SESSION_INVALID');
  const existing = normalized.stories.find((story) => story.id === value?.id);
  const story = normalizeStarStory({ ...existing, ...value }, normalized.stories.length);
  if (!story) throw new TypeError('STAR_STORY_INVALID');
  return { ...normalized, stories: [story, ...normalized.stories.filter((item) => item.id !== story.id)].slice(0, 10) };
}

export function removeStarStory(session, storyId) {
  const normalized = normalizeInterviewSession(session);
  if (!normalized) throw new TypeError('INTERVIEW_SESSION_INVALID');
  return { ...normalized, stories: normalized.stories.filter((story) => story.id !== storyId) };
}

export function interviewReadiness(session) {
  const normalized = normalizeInterviewSession(session);
  if (!normalized) return { score: 0, components: { coverage: 0, confidence: 0, star: 0, planning: 0 } };
  const questionCount = normalized.questions.length || 1;
  const answered = normalized.questions.filter((question) => question.answer.length >= 40 || question.completed).length;
  const coverage = Math.round((answered / questionCount) * 45);
  const ratingTotal = normalized.questions.reduce((sum, question) => sum + question.rating, 0);
  const confidence = Math.round((ratingTotal / (questionCount * 5)) * 25);
  const completeStories = normalized.stories.filter((story) => [story.situation, story.task, story.action, story.result].every((field) => field.length >= 20)).length;
  const star = Math.min(20, completeStories * 10);
  const planning = (normalized.interviewDate ? 5 : 0) + (normalized.questions.some((question) => question.category === 'candidate' && question.answer.length >= 20) ? 5 : 0);
  return { score: Math.min(100, coverage + confidence + star + planning), components: { coverage, confidence, star, planning } };
}

export function createInterviewPrepBackup(prep, { now = new Date().toISOString() } = {}) {
  return JSON.stringify({ type: 'auto-resume-interview-prep', version: INTERVIEW_PREP_VERSION, exportedAt: now, prep: normalizeInterviewPrep(prep) }, null, 2);
}

export function parseInterviewPrepBackup(textValue) {
  let payload;
  try { payload = JSON.parse(String(textValue || '').replace(/^\uFEFF/, '')); }
  catch { throw codedError('INTERVIEW_JSON'); }
  if (payload?.type !== 'auto-resume-interview-prep') throw codedError('INTERVIEW_TYPE');
  if (Number(payload.version) > INTERVIEW_PREP_VERSION) throw codedError('INTERVIEW_NEWER');
  return normalizeInterviewPrep(payload.prep);
}

export function mergeInterviewSessions(current, incoming) {
  const byId = new Map();
  [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]
    .map((item) => normalizeInterviewSession(item)).filter(Boolean).forEach((session) => {
      const previous = byId.get(session.id);
      if (!previous || Date.parse(session.updatedAt) >= Date.parse(previous.updatedAt)) byId.set(session.id, session);
    });
  return [...byId.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, MAX_INTERVIEW_SESSIONS);
}

export function interviewSessionToMarkdown(value) {
  const session = normalizeInterviewSession(value);
  if (!session) throw new TypeError('INTERVIEW_SESSION_INVALID');
  const readiness = interviewReadiness(session);
  const en = session.locale === 'en';
  const lines = [
    `# ${en ? 'Interview preparation' : 'Подготовка к интервью'} — ${session.company}`,
    '',
    `- ${en ? 'Role' : 'Роль'}: ${session.role}`,
    `- ${en ? 'Interview date' : 'Дата интервью'}: ${session.interviewDate || '—'}`,
    `- ${en ? 'Readiness' : 'Готовность'}: ${readiness.score}/100`,
    `- ${en ? 'Application ID' : 'ID отклика'}: ${session.application?.id || '—'}`,
    '',
    `## ${en ? 'Questions and answers' : 'Вопросы и ответы'}`,
    '',
  ];
  session.questions.forEach((question, index) => {
    lines.push(`### ${index + 1}. [${question.category}] ${question.prompt}`, '', question.answer || (en ? '_No answer yet._' : '_Ответ пока не заполнен._'), '', `${en ? 'Self-rating' : 'Самооценка'}: ${question.rating}/5`, '');
  });
  lines.push(`## ${en ? 'STAR stories' : 'STAR-истории'}`, '');
  if (!session.stories.length) lines.push(en ? '_No stories yet._' : '_Истории пока не добавлены._', '');
  session.stories.forEach((story) => lines.push(`### ${story.title}`, '', `- **S:** ${story.situation}`, `- **T:** ${story.task}`, `- **A:** ${story.action}`, `- **R:** ${story.result}`, ''));
  lines.push(`> ${en ? 'Stored and exported locally. Raw vacancy text and resume content are not included.' : 'Хранится и экспортируется локально. Исходный текст вакансии и содержимое резюме не включены.'}`, '');
  return lines.join('\n');
}

export function safeInterviewFilename(value, extension = 'md') {
  const base = clean(value, 80).toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'interview-prep';
  return `${base}.${['md', 'json'].includes(extension) ? extension : 'md'}`;
}

function buildSessionId(company, role, createdAt) {
  const slug = `${company}-${role}`.toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'interview';
  return `${slug}-${Date.parse(createdAt) || 0}`;
}

function codedError(code) { const error = new Error(code); error.code = code; return error; }
