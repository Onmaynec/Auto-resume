import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFER_LAB_KEY,
  createOfferLabBackup,
  createOfferRecord,
  deadlineState,
  firstYearCompensation,
  mergeOfferRecords,
  normalizeOfferLab,
  normalizeOfferRecord,
  offerDecisionScore,
  offerLabStatistics,
  offerToMarkdown,
  parseOfferLabBackup,
  safeOfferFilename,
  upsertOffer,
} from '../js/offer-lab.mjs';

test('offer records keep only allowlisted normalized fields', () => {
  const record = normalizeOfferRecord({
    id: 'offer-1', company: ' Acme ', role: ' Staff Engineer ', locale: 'en', currency: 'USD',
    application: { id: 'app-1', company: 'Acme', role: 'Staff Engineer', notes: 'must not copy', vacancyUrl: 'https://secret.example' },
    compensation: { base: 150000, bonus: 20000, equity: 30000, signOn: 10000, benefits: 5000, commuteCost: 1200 },
    ratings: { compensation: 6, growth: -1, team: 4 }, weights: { compensation: 5, growth: 4 },
    redFlags: [' unclear equity ', 'unclear equity', 'on-call details'], notes: 'Ask about vesting.', rawVacancyText: 'private',
  }, { now: '2026-08-03T12:00:00.000Z' });

  assert.equal(record.company, 'Acme');
  assert.equal(record.role, 'Staff Engineer');
  assert.deepEqual(record.application, { id: 'app-1', company: 'Acme', role: 'Staff Engineer' });
  assert.equal(record.ratings.compensation, 5);
  assert.equal(record.ratings.growth, 0);
  assert.deepEqual(record.redFlags, ['unclear equity', 'on-call details']);
  assert.equal('rawVacancyText' in record, false);
  assert.equal('notes' in record.application, false);
  assert.equal('vacancyUrl' in record.application, false);
});

test('decision score is explainable and risk capped', () => {
  const clean = createOfferRecord({
    company: 'Acme', role: 'Engineer', ratings: Object.fromEntries(['compensation','growth','team','product','workLife','stability','flexibility'].map((key) => [key, 5])),
    weights: Object.fromEntries(['compensation','growth','team','product','workLife','stability','flexibility'].map((key) => [key, 5])),
  }, { now: '2026-08-03T12:00:00.000Z' });
  assert.deepEqual(offerDecisionScore(clean), {
    score: 100,
    weightedScore: 100,
    riskPenalty: 0,
    components: Object.fromEntries(['compensation','growth','team','product','workLife','stability','flexibility'].map((key) => [key, { rating: 5, weight: 5, score: 100 }])),
  });

  const risky = { ...clean, redFlags: Array.from({ length: 20 }, (_, index) => `risk ${index}`) };
  const result = offerDecisionScore(risky);
  assert.equal(result.weightedScore, 100);
  assert.equal(result.riskPenalty, 18);
  assert.equal(result.score, 82);
});

test('first year compensation stays currency-local and subtracts commute costs', () => {
  const record = createOfferRecord({
    company: 'Acme', role: 'Engineer', currency: 'EUR',
    compensation: { base: 100000, bonus: 10000, equity: 15000, signOn: 5000, benefits: 3000, commuteCost: 2500 },
  });
  assert.equal(firstYearCompensation(record), 130500);
});

test('upsert and merge prefer the newest duplicate', () => {
  const old = createOfferRecord({ id: 'same', company: 'Acme', role: 'Engineer', notes: 'old' }, { now: '2026-08-01T00:00:00.000Z' });
  const updated = upsertOffer([old], { ...old, notes: 'new' }, { now: '2026-08-02T00:00:00.000Z' })[0];
  const merged = mergeOfferRecords([old], [updated]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].notes, 'new');
});

test('backup is versioned and future schemas are rejected', () => {
  const record = createOfferRecord({ company: 'Acme', role: 'Engineer' }, { now: '2026-08-03T00:00:00.000Z' });
  const source = createOfferLabBackup([record], { now: '2026-08-03T01:00:00.000Z' });
  const parsed = parseOfferLabBackup(source);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.records.length, 1);
  assert.throws(() => parseOfferLabBackup(JSON.stringify({ version: 2, records: [] })), /OFFER_BACKUP_FUTURE_VERSION/);
  assert.equal(OFFER_LAB_KEY, 'auto-resume:offer-lab:v1');
});

test('statistics and deadlines are deterministic', () => {
  const first = createOfferRecord({ company: 'A', role: 'One', deadline: '2026-08-04', ratings: { compensation: 5 } }, { now: '2026-08-03T00:00:00.000Z' });
  const second = createOfferRecord({ company: 'B', role: 'Two', deadline: '2026-08-20', ratings: { compensation: 1 } }, { now: '2026-08-03T00:00:01.000Z' });
  const stats = offerLabStatistics([first, second], { now: new Date('2026-08-03T12:00:00.000Z') });
  assert.equal(stats.total, 2);
  assert.equal(stats.urgent, 1);
  assert.equal(deadlineState('2026-08-02', { now: new Date('2026-08-03T12:00:00.000Z') }), 'expired');
  assert.equal(deadlineState('2026-08-10', { now: new Date('2026-08-03T12:00:00.000Z') }), 'soon');
});

test('markdown export does not invent currency conversion or tracker details', () => {
  const record = createOfferRecord({
    company: 'Acme', role: 'Engineer', currency: 'USD', application: { id: 'app-1', company: 'Acme', role: 'Engineer', notes: 'secret' },
    notes: 'Verify equity terms.', redFlags: ['Equity strike price missing'],
  });
  const markdown = offerToMarkdown(record, { locale: 'en' });
  assert.match(markdown, /Acme — Engineer/);
  assert.match(markdown, /personal decision aid/);
  assert.doesNotMatch(markdown, /secret/);
  assert.doesNotMatch(markdown, /exchange rate|converted/i);
  assert.equal(safeOfferFilename(' Acme / Staff Engineer '), 'acme-staff-engineer');
});

test('normalizer caps the collection and removes duplicate ids', () => {
  const records = Array.from({ length: 75 }, (_, index) => ({ id: `id-${index % 65}`, company: `C${index}`, role: 'Engineer', updatedAt: `2026-08-03T00:${String(index % 60).padStart(2, '0')}:00.000Z` }));
  const lab = normalizeOfferLab({ version: 1, records });
  assert.ok(lab.records.length <= 60);
  assert.equal(new Set(lab.records.map((item) => item.id)).size, lab.records.length);
});
