import {
  APPLICATION_STATUSES,
  APPLICATION_TRACKER_KEY,
  applicationStatistics,
  buildApplicationCsv,
  createApplicationRecord,
  createApplicationTrackerBackup,
  filterApplications,
  followUpState,
  mergeApplicationRecords,
  normalizeApplicationTracker,
  parseApplicationTrackerBackup,
  removeApplication,
  safeTrackerFilename,
  setApplicationStatus,
  upsertApplication,
} from './application-tracker.mjs';

const WORKSPACE_KEY = 'auto-resume:workspace:v1';
const STATUS_ORDER = APPLICATION_STATUSES;
let tracker = readTracker();
let editingId = null;
let panel = null;
let form = null;
let filterState = { query: '', status: 'all', due: 'all' };
let locale = 'ru';

const COPY = {
  ru: {
    kicker: 'Локальная воронка', title: 'Трекер откликов', note: 'Компании, статусы и follow-up хранятся только в этом браузере. Публичные ссылки и API их не получают.',
    add: 'Добавить отклик', update: 'Сохранить изменения', cancel: 'Отмена', company: 'Компания', role: 'Вакансия / роль', url: 'HTTPS-ссылка на вакансию', status: 'Статус', applied: 'Дата отклика', followUp: 'Следующий контакт', draft: 'Связанное резюме', noDraft: 'Без привязки', notes: 'Заметки',
    search: 'Поиск по компании, роли или заметкам', allStatuses: 'Все статусы', allFollowUps: 'Все follow-up', overdue: 'Просрочено', dueSoon: 'В ближайшие 3 дня', scheduled: 'Запланировано', noDate: 'Без даты',
    total: 'Всего', active: 'Активные', interviews: 'Интервью', offers: 'Офферы', overdueStat: 'Просрочено', empty: 'Откликов пока нет.', noResults: 'По фильтрам ничего не найдено.', edit: 'Изменить', delete: 'Удалить', open: 'Открыть вакансию', draftLabel: 'Резюме', followUpLabel: 'Follow-up', appliedLabel: 'Отклик',
    exportJson: 'Экспорт JSON', exportCsv: 'Экспорт CSV', importJson: 'Импорт JSON', importMerge: 'Импорт объединён с текущими данными.', invalidImport: 'Не удалось импортировать файл.', saved: 'Отклик сохранён.', deleted: 'Отклик удалён.', confirmDelete: 'Удалить отклик?', required: 'Укажите компанию и роль.',
    statuses: { saved: 'Сохранено', applied: 'Отклик отправлен', screening: 'Скрининг', interview: 'Интервью', offer: 'Оффер', rejected: 'Отказ', withdrawn: 'Отозвано' },
    dueStates: { overdue: 'Просрочено', 'due-soon': 'Скоро', scheduled: 'Запланировано', none: 'Без follow-up' },
  },
  en: {
    kicker: 'Local pipeline', title: 'Application tracker', note: 'Companies, stages and follow-ups stay in this browser. Public links and APIs never receive them.',
    add: 'Add application', update: 'Save changes', cancel: 'Cancel', company: 'Company', role: 'Vacancy / role', url: 'HTTPS vacancy link', status: 'Status', applied: 'Applied date', followUp: 'Next follow-up', draft: 'Linked resume', noDraft: 'No linked resume', notes: 'Notes',
    search: 'Search company, role or notes', allStatuses: 'All statuses', allFollowUps: 'All follow-ups', overdue: 'Overdue', dueSoon: 'Next 3 days', scheduled: 'Scheduled', noDate: 'No date',
    total: 'Total', active: 'Active', interviews: 'Interviews', offers: 'Offers', overdueStat: 'Overdue', empty: 'No applications yet.', noResults: 'No applications match these filters.', edit: 'Edit', delete: 'Delete', open: 'Open vacancy', draftLabel: 'Resume', followUpLabel: 'Follow-up', appliedLabel: 'Applied',
    exportJson: 'Export JSON', exportCsv: 'Export CSV', importJson: 'Import JSON', importMerge: 'Imported data was merged with current records.', invalidImport: 'The file could not be imported.', saved: 'Application saved.', deleted: 'Application deleted.', confirmDelete: 'Delete this application?', required: 'Company and role are required.',
    statuses: { saved: 'Saved', applied: 'Applied', screening: 'Screening', interview: 'Interview', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn' },
    dueStates: { overdue: 'Overdue', 'due-soon': 'Due soon', scheduled: 'Scheduled', none: 'No follow-up' },
  },
};

export function initApplicationTracker(documentRef = document) {
  if (!documentRef?.body) return false;
  locale = documentRef.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
  ensureStyles(documentRef);
  syncVisibility(documentRef);
  const observer = new MutationObserver(() => syncVisibility(documentRef));
  observer.observe(documentRef.body, { attributes: true, attributeFilter: ['class'] });
  const draftList = documentRef.querySelector('#draftList');
  if (draftList) new MutationObserver(() => renderDraftOptions()).observe(draftList, { childList: true, subtree: true });
  documentRef.querySelector('#localeSelect')?.addEventListener('change', () => {
    locale = documentRef.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
    if (panel) renderPanel();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === APPLICATION_TRACKER_KEY) {
      tracker = readTracker();
      renderRecords();
    }
    if (event.key === WORKSPACE_KEY) renderDraftOptions();
  });
  return true;
}

function ensureStyles(documentRef) {
  if (documentRef.querySelector('link[data-application-tracker-styles]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = './application-tracker.css';
  link.dataset.applicationTrackerStyles = 'true';
  documentRef.head.append(link);
}

function syncVisibility(documentRef) {
  const shared = documentRef.body.classList.contains('shared-view') || !documentRef.querySelector('#sharedBanner')?.classList.contains('hidden');
  if (shared) {
    panel?.remove();
    panel = null;
    form = null;
    return;
  }
  if (!panel && documentRef.querySelector('#workspacePanel')) mountPanel(documentRef);
  renderDraftOptions();
}

function mountPanel(documentRef) {
  panel = documentRef.createElement('section');
  panel.id = 'applicationTrackerPanel';
  panel.className = 'application-tracker glass';
  panel.setAttribute('aria-labelledby', 'applicationTrackerTitle');
  documentRef.querySelector('#workspacePanel').insertAdjacentElement('afterend', panel);
  renderPanel();
}

function renderPanel() {
  if (!panel) return;
  const c = COPY[locale];
  panel.innerHTML = `
    <div class="application-tracker__heading">
      <div><span class="kicker">${c.kicker}</span><h2 id="applicationTrackerTitle">${c.title}</h2></div>
      <p>${c.note}</p>
    </div>
    <div id="applicationTrackerStats" class="application-tracker__stats" aria-live="polite"></div>
    <form id="applicationTrackerForm" class="application-tracker__form">
      <input type="hidden" name="id">
      <label>${c.company}<input name="company" maxlength="120" required></label>
      <label>${c.role}<input name="role" maxlength="160" required></label>
      <label>${c.url}<input name="vacancyUrl" type="url" inputmode="url" maxlength="600" placeholder="https://…"></label>
      <label>${c.status}<select name="status"></select></label>
      <label>${c.applied}<input name="appliedDate" type="date"></label>
      <label>${c.followUp}<input name="followUpDate" type="date"></label>
      <label class="application-tracker__wide">${c.draft}<select name="draftId"></select></label>
      <label class="application-tracker__wide">${c.notes}<textarea name="notes" rows="3" maxlength="2400"></textarea></label>
      <div class="application-tracker__form-actions application-tracker__wide">
        <button class="btn btn-primary" type="submit" data-tracker-submit>${c.add}</button>
        <button class="btn btn-secondary hidden" type="button" data-tracker-cancel>${c.cancel}</button>
      </div>
    </form>
    <div class="application-tracker__toolbar">
      <input id="applicationTrackerSearch" type="search" maxlength="200" placeholder="${c.search}" aria-label="${c.search}">
      <select id="applicationTrackerStatus" aria-label="${c.status}"></select>
      <select id="applicationTrackerDue" aria-label="${c.followUp}">
        <option value="all">${c.allFollowUps}</option><option value="overdue">${c.overdue}</option><option value="due-soon">${c.dueSoon}</option><option value="scheduled">${c.scheduled}</option><option value="none">${c.noDate}</option>
      </select>
      <button class="btn btn-secondary" type="button" data-tracker-export="json">${c.exportJson}</button>
      <button class="btn btn-secondary" type="button" data-tracker-export="csv">${c.exportCsv}</button>
      <label class="btn btn-secondary file-button" for="applicationTrackerImport">${c.importJson}</label>
      <input id="applicationTrackerImport" class="sr-only" type="file" accept="application/json,.json">
    </div>
    <p id="applicationTrackerMessage" class="application-tracker__message" role="status" aria-live="polite"></p>
    <div id="applicationTrackerList" class="application-tracker__list"></div>`;

  form = panel.querySelector('#applicationTrackerForm');
  populateStatusSelect(form.elements.status, 'saved');
  populateFilterStatus();
  renderDraftOptions();
  bindPanelEvents();
  renderRecords();
}

function bindPanelEvents() {
  form.addEventListener('submit', handleSubmit);
  panel.querySelector('[data-tracker-cancel]').addEventListener('click', resetForm);
  panel.querySelector('#applicationTrackerSearch').addEventListener('input', (event) => { filterState.query = event.target.value; renderRecords(); });
  panel.querySelector('#applicationTrackerStatus').addEventListener('change', (event) => { filterState.status = event.target.value; renderRecords(); });
  panel.querySelector('#applicationTrackerDue').addEventListener('change', (event) => { filterState.due = event.target.value; renderRecords(); });
  panel.querySelector('#applicationTrackerList').addEventListener('click', handleListClick);
  panel.querySelector('#applicationTrackerList').addEventListener('change', handleListChange);
  panel.querySelectorAll('[data-tracker-export]').forEach((button) => button.addEventListener('click', () => exportTracker(button.dataset.trackerExport)));
  panel.querySelector('#applicationTrackerImport').addEventListener('change', importTracker);
}

function handleSubmit(event) {
  event.preventDefault();
  const c = COPY[locale];
  const data = new FormData(form);
  const company = String(data.get('company') || '').trim();
  const role = String(data.get('role') || '').trim();
  if (!company || !role) return setMessage(c.required, 'error');
  const draftId = String(data.get('draftId') || '');
  const draft = availableDrafts().find((item) => item.id === draftId) || null;
  const input = {
    id: editingId || undefined,
    company,
    role,
    vacancyUrl: data.get('vacancyUrl'),
    status: data.get('status'),
    appliedDate: data.get('appliedDate'),
    followUpDate: data.get('followUpDate'),
    notes: data.get('notes'),
    draft: draft ? { id: draft.id, name: draft.name } : null,
  };
  const record = editingId
    ? { ...tracker.records.find((item) => item.id === editingId), ...input }
    : createApplicationRecord(input);
  tracker.records = upsertApplication(tracker.records, record);
  persistTracker();
  resetForm();
  renderRecords();
  setMessage(c.saved, 'success');
}

function handleListClick(event) {
  const button = event.target.closest('[data-tracker-action]');
  if (!button) return;
  const record = tracker.records.find((item) => item.id === button.dataset.trackerId);
  if (!record) return;
  if (button.dataset.trackerAction === 'edit') return editRecord(record);
  if (button.dataset.trackerAction === 'delete' && window.confirm(COPY[locale].confirmDelete)) {
    tracker.records = removeApplication(tracker.records, record.id);
    persistTracker();
    if (editingId === record.id) resetForm();
    renderRecords();
    setMessage(COPY[locale].deleted, 'success');
  }
}

function handleListChange(event) {
  const select = event.target.closest('[data-tracker-status-id]');
  if (!select) return;
  tracker.records = setApplicationStatus(tracker.records, select.dataset.trackerStatusId, select.value);
  persistTracker();
  renderRecords();
}

function editRecord(record) {
  editingId = record.id;
  form.elements.id.value = record.id;
  form.elements.company.value = record.company;
  form.elements.role.value = record.role;
  form.elements.vacancyUrl.value = record.vacancyUrl;
  form.elements.status.value = record.status;
  form.elements.appliedDate.value = record.appliedDate;
  form.elements.followUpDate.value = record.followUpDate;
  form.elements.notes.value = record.notes;
  renderDraftOptions(record.draft?.id || '');
  form.querySelector('[data-tracker-submit]').textContent = COPY[locale].update;
  form.querySelector('[data-tracker-cancel]').classList.remove('hidden');
  form.elements.company.focus();
}

function resetForm() {
  editingId = null;
  form?.reset();
  if (!form) return;
  populateStatusSelect(form.elements.status, 'saved');
  renderDraftOptions();
  form.querySelector('[data-tracker-submit]').textContent = COPY[locale].add;
  form.querySelector('[data-tracker-cancel]').classList.add('hidden');
}

function renderRecords() {
  if (!panel) return;
  renderStats();
  const list = panel.querySelector('#applicationTrackerList');
  const records = filterApplications(tracker.records, filterState);
  list.replaceChildren();
  if (!tracker.records.length) return list.append(emptyState(COPY[locale].empty));
  if (!records.length) return list.append(emptyState(COPY[locale].noResults));
  records.forEach((record) => list.append(applicationCard(record)));
}

function renderStats() {
  const stats = applicationStatistics(tracker.records);
  const c = COPY[locale];
  const values = [[c.total, stats.total], [c.active, stats.active], [c.interviews, stats.interviews], [c.offers, stats.offers], [c.overdueStat, stats.overdue]];
  const root = panel.querySelector('#applicationTrackerStats');
  root.replaceChildren(...values.map(([label, value]) => {
    const item = document.createElement('div');
    const strong = document.createElement('strong'); strong.textContent = String(value);
    const span = document.createElement('span'); span.textContent = label;
    item.append(strong, span);
    return item;
  }));
}

function applicationCard(record) {
  const c = COPY[locale];
  const state = followUpState(record);
  const article = document.createElement('article');
  article.className = 'application-tracker__card';
  article.dataset.followUpState = state;
  article.dataset.applicationId = record.id;

  const head = document.createElement('div'); head.className = 'application-tracker__card-head';
  const title = document.createElement('div');
  const company = document.createElement('strong'); company.textContent = record.company;
  const role = document.createElement('span'); role.textContent = record.role;
  title.append(company, role);
  const status = document.createElement('select'); status.dataset.trackerStatusId = record.id; status.setAttribute('aria-label', c.status); populateStatusSelect(status, record.status);
  head.append(title, status);

  const meta = document.createElement('div'); meta.className = 'application-tracker__meta';
  if (record.appliedDate) meta.append(metaItem(c.appliedLabel, record.appliedDate));
  if (record.followUpDate) meta.append(metaItem(c.followUpLabel, `${record.followUpDate} · ${c.dueStates[state]}`));
  if (record.draft) meta.append(metaItem(c.draftLabel, record.draft.name));

  const notes = document.createElement('p'); notes.textContent = record.notes; notes.className = record.notes ? '' : 'hidden';
  const actions = document.createElement('div'); actions.className = 'application-tracker__card-actions';
  if (record.vacancyUrl) {
    const link = document.createElement('a'); link.className = 'text-button'; link.href = record.vacancyUrl; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = c.open; actions.append(link);
  }
  actions.append(actionButton('edit', record.id, c.edit), actionButton('delete', record.id, c.delete, true));
  article.append(head, meta, notes, actions);
  return article;
}

function metaItem(label, value) {
  const span = document.createElement('span');
  const strong = document.createElement('strong'); strong.textContent = `${label}: `;
  span.append(strong, document.createTextNode(value));
  return span;
}

function actionButton(action, id, label, danger = false) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = `text-button${danger ? ' danger-text' : ''}`; button.dataset.trackerAction = action; button.dataset.trackerId = id; button.textContent = label;
  return button;
}

function emptyState(message) {
  const p = document.createElement('p'); p.className = 'application-tracker__empty'; p.textContent = message; return p;
}

function populateStatusSelect(select, selected) {
  select.replaceChildren(...STATUS_ORDER.map((status) => {
    const option = document.createElement('option'); option.value = status; option.textContent = COPY[locale].statuses[status]; option.selected = status === selected; return option;
  }));
}

function populateFilterStatus() {
  const select = panel.querySelector('#applicationTrackerStatus');
  const all = document.createElement('option'); all.value = 'all'; all.textContent = COPY[locale].allStatuses; all.selected = filterState.status === 'all';
  select.replaceChildren(all, ...STATUS_ORDER.map((status) => {
    const option = document.createElement('option'); option.value = status; option.textContent = COPY[locale].statuses[status]; option.selected = filterState.status === status; return option;
  }));
  panel.querySelector('#applicationTrackerDue').value = filterState.due;
  panel.querySelector('#applicationTrackerSearch').value = filterState.query;
}

function renderDraftOptions(preferredId = form?.elements?.draftId?.value || '') {
  const select = form?.elements?.draftId;
  if (!select) return;
  const empty = document.createElement('option'); empty.value = ''; empty.textContent = COPY[locale].noDraft;
  const drafts = availableDrafts();
  select.replaceChildren(empty, ...drafts.map((draft) => {
    const option = document.createElement('option'); option.value = draft.id; option.textContent = draft.name; return option;
  }));
  select.value = drafts.some((draft) => draft.id === preferredId) ? preferredId : '';
}

function availableDrafts() {
  try {
    const workspace = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}');
    return (Array.isArray(workspace.drafts) ? workspace.drafts : []).filter((item) => item && typeof item.id === 'string').slice(0, 30).map((item) => ({ id: item.id.slice(0, 180), name: String(item.name || item.id).slice(0, 160) }));
  } catch {
    return [];
  }
}

function readTracker() {
  try {
    const raw = localStorage.getItem(APPLICATION_TRACKER_KEY);
    return raw ? normalizeApplicationTracker(JSON.parse(raw)) : normalizeApplicationTracker(null);
  } catch {
    return normalizeApplicationTracker(null);
  }
}

function persistTracker() {
  tracker = normalizeApplicationTracker({ ...tracker, updatedAt: new Date().toISOString() });
  localStorage.setItem(APPLICATION_TRACKER_KEY, JSON.stringify(tracker));
}

function exportTracker(format) {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'csv') return download(buildApplicationCsv(tracker.records), safeTrackerFilename(`applications-${date}`, 'csv'), 'text/csv;charset=utf-8');
  download(createApplicationTrackerBackup(tracker), safeTrackerFilename(`applications-${date}`, 'json'), 'application/json;charset=utf-8');
}

async function importTracker(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = parseApplicationTrackerBackup(await file.text());
    tracker.records = mergeApplicationRecords(tracker.records, imported.records);
    persistTracker();
    renderRecords();
    setMessage(COPY[locale].importMerge, 'success');
  } catch {
    setMessage(COPY[locale].invalidImport, 'error');
  } finally {
    event.target.value = '';
  }
}

function download(content, filename, type) {
  const blob = new Blob([formatBom(type), content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatBom(type) {
  return type.includes('csv') || type.includes('json') ? '\uFEFF' : '';
}

function setMessage(message, tone) {
  const root = panel?.querySelector('#applicationTrackerMessage');
  if (!root) return;
  root.textContent = message;
  root.dataset.tone = tone;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initApplicationTracker(document), { once: true });
  else initApplicationTracker(document);
}
