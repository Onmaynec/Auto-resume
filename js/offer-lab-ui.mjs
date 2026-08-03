import {
  OFFER_CONTRACT_TYPES,
  OFFER_CRITERIA,
  OFFER_CURRENCIES,
  OFFER_LAB_KEY,
  OFFER_WORK_MODELS,
  createOfferLabBackup,
  createOfferRecord,
  firstYearCompensation,
  mergeOfferRecords,
  normalizeOfferLab,
  offerDecisionScore,
  offerLabStatistics,
  offerToMarkdown,
  offersComparisonToMarkdown,
  parseOfferLabBackup,
  removeOffer,
  safeOfferFilename,
  upsertOffer,
} from './offer-lab.mjs';

const TRACKER_KEY = 'auto-resume:application-tracker:v1';
let documentRef = null;
let storageRef = null;
let lab = normalizeOfferLab({});
let panel = null;
let editingId = null;
let locale = 'ru';
let observer = null;
let initialized = false;

const COPY = {
  ru: {
    kicker: 'Локальное решение', title: 'Лаборатория офферов', note: 'Сравнивайте предложения по своим критериям. Все данные остаются в браузере и не попадают в резюме, публичные ссылки или API.',
    privacy: 'Только локально · без скрытой конвертации валют', application: 'Связанный отклик со статусом «Оффер»', none: 'Без привязки', company: 'Компания', role: 'Роль', currency: 'Валюта', base: 'Годовая база', bonus: 'Годовой бонус', equity: 'Акции за год', signOn: 'Sign-on бонус', benefits: 'Стоимость льгот', commute: 'Расходы на дорогу за год', deadline: 'Дедлайн решения', workModel: 'Формат работы', contract: 'Тип договора', redFlags: 'Красные флаги, по одному на строку', notes: 'Заметки', save: 'Сохранить оффер', update: 'Обновить оффер', cancel: 'Отмена',
    criteria: 'Матрица решения', rating: 'Оценка', weight: 'Вес', records: 'Предложения', empty: 'Офферов пока нет.', edit: 'Изменить', delete: 'Удалить', confirmDelete: 'Удалить этот оффер?', exportCard: 'Markdown', exportJson: 'Экспорт JSON', importJson: 'Импорт JSON', exportComparison: 'Сравнение Markdown', imported: 'Данные объединены с текущими офферами.', invalidImport: 'Не удалось импортировать файл.', required: 'Укажите компанию и роль.', saved: 'Оффер сохранён.', total: 'Офферов', average: 'Средняя оценка', urgent: 'Срочных решений', best: 'Лидер матрицы', noBest: 'Нет данных', firstYear: 'Пакет за первый год', score: 'Оценка', penalty: 'Риски', comparison: 'Сравнение', currencyNote: 'Суммы сравниваются только внутри одной валюты. Итоговая оценка строится из ваших рейтингов, весов и красных флагов.',
    criteriaNames: { compensation: 'Компенсация', growth: 'Рост', team: 'Команда', product: 'Продукт', workLife: 'Баланс', stability: 'Стабильность', flexibility: 'Гибкость' },
    workModels: { remote: 'Удалённо', hybrid: 'Гибрид', onsite: 'Офис', flexible: 'Гибко' },
    contracts: { employment: 'Штат', contract: 'Контракт', internship: 'Стажировка', other: 'Другое' },
  },
  en: {
    kicker: 'Local decision', title: 'Offer Decision Lab', note: 'Compare offers using your own criteria. All data stays in this browser and never enters resumes, public links or APIs.',
    privacy: 'Local only · no hidden currency conversion', application: 'Linked application with Offer status', none: 'No linked application', company: 'Company', role: 'Role', currency: 'Currency', base: 'Annual base', bonus: 'Annual bonus', equity: 'Annual equity value', signOn: 'Sign-on bonus', benefits: 'Annual benefits value', commute: 'Annual commute cost', deadline: 'Decision deadline', workModel: 'Work model', contract: 'Contract type', redFlags: 'Red flags, one per line', notes: 'Notes', save: 'Save offer', update: 'Update offer', cancel: 'Cancel',
    criteria: 'Decision matrix', rating: 'Rating', weight: 'Weight', records: 'Offers', empty: 'No offers yet.', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this offer?', exportCard: 'Markdown', exportJson: 'Export JSON', importJson: 'Import JSON', exportComparison: 'Comparison Markdown', imported: 'Imported data was merged with current offers.', invalidImport: 'The file could not be imported.', required: 'Company and role are required.', saved: 'Offer saved.', total: 'Offers', average: 'Average score', urgent: 'Urgent decisions', best: 'Matrix leader', noBest: 'No data', firstYear: 'First-year package', score: 'Score', penalty: 'Risks', comparison: 'Comparison', currencyNote: 'Amounts are compared only within the same currency. The score comes from your ratings, weights and recorded red flags.',
    criteriaNames: { compensation: 'Compensation', growth: 'Growth', team: 'Team', product: 'Product', workLife: 'Work-life', stability: 'Stability', flexibility: 'Flexibility' },
    workModels: { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site', flexible: 'Flexible' },
    contracts: { employment: 'Employment', contract: 'Contract', internship: 'Internship', other: 'Other' },
  },
};

export function initOfferLab(doc = globalThis.document, storage = globalThis.localStorage) {
  if (!doc?.body || initialized) return false;
  initialized = true;
  documentRef = doc;
  storageRef = storage;
  locale = doc.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
  lab = readLab();
  ensureStyles();
  syncVisibility();

  doc.querySelector('#localeSelect')?.addEventListener('change', () => {
    locale = doc.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
    renderPanel();
  });

  globalThis.addEventListener?.('storage', (event) => {
    if (event.key === OFFER_LAB_KEY) { lab = readLab(); editingId = null; renderPanel(); }
    if (event.key === TRACKER_KEY) renderPanel();
  });

  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(syncVisibility);
    observer.observe(doc.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  }
  return true;
}

function copy() {
  return COPY[locale];
}

function readLab() {
  try {
    return normalizeOfferLab(JSON.parse(storageRef?.getItem?.(OFFER_LAB_KEY) || '{}'));
  } catch {
    return normalizeOfferLab({});
  }
}

function writeLab(records) {
  lab = normalizeOfferLab({ version: 1, records, updatedAt: new Date().toISOString() });
  storageRef?.setItem?.(OFFER_LAB_KEY, JSON.stringify(lab));
}

function ensureStyles() {
  if (documentRef.querySelector('link[data-offer-lab-styles]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = './offer-lab.css';
  link.dataset.offerLabStyles = 'true';
  documentRef.head.append(link);
}

function isSharedView() {
  return documentRef.body.classList.contains('shared-view') || !documentRef.querySelector('#sharedBanner')?.classList.contains('hidden');
}

function syncVisibility() {
  if (isSharedView()) {
    panel?.remove();
    panel = null;
    editingId = null;
    return;
  }
  const anchor = documentRef.querySelector('#interviewPrepPanel') || documentRef.querySelector('#applicationTrackerPanel') || documentRef.querySelector('#workspacePanel');
  if (!anchor) return;
  if (!panel) {
    panel = documentRef.createElement('section');
    panel.id = 'offerLabPanel';
    panel.className = 'offer-lab glass';
    panel.setAttribute('aria-labelledby', 'offerLabTitle');
    anchor.insertAdjacentElement('afterend', panel);
    renderPanel();
  } else if (panel.previousElementSibling !== anchor) {
    anchor.insertAdjacentElement('afterend', panel);
  }
}

function trackerOffers() {
  try {
    const source = JSON.parse(storageRef?.getItem?.(TRACKER_KEY) || '{}');
    return (Array.isArray(source.records) ? source.records : [])
      .filter((item) => item && item.status === 'offer' && item.id && item.company && item.role)
      .slice(0, 60)
      .map((item) => ({ id: String(item.id).slice(0, 180), company: String(item.company).slice(0, 120), role: String(item.role).slice(0, 160) }));
  } catch {
    return [];
  }
}

function renderPanel() {
  if (!panel) return;
  const c = copy();
  const editing = lab.records.find((item) => item.id === editingId) || null;
  if (editingId && !editing) editingId = null;
  const stats = offerLabStatistics(lab.records);
  const best = lab.records.find((item) => item.id === stats.bestId);
  panel.innerHTML = `
    <div class="offer-lab__heading">
      <div><span class="kicker">${escapeHtml(c.kicker)}</span><h2 id="offerLabTitle">${escapeHtml(c.title)}</h2><p>${escapeHtml(c.note)}</p></div>
      <span class="pill">${escapeHtml(c.privacy)}</span>
    </div>
    <div class="offer-lab__stats" aria-label="${escapeHtml(c.title)}">
      ${statCard(c.total, stats.total)}${statCard(c.average, `${stats.averageScore}/100`)}${statCard(c.urgent, stats.urgent)}${statCard(c.best, best ? `${best.company} · ${offerDecisionScore(best).score}` : c.noBest)}
    </div>
    ${renderForm(editing)}
    <div class="offer-lab__toolbar">
      <strong>${escapeHtml(c.records)}</strong>
      <button class="btn btn-secondary btn-compact" type="button" data-offer-export="comparison">${escapeHtml(c.exportComparison)}</button>
      <button class="btn btn-secondary btn-compact" type="button" data-offer-export="json">${escapeHtml(c.exportJson)}</button>
      <label class="btn btn-secondary btn-compact file-button" for="offerLabImport">${escapeHtml(c.importJson)}</label>
      <input id="offerLabImport" class="sr-only" type="file" accept="application/json,.json" />
    </div>
    <p class="offer-lab__message" role="status" aria-live="polite"></p>
    <div class="offer-lab__layout">
      <div class="offer-lab__records">${renderRecords()}</div>
      <div class="offer-lab__comparison"><h3>${escapeHtml(c.comparison)}</h3><p>${escapeHtml(c.currencyNote)}</p>${renderComparison()}</div>
    </div>`;
  bindPanel();
}

function statCard(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function renderForm(record) {
  const c = copy();
  const current = record || createOfferRecord({ company: 'placeholder', role: 'placeholder', locale });
  current.company = record?.company || '';
  current.role = record?.role || '';
  const applications = trackerOffers();
  const appOptions = applications.map((item) => `<option value="${escapeHtml(item.id)}" ${record?.application?.id === item.id ? 'selected' : ''}>${escapeHtml(`${item.company} — ${item.role}`)}</option>`).join('');
  const currencyOptions = OFFER_CURRENCIES.map((item) => `<option value="${item}" ${current.currency === item ? 'selected' : ''}>${item}</option>`).join('');
  const workOptions = OFFER_WORK_MODELS.map((item) => `<option value="${item}" ${current.workModel === item ? 'selected' : ''}>${escapeHtml(c.workModels[item])}</option>`).join('');
  const contractOptions = OFFER_CONTRACT_TYPES.map((item) => `<option value="${item}" ${current.contractType === item ? 'selected' : ''}>${escapeHtml(c.contracts[item])}</option>`).join('');
  return `<form id="offerLabForm" class="offer-lab__form">
    <input type="hidden" name="id" value="${escapeHtml(record?.id || '')}" />
    <label class="offer-lab__wide">${escapeHtml(c.application)}<select id="offerLabApplication" name="application"><option value="">${escapeHtml(c.none)}</option>${appOptions}</select></label>
    ${input('company', c.company, current.company, 'text', true)}${input('role', c.role, current.role, 'text', true)}
    <label>${escapeHtml(c.currency)}<select name="currency">${currencyOptions}</select></label>
    ${input('deadline', c.deadline, current.deadline, 'date')}
    <label>${escapeHtml(c.workModel)}<select name="workModel">${workOptions}</select></label>
    <label>${escapeHtml(c.contract)}<select name="contractType">${contractOptions}</select></label>
    ${moneyInput('base', c.base, current.compensation.base)}${moneyInput('bonus', c.bonus, current.compensation.bonus)}${moneyInput('equity', c.equity, current.compensation.equity)}${moneyInput('signOn', c.signOn, current.compensation.signOn)}${moneyInput('benefits', c.benefits, current.compensation.benefits)}${moneyInput('commuteCost', c.commute, current.compensation.commuteCost)}
    <fieldset class="offer-lab__matrix offer-lab__wide"><legend>${escapeHtml(c.criteria)}</legend>${OFFER_CRITERIA.map((key) => criterionControl(key, current)).join('')}</fieldset>
    <label class="offer-lab__wide">${escapeHtml(c.redFlags)}<textarea name="redFlags" rows="3" maxlength="5000">${escapeHtml(current.redFlags.join('\n'))}</textarea></label>
    <label class="offer-lab__wide">${escapeHtml(c.notes)}<textarea name="notes" rows="4" maxlength="4000">${escapeHtml(current.notes)}</textarea></label>
    <div class="offer-lab__actions offer-lab__wide"><button class="btn btn-primary" type="submit">${escapeHtml(record ? c.update : c.save)}</button>${record ? `<button class="btn btn-secondary" type="button" data-offer-cancel>${escapeHtml(c.cancel)}</button>` : ''}</div>
  </form>`;
}

function input(name, label, value, type = 'text', required = false) {
  return `<label>${escapeHtml(label)}<input name="${name}" type="${type}" value="${escapeHtml(value || '')}" ${required ? 'required' : ''} maxlength="${name === 'company' ? 120 : 160}" /></label>`;
}

function moneyInput(name, label, value) {
  return `<label>${escapeHtml(label)}<input name="${name}" type="number" min="0" max="1000000000" step="0.01" value="${Number(value) || 0}" inputmode="decimal" /></label>`;
}

function criterionControl(key, record) {
  const c = copy();
  return `<div class="offer-lab__criterion"><strong>${escapeHtml(c.criteriaNames[key])}</strong><label>${escapeHtml(c.rating)}<select name="rating-${key}">${scoreOptions(record.ratings[key])}</select></label><label>${escapeHtml(c.weight)}<select name="weight-${key}">${scoreOptions(record.weights[key])}</select></label></div>`;
}

function scoreOptions(selected) {
  return [0, 1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${Number(selected) === value ? 'selected' : ''}>${value}</option>`).join('');
}

function renderRecords() {
  const c = copy();
  if (!lab.records.length) return `<p class="offer-lab__empty">${escapeHtml(c.empty)}</p>`;
  return lab.records.map((record) => {
    const decision = offerDecisionScore(record);
    return `<article class="offer-lab__record ${record.id === offerLabStatistics(lab.records).bestId ? 'is-best' : ''}">
      <div><strong>${escapeHtml(record.company)}</strong><span>${escapeHtml(record.role)}</span></div>
      <strong class="offer-lab__score">${decision.score}/100</strong>
      <dl><div><dt>${escapeHtml(c.firstYear)}</dt><dd>${escapeHtml(formatMoney(firstYearCompensation(record), record.currency))}</dd></div><div><dt>${escapeHtml(c.penalty)}</dt><dd>-${decision.riskPenalty}</dd></div><div><dt>${escapeHtml(c.deadline)}</dt><dd>${escapeHtml(record.deadline || '—')}</dd></div></dl>
      <div class="offer-lab__record-actions"><button class="text-button" type="button" data-offer-action="edit" data-offer-id="${escapeHtml(record.id)}">${escapeHtml(c.edit)}</button><button class="text-button" type="button" data-offer-action="export" data-offer-id="${escapeHtml(record.id)}">${escapeHtml(c.exportCard)}</button><button class="text-button danger-text" type="button" data-offer-action="delete" data-offer-id="${escapeHtml(record.id)}">${escapeHtml(c.delete)}</button></div>
    </article>`;
  }).join('');
}

function renderComparison() {
  const c = copy();
  if (!lab.records.length) return `<p class="offer-lab__empty">${escapeHtml(c.empty)}</p>`;
  const records = [...lab.records].sort((left, right) => offerDecisionScore(right).score - offerDecisionScore(left).score);
  return `<div class="offer-lab__table-wrap"><table><thead><tr><th>${escapeHtml(c.company)}</th><th>${escapeHtml(c.role)}</th><th>${escapeHtml(c.currency)}</th><th>${escapeHtml(c.firstYear)}</th><th>${escapeHtml(c.score)}</th></tr></thead><tbody>${records.map((record) => `<tr><td>${escapeHtml(record.company)}</td><td>${escapeHtml(record.role)}</td><td>${record.currency}</td><td>${escapeHtml(formatMoney(firstYearCompensation(record), record.currency))}</td><td><strong>${offerDecisionScore(record).score}</strong></td></tr>`).join('')}</tbody></table></div>`;
}

function bindPanel() {
  const form = panel.querySelector('#offerLabForm');
  form?.addEventListener('submit', handleSubmit);
  form?.querySelector('#offerLabApplication')?.addEventListener('change', handleApplicationSelection);
  panel.querySelector('[data-offer-cancel]')?.addEventListener('click', () => { editingId = null; renderPanel(); });
  panel.querySelectorAll('[data-offer-action]').forEach((button) => button.addEventListener('click', handleRecordAction));
  panel.querySelector('[data-offer-export="json"]')?.addEventListener('click', exportJson);
  panel.querySelector('[data-offer-export="comparison"]')?.addEventListener('click', exportComparison);
  panel.querySelector('#offerLabImport')?.addEventListener('change', importJson);
}

function handleApplicationSelection(event) {
  const application = trackerOffers().find((item) => item.id === event.target.value);
  if (!application) return;
  const form = event.target.form;
  form.elements.company.value = application.company;
  form.elements.role.value = application.role;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const application = trackerOffers().find((item) => item.id === data.get('application')) || null;
  const ratings = Object.fromEntries(OFFER_CRITERIA.map((key) => [key, Number(data.get(`rating-${key}`))]));
  const weights = Object.fromEntries(OFFER_CRITERIA.map((key) => [key, Number(data.get(`weight-${key}`))]));
  const value = {
    id: data.get('id') || undefined,
    company: data.get('company'), role: data.get('role'), locale, application,
    currency: data.get('currency'), workModel: data.get('workModel'), contractType: data.get('contractType'), deadline: data.get('deadline'),
    compensation: { base: data.get('base'), bonus: data.get('bonus'), equity: data.get('equity'), signOn: data.get('signOn'), benefits: data.get('benefits'), commuteCost: data.get('commuteCost') },
    ratings, weights, redFlags: data.get('redFlags'), notes: data.get('notes'),
  };
  if (!String(value.company || '').trim() || !String(value.role || '').trim()) return showMessage(copy().required, 'error');
  try {
    const record = value.id ? value : createOfferRecord(value);
    writeLab(upsertOffer(lab.records, record));
    editingId = null;
    renderPanel();
    showMessage(copy().saved, 'success');
  } catch {
    showMessage(copy().required, 'error');
  }
}

function handleRecordAction(event) {
  const id = event.currentTarget.dataset.offerId;
  const record = lab.records.find((item) => item.id === id);
  if (!record) return;
  const action = event.currentTarget.dataset.offerAction;
  if (action === 'edit') { editingId = id; renderPanel(); panel.querySelector('#offerLabForm')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  if (action === 'export') downloadLocal(offerToMarkdown(record, { locale }), `${safeOfferFilename(`${record.company}-${record.role}`)}.md`, 'text/markdown;charset=utf-8');
  if (action === 'delete' && globalThis.confirm?.(copy().confirmDelete)) { writeLab(removeOffer(lab.records, id)); if (editingId === id) editingId = null; renderPanel(); }
}

function exportJson() {
  downloadLocal(createOfferLabBackup(lab.records), `auto-resume-offers-${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8');
}

function exportComparison() {
  downloadLocal(offersComparisonToMarkdown(lab.records, { locale }), `auto-resume-offer-comparison-${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown;charset=utf-8');
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = parseOfferLabBackup(await file.text());
    writeLab(mergeOfferRecords(lab.records, imported.records));
    editingId = null;
    renderPanel();
    showMessage(copy().imported, 'success');
  } catch {
    showMessage(copy().invalidImport, 'error');
  } finally {
    event.target.value = '';
  }
}

function showMessage(message, tone = '') {
  const target = panel?.querySelector('.offer-lab__message');
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

function formatMoney(value, currency) {
  try {
    if (currency === 'OTHER') return `${Math.round(value)} OTHER`;
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

function downloadLocal(content, name, type) {
  const blob = new Blob([`\uFEFF${String(content || '')}`], { type });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  anchor.href = url;
  anchor.download = name;
  documentRef.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initOfferLab(), { once: true });
  else initOfferLab();
}
