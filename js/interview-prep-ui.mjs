import { state } from './config.js';
import {
  INTERVIEW_PREP_KEY,
  createInterviewPrepBackup,
  createInterviewSession,
  interviewReadiness,
  interviewSessionToMarkdown,
  mergeInterviewSessions,
  normalizeInterviewPrep,
  parseInterviewPrepBackup,
  removeInterviewSession,
  removeStarStory,
  safeInterviewFilename,
  updateInterviewAnswer,
  upsertInterviewSession,
  upsertStarStory,
} from './interview-prep.mjs';

const TRACKER_KEY = 'auto-resume:application-tracker:v1';
let prep = readPrep();
let selectedId = null;
let panel = null;
let locale = 'ru';

const COPY = {
  ru: {
    kicker: 'Локальная практика', title: 'Подготовка к интервью', note: 'Вопросы, ответы и STAR-истории остаются только в этом браузере. Исходный текст вакансии и резюме не сохраняются.',
    application: 'Связанный отклик', none: 'Без привязки', company: 'Компания', role: 'Роль', date: 'Дата интервью', skills: 'Навыки через запятую', gaps: 'Пробелы через запятую', create: 'Создать сессию', sessions: 'Сессии', empty: 'Сессий подготовки пока нет.', open: 'Открыть', delete: 'Удалить', confirmDelete: 'Удалить сессию подготовки?',
    readiness: 'Готовность', questions: 'Вопросы и ответы', answer: 'Ваш ответ', rating: 'Самооценка', completed: 'Отработано', stars: 'STAR-истории', storyTitle: 'Название истории', situation: 'Situation', task: 'Task', action: 'Action', result: 'Result', tags: 'Теги через запятую', saveStory: 'Сохранить STAR', removeStory: 'Удалить',
    exportMd: 'Экспорт Markdown', exportJson: 'Экспорт JSON', importJson: 'Импорт JSON', imported: 'Импорт объединён с текущими данными.', invalidImport: 'Не удалось импортировать файл.', saved: 'Сессия сохранена.', required: 'Укажите компанию и роль.', privacy: 'Только локально · без API и публичных ссылок', noAnswer: 'Ответ пока не заполнен.',
    components: { coverage: 'Покрытие ответами', confidence: 'Уверенность', star: 'STAR-доказательства', planning: 'План интервью' },
    categories: { intro: 'Введение', technical: 'Технический', project: 'Проект', behavioral: 'Поведенческий', gap: 'Пробел', candidate: 'Вопросы кандидата' },
  },
  en: {
    kicker: 'Local practice', title: 'Interview preparation', note: 'Questions, answers and STAR stories stay in this browser. Raw vacancy text and resume content are not stored.',
    application: 'Linked application', none: 'No linked application', company: 'Company', role: 'Role', date: 'Interview date', skills: 'Skills, comma separated', gaps: 'Gaps, comma separated', create: 'Create session', sessions: 'Sessions', empty: 'No preparation sessions yet.', open: 'Open', delete: 'Delete', confirmDelete: 'Delete this preparation session?',
    readiness: 'Readiness', questions: 'Questions and answers', answer: 'Your answer', rating: 'Self-rating', completed: 'Practised', stars: 'STAR stories', storyTitle: 'Story title', situation: 'Situation', task: 'Task', action: 'Action', result: 'Result', tags: 'Tags, comma separated', saveStory: 'Save STAR', removeStory: 'Delete',
    exportMd: 'Export Markdown', exportJson: 'Export JSON', importJson: 'Import JSON', imported: 'Imported data was merged with current sessions.', invalidImport: 'The file could not be imported.', saved: 'Session saved.', required: 'Company and role are required.', privacy: 'Local only · no APIs or public links', noAnswer: 'No answer yet.',
    components: { coverage: 'Answer coverage', confidence: 'Confidence', star: 'STAR evidence', planning: 'Interview planning' },
    categories: { intro: 'Introduction', technical: 'Technical', project: 'Project', behavioral: 'Behavioral', gap: 'Gap', candidate: 'Candidate questions' },
  },
};

export function initInterviewPrep(documentRef = document) {
  if (!documentRef?.body) return false;
  locale = documentRef.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
  ensureStyles(documentRef);
  syncVisibility(documentRef);
  new MutationObserver(() => syncVisibility(documentRef)).observe(documentRef.body, { attributes: true, attributeFilter: ['class'] });
  const trackerPanel = documentRef.querySelector('#applicationTrackerPanel');
  if (trackerPanel) new MutationObserver(renderApplicationOptions).observe(trackerPanel, { childList: true, subtree: true });
  documentRef.querySelector('#localeSelect')?.addEventListener('change', () => {
    locale = documentRef.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
    if (panel) renderPanel();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === INTERVIEW_PREP_KEY) { prep = readPrep(); renderSessions(); renderDetail(); }
    if (event.key === TRACKER_KEY) renderApplicationOptions();
  });
  return true;
}

function ensureStyles(documentRef) {
  if (documentRef.querySelector('link[data-interview-prep-styles]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet'; link.href = './interview-prep.css'; link.dataset.interviewPrepStyles = 'true';
  documentRef.head.append(link);
}

function syncVisibility(documentRef) {
  const shared = documentRef.body.classList.contains('shared-view') || !documentRef.querySelector('#sharedBanner')?.classList.contains('hidden');
  if (shared) { panel?.remove(); panel = null; selectedId = null; return; }
  if (!panel && documentRef.querySelector('#workspacePanel')) mountPanel(documentRef);
}

function mountPanel(documentRef) {
  panel = documentRef.createElement('section');
  panel.id = 'interviewPrepPanel'; panel.className = 'interview-prep glass'; panel.setAttribute('aria-labelledby', 'interviewPrepTitle');
  const anchor = documentRef.querySelector('#applicationTrackerPanel') || documentRef.querySelector('#workspacePanel');
  anchor.insertAdjacentElement('afterend', panel);
  renderPanel();
}

function renderPanel() {
  if (!panel) return;
  const c = COPY[locale];
  panel.innerHTML = `
    <div class="interview-prep__heading"><div><span class="kicker">${c.kicker}</span><h2 id="interviewPrepTitle">${c.title}</h2></div><p>${c.note}</p></div>
    <form id="interviewPrepForm" class="interview-prep__form">
      <label class="interview-prep__wide">${c.application}<select name="applicationId" id="interviewPrepApplication"></select></label>
      <label>${c.company}<input name="company" maxlength="120" required></label>
      <label>${c.role}<input name="role" maxlength="160" required></label>
      <label>${c.date}<input name="interviewDate" type="date"></label>
      <label>${c.skills}<input name="skills" maxlength="800"></label>
      <label class="interview-prep__wide">${c.gaps}<input name="gaps" maxlength="600"></label>
      <button class="btn btn-primary interview-prep__wide" type="submit">${c.create}</button>
    </form>
    <div class="interview-prep__toolbar">
      <strong>${c.sessions}</strong>
      <label class="btn btn-secondary file-button" for="interviewPrepImport">${c.importJson}</label>
      <input id="interviewPrepImport" class="sr-only" type="file" accept="application/json,.json">
    </div>
    <p id="interviewPrepMessage" class="interview-prep__message" role="status" aria-live="polite"></p>
    <div class="interview-prep__layout"><div id="interviewPrepSessions" class="interview-prep__sessions"></div><div id="interviewPrepDetail" class="interview-prep__detail"></div></div>`;
  bindEvents();
  renderApplicationOptions();
  renderSessions();
  renderDetail();
}

function bindEvents() {
  panel.querySelector('#interviewPrepForm').addEventListener('submit', createSession);
  panel.querySelector('#interviewPrepApplication').addEventListener('change', syncApplicationFields);
  panel.querySelector('#interviewPrepSessions').addEventListener('click', handleSessionAction);
  panel.querySelector('#interviewPrepDetail').addEventListener('input', handleDetailInput);
  panel.querySelector('#interviewPrepDetail').addEventListener('change', handleDetailInput);
  panel.querySelector('#interviewPrepDetail').addEventListener('submit', handleStorySubmit);
  panel.querySelector('#interviewPrepDetail').addEventListener('click', handleDetailClick);
  panel.querySelector('#interviewPrepImport').addEventListener('change', importPrep);
}

function createSession(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const applications = readApplications();
  const application = applications.find((item) => item.id === data.get('applicationId')) || null;
  const company = String(data.get('company') || '').trim();
  const role = String(data.get('role') || '').trim();
  if (!company || !role) return message(COPY[locale].required, 'error');
  const manualSkills = commaList(data.get('skills'));
  const manualGaps = commaList(data.get('gaps'));
  const analysis = state.vacancyAnalysis && typeof state.vacancyAnalysis === 'object' ? state.vacancyAnalysis : {};
  const skills = unique([...manualSkills, ...(analysis.matched || [])], 12);
  const gaps = unique([...manualGaps, ...(analysis.missing || [])], 8);
  const projects = unique((Array.isArray(state.repos) ? state.repos : []).map((repo) => repo?.name || repo?.full_name).filter(Boolean), 8);
  const session = createInterviewSession({
    company, role, locale, interviewDate: data.get('interviewDate'), skills, gaps, projects,
    application: application ? { id: application.id, company: application.company, role: application.role } : null,
  });
  prep.sessions = upsertInterviewSession(prep.sessions, session);
  selectedId = session.id;
  persistPrep();
  form.reset();
  renderApplicationOptions(); renderSessions(); renderDetail();
  message(COPY[locale].saved, 'success');
}

function renderApplicationOptions() {
  const select = panel?.querySelector('#interviewPrepApplication');
  if (!select) return;
  const current = select.value;
  const empty = document.createElement('option'); empty.value = ''; empty.textContent = COPY[locale].none;
  const applications = readApplications();
  select.replaceChildren(empty, ...applications.map((application) => {
    const option = document.createElement('option'); option.value = application.id; option.textContent = `${application.company} — ${application.role}`; return option;
  }));
  select.value = applications.some((item) => item.id === current) ? current : '';
}

function syncApplicationFields(event) {
  const application = readApplications().find((item) => item.id === event.target.value);
  if (!application) return;
  const form = panel.querySelector('#interviewPrepForm');
  form.elements.company.value = application.company;
  form.elements.role.value = application.role;
}

function renderSessions() {
  const root = panel?.querySelector('#interviewPrepSessions');
  if (!root) return;
  root.replaceChildren();
  if (!prep.sessions.length) return root.append(emptyState(COPY[locale].empty));
  prep.sessions.forEach((session) => {
    const ready = interviewReadiness(session);
    const article = document.createElement('article'); article.className = `interview-prep__session${session.id === selectedId ? ' active' : ''}`; article.dataset.sessionId = session.id;
    const title = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = session.company; const span = document.createElement('span'); span.textContent = session.role; title.append(strong, span);
    const score = document.createElement('span'); score.className = 'interview-prep__score'; score.textContent = `${ready.score}/100`;
    const actions = document.createElement('div'); actions.append(sessionButton('open', session.id, COPY[locale].open), sessionButton('delete', session.id, COPY[locale].delete, true));
    article.append(title, score, actions); root.append(article);
  });
}

function handleSessionAction(event) {
  const button = event.target.closest('[data-prep-action]');
  if (!button) return;
  const id = button.dataset.prepId;
  if (button.dataset.prepAction === 'open') { selectedId = id; renderSessions(); renderDetail(); return; }
  if (button.dataset.prepAction === 'delete' && window.confirm(COPY[locale].confirmDelete)) {
    prep.sessions = removeInterviewSession(prep.sessions, id); if (selectedId === id) selectedId = prep.sessions[0]?.id || null; persistPrep(); renderSessions(); renderDetail();
  }
}

function renderDetail() {
  const root = panel?.querySelector('#interviewPrepDetail');
  if (!root) return;
  const session = currentSession();
  if (!session) { root.replaceChildren(emptyState(COPY[locale].empty)); return; }
  const c = COPY[locale];
  const ready = interviewReadiness(session);
  root.innerHTML = `
    <div class="interview-prep__detail-head"><div><span class="kicker">${c.readiness}</span><h3>${escapeHtml(session.company)} — ${escapeHtml(session.role)}</h3></div><strong>${ready.score}/100</strong></div>
    <div class="interview-prep__components">${Object.entries(ready.components).map(([key, value]) => `<div><span>${c.components[key]}</span><strong>${value}</strong></div>`).join('')}</div>
    <div class="interview-prep__exports"><button class="btn btn-secondary" type="button" data-prep-export="md">${c.exportMd}</button><button class="btn btn-secondary" type="button" data-prep-export="json">${c.exportJson}</button></div>
    <h4>${c.questions}</h4>
    <div class="interview-prep__questions">${session.questions.map((question) => questionMarkup(question, c)).join('')}</div>
    <h4>${c.stars}</h4>
    <form class="interview-prep__star-form" data-star-form>
      <input type="hidden" name="id">
      <label>${c.storyTitle}<input name="title" maxlength="140" required></label>
      <label>${c.situation}<textarea name="situation" rows="2" maxlength="2400"></textarea></label>
      <label>${c.task}<textarea name="task" rows="2" maxlength="2400"></textarea></label>
      <label>${c.action}<textarea name="action" rows="2" maxlength="2400"></textarea></label>
      <label>${c.result}<textarea name="result" rows="2" maxlength="2400"></textarea></label>
      <label>${c.tags}<input name="tags" maxlength="500"></label>
      <button class="btn btn-primary" type="submit">${c.saveStory}</button>
    </form>
    <div class="interview-prep__stories">${session.stories.map((story) => storyMarkup(story, c)).join('')}</div>
    <small>${c.privacy}</small>`;
}

function questionMarkup(question, c) {
  return `<article class="interview-prep__question" data-question-id="${escapeHtml(question.id)}">
    <div><span>${c.categories[question.category]}</span><strong>${escapeHtml(question.prompt)}</strong></div>
    <label>${c.answer}<textarea rows="4" maxlength="5000" data-prep-answer="${escapeHtml(question.id)}" placeholder="${c.noAnswer}">${escapeHtml(question.answer)}</textarea></label>
    <div class="interview-prep__question-controls"><label>${c.rating}<select data-prep-rating="${escapeHtml(question.id)}">${[0,1,2,3,4,5].map((value) => `<option value="${value}"${value === question.rating ? ' selected' : ''}>${value}/5</option>`).join('')}</select></label><label><input type="checkbox" data-prep-completed="${escapeHtml(question.id)}"${question.completed ? ' checked' : ''}> ${c.completed}</label></div>
  </article>`;
}

function storyMarkup(story, c) {
  return `<article class="interview-prep__story" data-story-id="${escapeHtml(story.id)}"><div><strong>${escapeHtml(story.title)}</strong><button class="text-button danger-text" type="button" data-star-delete="${escapeHtml(story.id)}">${c.removeStory}</button></div><p><b>S:</b> ${escapeHtml(story.situation)}</p><p><b>T:</b> ${escapeHtml(story.task)}</p><p><b>A:</b> ${escapeHtml(story.action)}</p><p><b>R:</b> ${escapeHtml(story.result)}</p></article>`;
}

function handleDetailInput(event) {
  const answerId = event.target.dataset.prepAnswer;
  const ratingId = event.target.dataset.prepRating;
  const completedId = event.target.dataset.prepCompleted;
  const questionId = answerId || ratingId || completedId;
  if (!questionId) return;
  let session = currentSession();
  if (!session) return;
  const patch = answerId ? { answer: event.target.value } : ratingId ? { rating: event.target.value } : { completed: event.target.checked };
  session = updateInterviewAnswer(session, questionId, patch);
  prep.sessions = upsertInterviewSession(prep.sessions, session);
  persistPrep();
  renderSessions();
  const ready = interviewReadiness(currentSession());
  const head = panel.querySelector('.interview-prep__detail-head > strong'); if (head) head.textContent = `${ready.score}/100`;
  const values = panel.querySelectorAll('.interview-prep__components strong'); Object.values(ready.components).forEach((value, index) => { if (values[index]) values[index].textContent = String(value); });
}

function handleStorySubmit(event) {
  const form = event.target.closest('[data-star-form]');
  if (!form) return;
  event.preventDefault();
  let session = currentSession(); if (!session) return;
  const data = new FormData(form);
  try {
    session = upsertStarStory(session, { id: data.get('id') || undefined, title: data.get('title'), situation: data.get('situation'), task: data.get('task'), action: data.get('action'), result: data.get('result'), tags: commaList(data.get('tags')) });
    prep.sessions = upsertInterviewSession(prep.sessions, session); persistPrep(); renderSessions(); renderDetail();
  } catch { message(COPY[locale].required, 'error'); }
}

function handleDetailClick(event) {
  const exportButton = event.target.closest('[data-prep-export]');
  if (exportButton) return exportSession(exportButton.dataset.prepExport);
  const storyId = event.target.dataset.starDelete;
  if (!storyId) return;
  let session = currentSession(); if (!session) return;
  session = removeStarStory(session, storyId); prep.sessions = upsertInterviewSession(prep.sessions, session); persistPrep(); renderSessions(); renderDetail();
}

function exportSession(format) {
  const session = currentSession(); if (!session) return;
  const base = `${session.company}-${session.role}-interview-prep`;
  if (format === 'json') return download(createInterviewPrepBackup({ sessions: [session] }), safeInterviewFilename(base, 'json'), 'application/json;charset=utf-8');
  download(interviewSessionToMarkdown(session), safeInterviewFilename(base, 'md'), 'text/markdown;charset=utf-8');
}

async function importPrep(event) {
  const file = event.target.files?.[0]; if (!file) return;
  try { const imported = parseInterviewPrepBackup(await file.text()); prep.sessions = mergeInterviewSessions(prep.sessions, imported.sessions); persistPrep(); renderSessions(); renderDetail(); message(COPY[locale].imported, 'success'); }
  catch { message(COPY[locale].invalidImport, 'error'); }
  finally { event.target.value = ''; }
}

function currentSession() { return prep.sessions.find((session) => session.id === selectedId) || null; }
function readPrep() { try { const raw = localStorage.getItem(INTERVIEW_PREP_KEY); return raw ? normalizeInterviewPrep(JSON.parse(raw)) : normalizeInterviewPrep(null); } catch { return normalizeInterviewPrep(null); } }
function persistPrep() { prep = normalizeInterviewPrep({ ...prep, updatedAt: new Date().toISOString() }); localStorage.setItem(INTERVIEW_PREP_KEY, JSON.stringify(prep)); }
function readApplications() { try { const tracker = JSON.parse(localStorage.getItem(TRACKER_KEY) || '{}'); return (Array.isArray(tracker.records) ? tracker.records : []).filter((item) => item && typeof item.id === 'string' && item.company && item.role).slice(0, 120).map((item) => ({ id: String(item.id).slice(0, 160), company: String(item.company).slice(0, 120), role: String(item.role).slice(0, 160) })); } catch { return []; } }
function commaList(value) { return String(value || '').split(',').map((item) => item.trim()).filter(Boolean); }
function unique(items, limit) { const seen = new Set(); return items.filter((item) => { const value = String(item || '').trim(); const key = value.toLocaleLowerCase(); if (!value || seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit); }
function sessionButton(action, id, label, danger = false) { const button = document.createElement('button'); button.type = 'button'; button.className = `text-button${danger ? ' danger-text' : ''}`; button.dataset.prepAction = action; button.dataset.prepId = id; button.textContent = label; return button; }
function emptyState(text) { const p = document.createElement('p'); p.className = 'interview-prep__empty'; p.textContent = text; return p; }
function message(text, tone) { const root = panel?.querySelector('#interviewPrepMessage'); if (root) { root.textContent = text; root.dataset.tone = tone; } }
function download(content, filename, type) { const blob = new Blob(['\uFEFF', content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initInterviewPrep(document), { once: true });
  else initInterviewPrep(document);
}
