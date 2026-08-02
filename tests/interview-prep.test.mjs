import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInterviewPrepBackup, createInterviewSession, generateInterviewQuestions, interviewReadiness,
  interviewSessionToMarkdown, mergeInterviewSessions, normalizeInterviewPrep, normalizeInterviewSession,
  parseInterviewPrepBackup, safeInterviewFilename, updateInterviewAnswer, upsertStarStory,
} from '../js/interview-prep.mjs';

const now = '2026-08-02T10:00:00.000Z';
const base = { company: 'Acme', role: 'Frontend Engineer', locale: 'en', interviewDate: '2026-08-12', application: { id: 'app-1', company: 'Acme', role: 'Frontend Engineer' }, skills: ['JavaScript', 'Accessibility'], projects: ['Resume Engine'], gaps: ['Kubernetes'] };

test('question generation is deterministic and bounded', () => {
  const a = generateInterviewQuestions(base);
  const b = generateInterviewQuestions(base);
  assert.deepEqual(a, b);
  assert.ok(a.length <= 16);
  assert.ok(a.some((item) => item.category === 'gap' && item.prompt.includes('Kubernetes')));
  assert.ok(a.every((item) => item.prompt.length <= 420));
});

test('session normalization stores only safe structured references', () => {
  const session = normalizeInterviewSession({ ...base, createdAt: now, updatedAt: now, vacancyText: 'SECRET', resumeDraft: { secret: true } });
  assert.equal(session.application.id, 'app-1');
  assert.equal('vacancyText' in session, false);
  assert.equal('resumeDraft' in session, false);
  assert.deepEqual(session.skills, ['JavaScript', 'Accessibility']);
});

test('answers and STAR stories produce explained readiness', () => {
  let session = createInterviewSession(base, { now });
  const question = session.questions[0];
  session = updateInterviewAnswer(session, question.id, { answer: 'A detailed answer with context, alternatives, trade-offs and a measurable outcome.', rating: 4, completed: true });
  session = upsertStarStory(session, { title: 'Migration', situation: 'A legacy app blocked releases for several teams.', task: 'Reduce deployment risk and restore predictable releases.', action: 'Introduced staged migration, contracts and observability.', result: 'Cut failed deployments by forty percent in one quarter.' });
  const result = interviewReadiness(session);
  assert.ok(result.score > 0 && result.score <= 100);
  assert.deepEqual(Object.keys(result.components), ['coverage', 'confidence', 'star', 'planning']);
});

test('prep schema deduplicates and merge keeps newest session', () => {
  const oldSession = createInterviewSession(base, { now });
  const newer = { ...oldSession, role: 'Senior Frontend Engineer', updatedAt: '2026-08-03T10:00:00.000Z' };
  assert.equal(normalizeInterviewPrep({ sessions: [oldSession, newer] }).sessions[0].role, 'Senior Frontend Engineer');
  assert.equal(mergeInterviewSessions([oldSession], [newer])[0].role, 'Senior Frontend Engineer');
});

test('versioned backup round-trips and rejects future versions', () => {
  const session = createInterviewSession(base, { now });
  const backup = createInterviewPrepBackup({ sessions: [session] }, { now });
  assert.equal(parseInterviewPrepBackup(backup).sessions.length, 1);
  assert.throws(() => parseInterviewPrepBackup(JSON.stringify({ type: 'auto-resume-interview-prep', version: 999, prep: {} })), /INTERVIEW_NEWER/);
});

test('Markdown export includes readiness and excludes raw source fields', () => {
  const session = createInterviewSession(base, { now });
  const markdown = interviewSessionToMarkdown(session);
  assert.match(markdown, /Readiness/);
  assert.match(markdown, /Application ID: app-1/);
  assert.doesNotMatch(markdown, /SECRET|vacancyText|resumeDraft/);
});

test('safe filenames restrict extensions', () => {
  assert.equal(safeInterviewFilename('Acme Interview', 'exe'), 'acme-interview.md');
  assert.equal(safeInterviewFilename('Acme Interview', 'json'), 'acme-interview.json');
});
