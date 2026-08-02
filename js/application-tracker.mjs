export const APPLICATION_TRACKER_VERSION = 1;
export const APPLICATION_TRACKER_KEY = 'auto-resume:application-tracker:v1';
export const APPLICATION_STATUSES = Object.freeze(['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']);
export const TERMINAL_APPLICATION_STATUSES = Object.freeze(['offer', 'rejected', 'withdrawn']);
export const MAX_APPLICATIONS = 120;

const MAX = Object.freeze({
  id: 160,
  company: 120,
  role: 160,
  url: 600,
  notes: 2400,
  draftId: 180,
  draftName: 160,
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value, limit) {
  return String(value ?? '').replace(/\0/g, '').trim().slice(0, limit);
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

export function normalizeVacancyUrl(value) {
  const candidate = text(value, MAX.url);
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.href.slice(0, MAX.url) : '';
  } catch {
    return '';
  }
}

export function normalizeApplicationRecord(value, { now = new Date().toISOString() } = {}) {
  if (!value || typeof value !== 'object') return null;
  const company = text(value.company, MAX.company);
  const role = text(value.role, MAX.role);
  if (!company || !role) return null;

  const createdAt = normalizeTimestamp(value.createdAt, now);
  const updatedAt = normalizeTimestamp(value.updatedAt, createdAt);
  const id = text(value.id, MAX.id) || buildApplicationId({ company, role, createdAt });
  const status = APPLICATION_STATUSES.includes(value.status) ? value.status : 'saved';
  const draftSource = value.draft && typeof value.draft === 'object' ? value.draft : {};
  const draftId = text(draftSource.id ?? value.draftId, MAX.draftId);
  const draftName = text(draftSource.name ?? value.draftName, MAX.draftName);

  return {
    id,
    company,
    role,
    vacancyUrl: normalizeVacancyUrl(value.vacancyUrl ?? value.url),
    status,
    appliedDate: normalizeIsoDate(value.appliedDate),
    followUpDate: normalizeIsoDate(value.followUpDate),
    notes: text(value.notes, MAX.notes),
    draft: draftId ? { id: draftId, name: draftName || draftId } : null,
    createdAt,
    updatedAt,
  };
}

export function createApplicationRecord(input, { now = new Date().toISOString() } = {}) {
  const value = input && typeof input === 'object' ? input : {};
  return normalizeApplicationRecord({ ...value, createdAt: now, updatedAt: now }, { now });
}

export function normalizeApplicationTracker(value) {
  const source = value && typeof value === 'object' ? value : {};
  const records = Array.isArray(source.records)
    ? source.records.map((record) => normalizeApplicationRecord(record)).filter(Boolean)
    : [];
  const unique = [];
  const seen = new Set();
  records
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .forEach((record) => {
      if (!seen.has(record.id) && unique.length < MAX_APPLICATIONS) {
        seen.add(record.id);
        unique.push(record);
      }
    });
  return {
    version: APPLICATION_TRACKER_VERSION,
    records: unique,
    updatedAt: normalizeTimestamp(source.updatedAt, null),
  };
}

export function upsertApplication(records, value, { now = new Date().toISOString() } = {}) {
  const current = Array.isArray(records) ? records.map((item) => normalizeApplicationRecord(item)).filter(Boolean) : [];
  const existing = current.find((item) => item.id === value?.id);
  const normalized = normalizeApplicationRecord({
    ...existing,
    ...clone(value || {}),
    createdAt: existing?.createdAt || value?.createdAt || now,
    updatedAt: now,
  }, { now });
  if (!normalized) throw new TypeError('APPLICATION_INVALID');
  return [normalized, ...current.filter((item) => item.id !== normalized.id)]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_APPLICATIONS);
}

export function removeApplication(records, id) {
  return (Array.isArray(records) ? records : [])
    .map((item) => normalizeApplicationRecord(item))
    .filter((item) => item && item.id !== id);
}

export function setApplicationStatus(records, id, status, { now = new Date().toISOString() } = {}) {
  if (!APPLICATION_STATUSES.includes(status)) return Array.isArray(records) ? records : [];
  return (Array.isArray(records) ? records : []).map((record) => {
    const normalized = normalizeApplicationRecord(record);
    return normalized?.id === id ? { ...normalized, status, updatedAt: now } : normalized;
  }).filter(Boolean);
}

export function mergeApplicationRecords(current, incoming) {
  const byId = new Map();
  [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]
    .map((item) => normalizeApplicationRecord(item))
    .filter(Boolean)
    .forEach((record) => {
      const previous = byId.get(record.id);
      if (!previous || Date.parse(record.updatedAt) >= Date.parse(previous.updatedAt)) byId.set(record.id, record);
    });
  return [...byId.values()]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_APPLICATIONS);
}

export function followUpState(record, today = new Date().toISOString().slice(0, 10)) {
  const normalized = normalizeApplicationRecord(record);
  if (!normalized || !normalized.followUpDate || TERMINAL_APPLICATION_STATUSES.includes(normalized.status)) return 'none';
  if (normalized.followUpDate < today) return 'overdue';
  const soon = addDays(today, 3);
  if (normalized.followUpDate <= soon) return 'due-soon';
  return 'scheduled';
}

export function filterApplications(records, filters = {}, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const query = text(filters.query, 200).toLocaleLowerCase();
  const status = APPLICATION_STATUSES.includes(filters.status) ? filters.status : 'all';
  const due = ['all', 'overdue', 'due-soon', 'scheduled', 'none'].includes(filters.due) ? filters.due : 'all';
  return (Array.isArray(records) ? records : [])
    .map((record) => normalizeApplicationRecord(record))
    .filter(Boolean)
    .filter((record) => status === 'all' || record.status === status)
    .filter((record) => {
      const state = followUpState(record, today);
      return due === 'all' || state === due;
    })
    .filter((record) => !query || [record.company, record.role, record.notes, record.draft?.name || ''].join('\n').toLocaleLowerCase().includes(query))
    .sort((left, right) => {
      const leftRank = followUpRank(left, today);
      const rightRank = followUpRank(right, today);
      return leftRank - rightRank
        || dateRank(left.followUpDate) - dateRank(right.followUpDate)
        || Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
        || left.company.localeCompare(right.company);
    });
}

export function applicationStatistics(records, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const normalized = (Array.isArray(records) ? records : []).map((record) => normalizeApplicationRecord(record)).filter(Boolean);
  return {
    total: normalized.length,
    active: normalized.filter((record) => !TERMINAL_APPLICATION_STATUSES.includes(record.status)).length,
    interviews: normalized.filter((record) => record.status === 'interview').length,
    offers: normalized.filter((record) => record.status === 'offer').length,
    overdue: normalized.filter((record) => followUpState(record, today) === 'overdue').length,
  };
}

export function createApplicationTrackerBackup(tracker, { now = new Date().toISOString() } = {}) {
  return JSON.stringify({
    type: 'auto-resume-application-tracker',
    version: APPLICATION_TRACKER_VERSION,
    exportedAt: now,
    tracker: normalizeApplicationTracker(tracker),
  }, null, 2);
}

export function parseApplicationTrackerBackup(textValue) {
  let payload;
  try {
    payload = JSON.parse(String(textValue || '').replace(/^\uFEFF/, ''));
  } catch {
    throw codedError('TRACKER_JSON');
  }
  if (payload?.type !== 'auto-resume-application-tracker') throw codedError('TRACKER_TYPE');
  if (Number(payload.version) > APPLICATION_TRACKER_VERSION) throw codedError('TRACKER_NEWER');
  return normalizeApplicationTracker(payload.tracker);
}

export function buildApplicationCsv(records) {
  const header = ['Company', 'Role', 'Status', 'Applied date', 'Follow-up date', 'Vacancy URL', 'Draft ID', 'Draft name', 'Notes'];
  const rows = (Array.isArray(records) ? records : []).map((record) => normalizeApplicationRecord(record)).filter(Boolean).map((record) => [
    record.company,
    record.role,
    record.status,
    record.appliedDate,
    record.followUpDate,
    record.vacancyUrl,
    record.draft?.id || '',
    record.draft?.name || '',
    record.notes,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function safeTrackerFilename(value, extension) {
  const base = text(value, 80).toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'applications';
  const ext = ['json', 'csv'].includes(extension) ? extension : 'json';
  return `${base}.${ext}`;
}

function buildApplicationId({ company, role, createdAt }) {
  const slug = `${company}-${role}`.toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'application';
  return `${slug}-${Date.parse(createdAt) || 0}`;
}

function codedError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRank(value) {
  return value ? Date.parse(`${value}T00:00:00.000Z`) : Number.MAX_SAFE_INTEGER;
}

function followUpRank(record, today) {
  return { overdue: 0, 'due-soon': 1, scheduled: 2, none: 3 }[followUpState(record, today)] ?? 3;
}

function csvCell(value) {
  let cell = String(value ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}
