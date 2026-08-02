import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RESUME_AUDIT_SCHEMA_VERSION,
  auditResume,
  buildResumeAuditMarkdown,
  buildResumeAuditText,
  normalizeResumeAuditInput,
  resumeAuditFilename,
} from '../js/resume-audit.mjs';

const strongDraft = {
  locale: 'en',
  name: 'Octo Cat',
  headline: 'TypeScript / JavaScript Developer',
  contact: 'octo@example.com · https://github.com/octocat',
  about: 'Product-minded developer building accessible web applications and privacy-safe developer tooling. I focus on reliable delivery, measurable outcomes and clear technical communication.',
  projects: [
    {
      name: 'Resume Engine',
      url: 'https://github.com/octocat/resume-engine',
      description: 'Built an accessible offline-first resume editor, added 120 automated checks and reduced export failures by 35%.',
    },
    {
      name: 'API Observer',
      url: 'https://github.com/octocat/api-observer',
      description: 'Implemented a TypeScript observability gateway that handles 50,000 requests per day and cut cache latency by 42%.',
    },
    {
      name: 'Design System',
      url: 'https://github.com/octocat/design-system',
      description: 'Designed reusable WCAG-focused components, automated 80 browser checks and improved keyboard coverage to 100%.',
    },
  ],
  skills: ['TypeScript', 'JavaScript', 'Accessibility', 'Testing', 'PWA', 'Serverless'],
};

test('input normalization is bounded and accepts HTTPS project links only', () => {
  const input = normalizeResumeAuditInput({
    locale: 'xx',
    draft: {
      name: ' A '.repeat(300),
      projects: [
        { name: 'Safe', url: 'https://example.com/project', description: 'Valid' },
        { name: 'Unsafe', url: 'http://example.com/project', description: 'Invalid' },
      ],
      skills: Array.from({ length: 40 }, (_, index) => `Skill ${index}`),
    },
    requirements: Array.from({ length: 50 }, (_, index) => `Requirement ${index}`),
    vacancyText: 'SECRET RAW VACANCY',
  });

  assert.equal(input.schemaVersion, RESUME_AUDIT_SCHEMA_VERSION);
  assert.equal(input.locale, 'ru');
  assert.equal(input.draft.projects[0].url, 'https://example.com/project');
  assert.equal(input.draft.projects[1].url, '');
  assert.equal(input.draft.skills.length, 20);
  assert.equal(input.requirements.length, 30);
  assert.equal(JSON.stringify(input).includes('SECRET RAW VACANCY'), false);
});

test('strong resume produces a deterministic explained score', () => {
  const first = auditResume({ locale: 'en', draft: strongDraft, requirements: ['TypeScript', 'JavaScript', 'Accessibility', 'Testing'] });
  const second = auditResume({ locale: 'en', draft: strongDraft, requirements: ['TypeScript', 'JavaScript', 'Accessibility', 'Testing'] });

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, 1);
  assert.equal(Object.values(first.categories).reduce((sum, category) => sum + category.score, 0), first.score);
  assert.ok(first.score >= 85);
  assert.equal(first.stats.requirementCoverage, 100);
});

test('weak resume returns stable issue codes without modifying input', () => {
  const draft = { name: '', headline: '', contact: '', about: '', projects: [], skills: [] };
  const snapshot = JSON.stringify(draft);
  const report = auditResume({ locale: 'ru', draft, requirements: ['Kubernetes'] });
  const codes = report.issues.map((issue) => issue.code);

  assert.ok(report.score < 50);
  assert.ok(codes.includes('NAME_MISSING'));
  assert.ok(codes.includes('PROJECTS_MISSING'));
  assert.ok(codes.includes('KEYWORD_GAPS'));
  assert.equal(JSON.stringify(draft), snapshot);
});

test('missing requirements remain recommendations rather than experience claims', () => {
  const report = auditResume({ locale: 'en', draft: strongDraft, requirements: ['TypeScript', 'Kubernetes', 'Rust'] });
  const gap = report.issues.find((issue) => issue.code === 'KEYWORD_GAPS');

  assert.equal(report.stats.requirementCoverage, 33);
  assert.deepEqual(gap.context.missing, ['Kubernetes', 'Rust']);
  assert.match(gap.action, /never present missing skills as experience/i);
});

test('RU and EN exports are bounded and preserve issue codes', () => {
  const ru = auditResume({ locale: 'ru', draft: { ...strongDraft, locale: 'ru', about: 'Коротко.' }, requirements: ['Kubernetes'] });
  const en = auditResume({ locale: 'en', draft: strongDraft, requirements: ['Kubernetes'] });
  const markdown = buildResumeAuditMarkdown(ru);
  const text = buildResumeAuditText(en);

  assert.match(markdown, /Аудит качества резюме/);
  assert.match(markdown, /SUMMARY_LENGTH/);
  assert.match(text, /Resume Quality Audit/);
  assert.equal(markdown.includes('undefined'), false);
  assert.equal(text.includes('**'), false);
});

test('filenames are safe and locale-aware', () => {
  assert.equal(resumeAuditFilename('../Octo Cat', 'en', 'md'), 'octo-cat-resume-audit-en.md');
  assert.equal(resumeAuditFilename('', 'xx', 'txt'), 'developer-resume-audit-ru.txt');
});
