export const OFFER_LAB_VERSION = 1;
export const OFFER_LAB_KEY = 'auto-resume:offer-lab:v1';
export const MAX_OFFERS = 60;
export const OFFER_CURRENCIES = Object.freeze(['EUR', 'USD', 'GBP', 'RUB', 'UAH', 'KZT', 'PLN', 'CHF', 'CAD', 'AUD', 'OTHER']);
export const OFFER_WORK_MODELS = Object.freeze(['remote', 'hybrid', 'onsite', 'flexible']);
export const OFFER_CONTRACT_TYPES = Object.freeze(['employment', 'contract', 'internship', 'other']);
export const OFFER_CRITERIA = Object.freeze(['compensation', 'growth', 'team', 'product', 'workLife', 'stability', 'flexibility']);

const DEFAULT_RATINGS = Object.freeze({
  compensation: 3,
  growth: 3,
  team: 3,
  product: 3,
  workLife: 3,
  stability: 3,
  flexibility: 3,
});

const DEFAULT_WEIGHTS = Object.freeze({
  compensation: 5,
  growth: 4,
  team: 4,
  product: 3,
  workLife: 4,
  stability: 3,
  flexibility: 3,
});

const MAX = Object.freeze({
  id: 180,
  company: 120,
  role: 160,
  applicationId: 180,
  notes: 4000,
  redFlag: 300,
  redFlags: 16,
  money: 1_000_000_000,
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value, limit) {
  return String(value ?? '').replace(/\0/g, '').trim().slice(0, limit);
}

function clamp(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function money(value) {
  return Math.round(clamp(value, 0, MAX.money, 0) * 100) / 100;
}

function normalizeIsoDate(value) {
  const candidate = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return '';
  const date = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === candidate ? candidate : '';
}

function normalizeTimestamp(value, fallback) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function normalizeApplicationReference(value) {
  if (!value || typeof value !== 'object') return null;
  const id = text(value.id, MAX.applicationId);
  const company = text(value.company, MAX.company);
  const role = text(value.role, MAX.role);
  return id && company && role ? { id, company, role } : null;
}

function normalizeCriteria(value, defaults) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(OFFER_CRITERIA.map((key) => [key, Math.round(clamp(source[key], 0, 5, defaults[key]))]));
}

function normalizeRedFlags(value) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? '').split(/\r?\n|,/g);
  const result = [];
  const seen = new Set();
  for (const item of source) {
    const normalized = text(item, MAX.redFlag);
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= MAX.redFlags) break;
  }
  return result;
}

export function buildOfferId({ company, role, createdAt = new Date().toISOString() } = {}) {
  const slug = `${text(company, MAX.company)}-${text(role, MAX.role)}`
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9а-яё]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'offer';
  const stamp = Number.isFinite(Date.parse(createdAt)) ? Date.parse(createdAt) : Date.now();
  return `${slug}-${stamp}`.slice(0, MAX.id);
}

export function normalizeOfferRecord(value, { now = new Date().toISOString() } = {}) {
  if (!value || typeof value !== 'object') return null;
  const company = text(value.company, MAX.company);
  const role = text(value.role, MAX.role);
  if (!company || !role) return null;

  const createdAt = normalizeTimestamp(value.createdAt, now);
  const updatedAt = normalizeTimestamp(value.updatedAt, createdAt);
  const id = text(value.id, MAX.id) || buildOfferId({ company, role, createdAt });
  const compensation = value.compensation && typeof value.compensation === 'object' ? value.compensation : {};
  const currency = OFFER_CURRENCIES.includes(value.currency) ? value.currency : 'EUR';
  const workModel = OFFER_WORK_MODELS.includes(value.workModel) ? value.workModel : 'hybrid';
  const contractType = OFFER_CONTRACT_TYPES.includes(value.contractType) ? value.contractType : 'employment';

  return {
    id,
    company,
    role,
    locale: value.locale === 'en' ? 'en' : 'ru',
    application: normalizeApplicationReference(value.application),
    currency,
    compensation: {
      base: money(compensation.base ?? value.baseSalary),
      bonus: money(compensation.bonus ?? value.bonus),
      equity: money(compensation.equity ?? value.equityAnnual),
      signOn: money(compensation.signOn ?? value.signOn),
      benefits: money(compensation.benefits ?? value.benefitsValue),
      commuteCost: money(compensation.commuteCost ?? value.commuteCostAnnual),
    },
    workModel,
    contractType,
    deadline: normalizeIsoDate(value.deadline),
    ratings: normalizeCriteria(value.ratings ?? value.criteria, DEFAULT_RATINGS),
    weights: normalizeCriteria(value.weights, DEFAULT_WEIGHTS),
    redFlags: normalizeRedFlags(value.redFlags),
    notes: text(value.notes, MAX.notes),
    createdAt,
    updatedAt,
  };
}

export function createOfferRecord(input, { now = new Date().toISOString() } = {}) {
  return normalizeOfferRecord({ ...(input && typeof input === 'object' ? input : {}), createdAt: now, updatedAt: now }, { now });
}

export function normalizeOfferLab(value) {
  const source = value && typeof value === 'object' ? value : {};
  const records = Array.isArray(source.records)
    ? source.records.map((record) => normalizeOfferRecord(record)).filter(Boolean)
    : [];
  const unique = [];
  const seen = new Set();
  records
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .forEach((record) => {
      if (!seen.has(record.id) && unique.length < MAX_OFFERS) {
        seen.add(record.id);
        unique.push(record);
      }
    });
  return {
    version: OFFER_LAB_VERSION,
    records: unique,
    updatedAt: normalizeTimestamp(source.updatedAt, null),
  };
}

export function upsertOffer(records, value, { now = new Date().toISOString() } = {}) {
  const current = Array.isArray(records) ? records.map((item) => normalizeOfferRecord(item)).filter(Boolean) : [];
  const existing = current.find((item) => item.id === value?.id);
  const normalized = normalizeOfferRecord({
    ...existing,
    ...clone(value || {}),
    createdAt: existing?.createdAt || value?.createdAt || now,
    updatedAt: now,
  }, { now });
  if (!normalized) throw new TypeError('OFFER_INVALID');
  return [normalized, ...current.filter((item) => item.id !== normalized.id)]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_OFFERS);
}

export function removeOffer(records, id) {
  return (Array.isArray(records) ? records : [])
    .map((item) => normalizeOfferRecord(item))
    .filter((item) => item && item.id !== id);
}

export function mergeOfferRecords(current, incoming) {
  const merged = new Map();
  for (const record of [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    const normalized = normalizeOfferRecord(record);
    if (!normalized) continue;
    const previous = merged.get(normalized.id);
    if (!previous || Date.parse(normalized.updatedAt) >= Date.parse(previous.updatedAt)) merged.set(normalized.id, normalized);
  }
  return [...merged.values()]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_OFFERS);
}

export function firstYearCompensation(value) {
  const record = normalizeOfferRecord(value);
  if (!record) return 0;
  const { base, bonus, equity, signOn, benefits, commuteCost } = record.compensation;
  return Math.max(0, Math.round((base + bonus + equity + signOn + benefits - commuteCost) * 100) / 100);
}

export function offerDecisionScore(value) {
  const record = normalizeOfferRecord(value);
  if (!record) return { score: 0, weightedScore: 0, riskPenalty: 0, components: {} };
  let weightedPoints = 0;
  let totalWeight = 0;
  const components = {};
  for (const key of OFFER_CRITERIA) {
    const rating = record.ratings[key];
    const weight = record.weights[key];
    const score = Math.round((rating / 5) * 100);
    components[key] = { rating, weight, score };
    weightedPoints += score * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) {
    for (const key of OFFER_CRITERIA) weightedPoints += components[key].score;
    totalWeight = OFFER_CRITERIA.length;
  }
  const weightedScore = Math.round(weightedPoints / totalWeight);
  const riskPenalty = Math.min(18, record.redFlags.length * 3);
  return {
    score: Math.max(0, Math.min(100, weightedScore - riskPenalty)),
    weightedScore,
    riskPenalty,
    components,
  };
}

export function deadlineState(value, { now = new Date() } = {}) {
  const date = normalizeIsoDate(value);
  if (!date) return 'none';
  const start = new Date(`${new Date(now).toISOString().slice(0, 10)}T00:00:00.000Z`);
  const target = new Date(`${date}T00:00:00.000Z`);
  const days = Math.round((target - start) / 86_400_000);
  if (days < 0) return 'expired';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'scheduled';
}

export function offerLabStatistics(records, options = {}) {
  const normalized = (Array.isArray(records) ? records : []).map((item) => normalizeOfferRecord(item)).filter(Boolean);
  const scored = normalized.map((record) => ({ record, decision: offerDecisionScore(record) }));
  scored.sort((left, right) => right.decision.score - left.decision.score || right.record.updatedAt.localeCompare(left.record.updatedAt));
  const totalScore = scored.reduce((sum, item) => sum + item.decision.score, 0);
  return {
    total: normalized.length,
    averageScore: normalized.length ? Math.round(totalScore / normalized.length) : 0,
    bestId: scored[0]?.record.id || null,
    currencies: [...new Set(normalized.map((record) => record.currency))].sort(),
    urgent: normalized.filter((record) => ['expired', 'urgent'].includes(deadlineState(record.deadline, options))).length,
  };
}

export function createOfferLabBackup(records, { now = new Date().toISOString() } = {}) {
  return JSON.stringify({
    version: OFFER_LAB_VERSION,
    records: normalizeOfferLab({ records }).records,
    updatedAt: now,
  }, null, 2);
}

export function parseOfferLabBackup(source) {
  const parsed = typeof source === 'string' ? JSON.parse(source) : clone(source);
  if (!parsed || typeof parsed !== 'object') throw new TypeError('OFFER_BACKUP_INVALID');
  const version = Number(parsed.version);
  if (!Number.isInteger(version) || version < 1) throw new TypeError('OFFER_BACKUP_INVALID');
  if (version > OFFER_LAB_VERSION) throw new RangeError('OFFER_BACKUP_FUTURE_VERSION');
  return normalizeOfferLab(parsed);
}

function moneyText(value, currency, locale) {
  try {
    if (currency === 'OTHER') return `${Math.round(value)} OTHER`;
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

export function offerToMarkdown(value, { locale } = {}) {
  const record = normalizeOfferRecord(value);
  if (!record) throw new TypeError('OFFER_INVALID');
  const lang = locale === 'en' || record.locale === 'en' ? 'en' : 'ru';
  const score = offerDecisionScore(record);
  const total = firstYearCompensation(record);
  const labels = lang === 'en'
    ? {
        title: 'Offer decision card', score: 'Decision score', weighted: 'Weighted fit', penalty: 'Risk penalty', total: 'Estimated first-year package', deadline: 'Decision deadline', model: 'Work model', contract: 'Contract type', criteria: 'Criteria', risks: 'Red flags', notes: 'Notes', application: 'Linked application', none: 'None', noRisks: 'No red flags recorded', noNotes: 'No notes', disclaimer: 'This is a personal decision aid, not financial, tax or legal advice.',
      }
    : {
        title: 'Карточка решения по офферу', score: 'Итоговая оценка', weighted: 'Взвешенное соответствие', penalty: 'Штраф за риски', total: 'Оценка пакета за первый год', deadline: 'Дедлайн решения', model: 'Формат работы', contract: 'Тип договора', criteria: 'Критерии', risks: 'Красные флаги', notes: 'Заметки', application: 'Связанный отклик', none: 'Нет', noRisks: 'Красные флаги не отмечены', noNotes: 'Заметок нет', disclaimer: 'Это личный инструмент принятия решения, а не финансовая, налоговая или юридическая консультация.',
      };
  const criteria = OFFER_CRITERIA.map((key) => `- ${key}: ${record.ratings[key]}/5 (weight ${record.weights[key]}/5)`).join('\n');
  const risks = record.redFlags.length ? record.redFlags.map((item) => `- ${item}`).join('\n') : labels.noRisks;
  const application = record.application ? `${record.application.company} — ${record.application.role} (${record.application.id})` : labels.none;
  return `# ${record.company} — ${record.role}\n\n> ${labels.title}\n\n- **${labels.score}:** ${score.score}/100\n- **${labels.weighted}:** ${score.weightedScore}/100\n- **${labels.penalty}:** -${score.riskPenalty}\n- **${labels.total}:** ${moneyText(total, record.currency, lang)}\n- **${labels.deadline}:** ${record.deadline || labels.none}\n- **${labels.model}:** ${record.workModel}\n- **${labels.contract}:** ${record.contractType}\n- **${labels.application}:** ${application}\n\n## ${labels.criteria}\n\n${criteria}\n\n## ${labels.risks}\n\n${risks}\n\n## ${labels.notes}\n\n${record.notes || labels.noNotes}\n\n---\n\n${labels.disclaimer}\n`;
}

export function offersComparisonToMarkdown(records, { locale = 'ru' } = {}) {
  const normalized = (Array.isArray(records) ? records : []).map((item) => normalizeOfferRecord(item)).filter(Boolean);
  const lang = locale === 'en' ? 'en' : 'ru';
  const title = lang === 'en' ? 'Offer comparison' : 'Сравнение офферов';
  const note = lang === 'en'
    ? 'Compensation is compared only inside the same currency. Scores reflect your ratings, weights and recorded red flags.'
    : 'Компенсация сравнивается только внутри одной валюты. Оценки зависят от ваших рейтингов, весов и отмеченных рисков.';
  const rows = normalized
    .sort((left, right) => offerDecisionScore(right).score - offerDecisionScore(left).score)
    .map((record) => `| ${record.company} | ${record.role} | ${record.currency} | ${moneyText(firstYearCompensation(record), record.currency, lang)} | ${offerDecisionScore(record).score}/100 | ${record.deadline || '—'} |`)
    .join('\n');
  return `# ${title}\n\n${note}\n\n| Company | Role | Currency | First-year package | Score | Deadline |\n|---|---|---:|---:|---:|---|\n${rows || '| — | — | — | — | — | — |'}\n`;
}

export function safeOfferFilename(value) {
  const normalized = text(value, 180)
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9а-яё._-]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return normalized || 'offer';
}
