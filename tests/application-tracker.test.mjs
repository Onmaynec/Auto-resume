import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_STATUSES,
  applicationStatistics,
  buildApplicationCsv,
  createApplicationTrackerBackup,
  filterApplications,
  followUpState,
  mergeApplicationRecords,
  normalizeApplicationRecord,
  normalizeApplicationTracker,
  parseApplicationTrackerBackup,
  safeTrackerFilename,
  setApplicationStatus,
  upsertApplication,
} from '../js/application-tracker.mjs';

const NOW = '2026-08-02T09:40:00.000Z';
const TODAY = '2026-08-02';

function record(overrides = {}) {
  return normalizeApplicationRecord({
    company: 'Acme',
    role: 'Frontend Developer',
    vacancyUrl: 'https://jobs.example.com/frontend',
    status: 'applied',
    appliedDate: '2026-08-01',
    followUpDate: '2026-08-04',
    notes: 'Send portfolio link.',
    draft: { id: 'draft-1', name: 'Frontend — Acme' },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }, { now: NOW });
}

test('record normalization is bounded and accepts HTTPS vacancy URLs only', () => {
  const normalized = normalizeApplicationRecord({
    company: ` Acme ${'x'.repeat(200)} `,
    role: 'Engineer',
    vacancyUrl: 'http://example.com/job',
    status: 'unknown',
    appliedDate: '2026-02-30',
    followUpDate: '2026-08-03',
    notes: 'n'.repeat(3000),
    draftId: 'draft-1',
    draftName: 'ATS draft',
  }, { now: NOW });
  assert.equal(normalized.company.length, 120);
  assert.equal(normalized.vacancyUrl, '');
  assert.equal(normalized.status, 'saved');
  assert.equal(normalized.appliedDate, '');
  assert.equal(normalized.followUpDate, '2026-08-03');
  assert.equal(normalized.notes.length, 2400);
  assert.deepEqual(normalized.draft, { id: 'draft-1', name: 'ATS draft' });
});

test('tracker schema deduplicates records and enforces stable statuses', () => {
  const first = record({ id: 'same', updatedAt: '2026-08-01T00:00:00.000Z' });
  const newer = record({ id: 'same', role: 'Senior Frontend Developer', updatedAt: '2026-08-02T00:00:00.000Z' });
  const tracker = normalizeApplicationTracker({ version: 99, records: [first, newer] });
  assert.equal(tracker.version, 1);
  assert.equal(tracker.records.length, 1);
  assert.equal(tracker.records[0].role, 'Senior Frontend Developer');
  assert.deepEqual(APPLICATION_STATUSES, ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']);
});

test('CRUD preserves creation time and updates status deterministically', () => {
  const created = record({ id: 'acme-role' });
  const updated = upsertApplication([created], { ...created, notes: 'Updated' }, { now: '2026-08-03T00:00:00.000Z' });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].createdAt, created.createdAt);
  assert.equal(updated[0].updatedAt, '2026-08-03T00:00:00.000Z');
  assert.equal(updated[0].notes, 'Updated');
  const progressed = setApplicationStatus(updated, 'acme-role', 'interview', { now: '2026-08-04T00:00:00.000Z' });
  assert.equal(progressed[0].status, 'interview');
  assert.equal(progressed[0].updatedAt, '2026-08-04T00:00:00.000Z');
});

test('follow-up state, filters and statistics prioritize actionable records', () => {
  const records = [
    record({ id: 'overdue', company: 'Old Co', followUpDate: '2026-08-01', status: 'screening' }),
    record({ id: 'soon', company: 'Soon Co', followUpDate: '2026-08-04', status: 'interview' }),
    record({ id: 'later', company: 'Later Co', followUpDate: '2026-08-20', status: 'applied' }),
    record({ id: 'done', company: 'Offer Co', followUpDate: '2026-07-01', status: 'offer' }),
  ];
  assert.equal(followUpState(records[0], TODAY), 'overdue');
  assert.equal(followUpState(records[1], TODAY), 'due-soon');
  assert.equal(followUpState(records[3], TODAY), 'none');
  assert.deepEqual(filterApplications(records, {}, { today: TODAY }).map((item) => item.id), ['overdue', 'soon', 'later', 'done']);
  assert.deepEqual(filterApplications(records, { due: 'overdue' }, { today: TODAY }).map((item) => item.id), ['overdue']);
  assert.deepEqual(filterApplications(records, { query: 'soon' }, { today: TODAY }).map((item) => item.id), ['soon']);
  assert.deepEqual(applicationStatistics(records, { today: TODAY }), { total: 4, active: 3, interviews: 1, offers: 1, overdue: 1 });
});

test('merge keeps the newest record by id', () => {
  const older = record({ id: 'same', company: 'Old', updatedAt: '2026-08-01T00:00:00.000Z' });
  const newer = record({ id: 'same', company: 'New', updatedAt: '2026-08-03T00:00:00.000Z' });
  const merged = mergeApplicationRecords([older], [newer]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].company, 'New');
});

test('versioned JSON export round-trips and rejects incompatible payloads', () => {
  const tracker = { records: [record()] };
  const text = createApplicationTrackerBackup(tracker, { now: NOW });
  const parsed = parseApplicationTrackerBackup(text);
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].company, 'Acme');
  assert.throws(() => parseApplicationTrackerBackup('{bad'), { code: 'TRACKER_JSON' });
  assert.throws(() => parseApplicationTrackerBackup(JSON.stringify({ type: 'wrong', version: 1 })), { code: 'TRACKER_TYPE' });
  assert.throws(() => parseApplicationTrackerBackup(JSON.stringify({ type: 'auto-resume-application-tracker', version: 2, tracker: {} })), { code: 'TRACKER_NEWER' });
});

test('CSV export escapes spreadsheet formulas and preserves draft references', () => {
  const csv = buildApplicationCsv([record({ company: '=WEBSERVICE("bad")', notes: '+SUM(1,2)' })]);
  assert.match(csv, /"'=WEBSERVICE\(""bad""\)"/);
  assert.match(csv, /"'\+SUM\(1,2\)"/);
  assert.match(csv, /"draft-1"/);
  assert.match(csv, /"Frontend — Acme"/);
});

test('filenames are safe and extension-limited', () => {
  assert.equal(safeTrackerFilename('../Applications 2026', 'csv'), 'applications-2026.csv');
  assert.equal(safeTrackerFilename('', 'exe'), 'applications.json');
});
