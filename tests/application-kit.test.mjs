import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_KIT_SCHEMA_VERSION,
  applicationKitFingerprint,
  applicationKitToMarkdown,
  applicationKitToText,
  generateApplicationKit,
  normalizeApplicationKitInput,
  sanitizeProjectUrl,
} from '../js/application-kit.mjs';

const profile = {
  name: 'Octo Cat',
  login: 'octocat',
  bio: 'Builds accessible developer tools.',
};
const analysis = {
  score: 67,
  requirements: ['JavaScript', 'TypeScript', 'Kubernetes'],
  matched: ['JavaScript', 'TypeScript'],
  missing: ['Kubernetes'],
};
const projects = [
  {
    name: 'resume-engine',
    full_name: 'octocat/resume-engine',
    html_url: 'https://github.com/octocat/resume-engine',
    description: 'Accessible JavaScript resume builder.',
    language: 'JavaScript',
    topics: ['accessibility', 'pwa'],
    stargazers_count: 42,
  },
  {
    name: 'api-observer',
    html_url: 'javascript:alert(1)',
    description: 'TypeScript serverless metrics.',
    language: 'TypeScript',
    topics: ['serverless'],
  },
];

test('application kit input normalizes locale, tone and untrusted URLs', () => {
  const normalized = normalizeApplicationKitInput({ locale: 'de', tone: 'invented', profile, analysis, projects });
  assert.equal(normalized.locale, 'ru');
  assert.equal(normalized.tone, 'balanced');
  assert.equal(normalized.projects[0].url, 'https://github.com/octocat/resume-engine');
  assert.equal(normalized.projects[1].url, '');
  assert.equal(sanitizeProjectUrl('http://example.com/repo'), '');
});

test('Russian kit is deterministic and treats missing skills as a plan, not experience', () => {
  const first = generateApplicationKit({ locale: 'ru', tone: 'balanced', profile, analysis, projects });
  const second = generateApplicationKit({ locale: 'ru', tone: 'balanced', profile, analysis, projects });
  assert.equal(first.schemaVersion, APPLICATION_KIT_SCHEMA_VERSION);
  assert.equal(applicationKitFingerprint(first), applicationKitFingerprint(second));
  assert.match(first.coverLetter, /подтверждает навыки: JavaScript, TypeScript/);
  assert.match(first.coverLetter, /Kubernetes я не выдаю за имеющийся опыт/);
  assert.doesNotMatch(first.coverLetter, /опыт работы с Kubernetes/i);
  assert.equal(first.gapPlan[0].skill, 'Kubernetes');
});

test('English kit and exporters preserve evidence and safe HTTPS links', () => {
  const kit = generateApplicationKit({ locale: 'en', tone: 'detailed', profile, analysis, projects });
  const markdown = applicationKitToMarkdown(kit);
  const text = applicationKitToText(kit);
  assert.match(kit.coverLetter, /I do not present Kubernetes as existing experience/);
  assert.match(markdown, /\[resume-engine\]\(https:\/\/github\.com\/octocat\/resume-engine\)/);
  assert.doesNotMatch(markdown, /javascript:/);
  assert.match(text, /APPLICATION KIT/);
  assert.match(text, /INTERVIEW QUESTIONS/);
});

test('tone limits generated sections and never includes the raw vacancy text', () => {
  const secret = 'CONFIDENTIAL-VACANCY-TEXT-7f9c';
  const concise = generateApplicationKit({ locale: 'en', tone: 'concise', profile, analysis: { ...analysis, rawText: secret }, projects });
  const detailed = generateApplicationKit({ locale: 'en', tone: 'detailed', profile, analysis: { ...analysis, rawText: secret }, projects });
  assert.ok(concise.interviewQuestions.length <= 4);
  assert.ok(detailed.interviewQuestions.length <= 8);
  assert.ok(detailed.interviewQuestions.length >= concise.interviewQuestions.length);
  assert.doesNotMatch(JSON.stringify(detailed), new RegExp(secret));
});

test('malformed generated data is bounded before export', () => {
  const markdown = applicationKitToMarkdown({
    locale: 'en',
    tone: 'invalid',
    profile: { name: 'A'.repeat(500), login: 'octocat' },
    matchScore: 999,
    coverLetter: 'Hello',
    evidence: Array.from({ length: 30 }, (_, index) => ({ skill: `Skill ${index}`, project: `Project ${index}`, url: 'ftp://example.com' })),
    gapPlan: [],
    interviewQuestions: [],
  });
  assert.match(markdown, /100%/);
  assert.doesNotMatch(markdown, /ftp:/);
  assert.ok(markdown.length < 7000);
});
