import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_TEMPLATES,
  DEFAULT_PRESENTATION,
  TEMPLATE_SCHEMA_VERSION,
  TEMPLATE_STYLES,
  contrastRatio,
  createTemplateCatalog,
  normalizePresentation,
  normalizeTemplateDefinition,
  renderResumeDocument,
  resolvePresentation,
  resumeClassName,
  resumeStyleAttribute,
  validateAccentContrast,
  withPresentationTemplate,
} from '../js/template-system.mjs';

const draft = {
  name: 'Ada <script>alert(1)</script>',
  headline: 'Platform Engineer',
  contact: 'Amsterdam · github.com/ada',
  about: 'Builds reliable developer platforms.',
  projects: [
    { name: 'Compiler', description: 'Safe & fast', url: 'https://github.com/ada/compiler' },
    { name: 'Blocked', description: 'Unsafe URL', url: 'javascript:alert(1)' },
  ],
  skills: [{ name: 'JavaScript', percent: 72 }, 'CSS'],
};

const labels = {
  visualLabel: 'Visual resume',
  atsLabel: 'ATS resume',
  avatarAlt: 'Ada avatar',
  about: 'About',
  projects: 'Projects',
  skills: 'Skills',
};

test('template catalog is versioned, capability-limited and data-only', () => {
  assert.equal(TEMPLATE_SCHEMA_VERSION, 1);
  assert.deepEqual(BUILT_IN_TEMPLATES.map((template) => template.id), [
    'visual-classic',
    'visual-studio',
    'visual-minimal',
    'ats-basic',
  ]);
  for (const template of BUILT_IN_TEMPLATES) {
    assert.equal(template.version, 1);
    assert.ok(['visual', 'ats'].includes(template.mode));
    assert.equal(typeof template.renderer, 'string');
    assert.doesNotMatch(JSON.stringify(template), /function|<script|javascript:/i);
  }

  const external = normalizeTemplateDefinition({
    id: 'partner-clean',
    version: 1,
    name: 'Partner Clean',
    description: 'Data-only partner theme',
    mode: 'visual',
    renderer: 'minimal',
    capabilities: ['font', 'accent', 'arbitrary-code'],
    defaultAccent: '#123456',
  });
  assert.deepEqual(external.capabilities, ['font', 'accent']);
  const catalog = createTemplateCatalog([external, { id: 'bad', renderer: '<script>' }]);
  assert.equal(catalog.get('partner-clean').renderer, 'minimal');
  assert.equal(catalog.has('bad'), false);
});

test('presentation schema migrates old drafts and falls back safely', () => {
  assert.deepEqual(normalizePresentation(null), DEFAULT_PRESENTATION);
  const unknown = resolvePresentation({ templateId: 'marketplace-removed', templateVersion: 1, accent: '#112233' }, { mode: 'visual' });
  assert.equal(unknown.fallbackUsed, true);
  assert.equal(unknown.fallbackReason, 'unknown-template');
  assert.equal(unknown.presentation.templateId, 'visual-classic');
  assert.equal(unknown.presentation.accent, '#112233');

  const newer = resolvePresentation({ templateId: 'visual-studio', templateVersion: 99 }, { mode: 'visual' });
  assert.equal(newer.fallbackReason, 'newer-template-version');
  assert.equal(newer.presentation.templateId, 'visual-classic');

  const ats = normalizePresentation(null, { mode: 'ats' });
  assert.equal(ats.templateId, 'ats-basic');
  assert.equal(ats.schemaVersion, 1);
});

test('switching ATS preserves the selected visual template and safe tokens', () => {
  let presentation = withPresentationTemplate(DEFAULT_PRESENTATION, 'visual-studio');
  presentation = normalizePresentation({ ...presentation, accent: '#0f766e', font: 'georgia', density: 'compact', spacing: 'tight' });
  assert.equal(presentation.templateId, 'visual-studio');
  assert.equal(presentation.visualTemplateId, 'visual-studio');

  presentation = withPresentationTemplate(presentation, 'ats');
  assert.equal(presentation.templateId, 'ats-basic');
  assert.equal(presentation.visualTemplateId, 'visual-studio');
  assert.equal(presentation.font, 'georgia');

  presentation = withPresentationTemplate(presentation, 'visual');
  assert.equal(presentation.templateId, 'visual-studio');
  assert.equal(presentation.accent, '#0f766e');
});

test('contrast validator reports WCAG AA readability', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(validateAccentContrast({ ...DEFAULT_PRESENTATION, accent: '#111111' }).passes, true);
  const low = validateAccentContrast({ ...DEFAULT_PRESENTATION, accent: '#f5f5f5' });
  assert.equal(low.passes, false);
  assert.ok(low.ratio < 4.5);
});

test('renderer contracts escape content, sanitize URLs and separate ATS media', () => {
  for (const templateId of ['visual-classic', 'visual-studio', 'visual-minimal']) {
    const presentation = normalizePresentation({ ...DEFAULT_PRESENTATION, templateId, visualTemplateId: templateId });
    const html = renderResumeDocument({ draft, user: { avatar_url: 'https://example.com/avatar.png' }, presentation, editable: true, labels, logoUrl: 'blob:https://example.com/local-logo' });
    assert.match(html, /data-custom-logo="true"/);
    assert.match(html, /<canvas id="skillsChart"><\/canvas>/);
    assert.match(html, /contenteditable="true"/);
    assert.match(html, /Ada &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /javascript:alert/);
  }

  const atsPresentation = normalizePresentation({ ...DEFAULT_PRESENTATION, templateId: 'ats-basic' }, { mode: 'ats' });
  const ats = renderResumeDocument({ draft, user: { avatar_url: 'https://example.com/avatar.png' }, presentation: atsPresentation, editable: false, labels, logoUrl: 'blob:https://example.com/local-logo' });
  assert.match(ats, /ATS resume/);
  assert.doesNotMatch(ats, /<img/);
  assert.doesNotMatch(ats, /skillsChart/);
  assert.doesNotMatch(ats, /contenteditable/);
});

test('visual fingerprints stay deterministic for every built-in renderer', () => {
  const fingerprints = BUILT_IN_TEMPLATES.map((template) => {
    const presentation = normalizePresentation({ ...DEFAULT_PRESENTATION, templateId: template.id, visualTemplateId: template.mode === 'visual' ? template.id : 'visual-classic' }, { mode: template.mode });
    return {
      id: template.id,
      className: resumeClassName(presentation),
      style: resumeStyleAttribute(presentation),
      hasChart: renderResumeDocument({ draft, presentation, editable: false, labels }).includes('skillsChart'),
    };
  });
  assert.deepEqual(fingerprints, [
    { id: 'visual-classic', className: 'resume-paper resume-visual template-visual-classic font-inter density-comfortable spacing-normal', style: '--resume-accent:#6d28d9;--resume-font:Inter,system-ui,sans-serif;--resume-pad:42px;--resume-body-size:14px;--resume-section-gap:24px', hasChart: true },
    { id: 'visual-studio', className: 'resume-paper resume-visual template-visual-studio font-inter density-comfortable spacing-normal', style: '--resume-accent:#6d28d9;--resume-font:Inter,system-ui,sans-serif;--resume-pad:42px;--resume-body-size:14px;--resume-section-gap:24px', hasChart: true },
    { id: 'visual-minimal', className: 'resume-paper resume-visual template-visual-minimal font-inter density-comfortable spacing-normal', style: '--resume-accent:#6d28d9;--resume-font:Inter,system-ui,sans-serif;--resume-pad:42px;--resume-body-size:14px;--resume-section-gap:24px', hasChart: true },
    { id: 'ats-basic', className: 'resume-paper resume-ats template-ats-basic font-inter density-comfortable spacing-normal', style: '--resume-accent:#6d28d9;--resume-font:Inter,system-ui,sans-serif;--resume-pad:42px;--resume-body-size:14px;--resume-section-gap:24px', hasChart: false },
  ]);
  assert.doesNotMatch(TEMPLATE_STYLES, /@import|https?:\/\//i);
});
