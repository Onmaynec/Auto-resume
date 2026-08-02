export const TEMPLATE_SCHEMA_VERSION = 1;
export const TEMPLATE_CAPABILITIES = Object.freeze([
  'accent',
  'density',
  'font',
  'logo',
  'spacing',
]);

const TEMPLATE_RENDERERS = new Set(['classic', 'studio', 'minimal', 'ats']);
const TEMPLATE_MODES = new Set(['visual', 'ats']);
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export const FONT_OPTIONS = Object.freeze({
  inter: { id: 'inter', label: 'Inter', stack: 'Inter,system-ui,sans-serif' },
  system: { id: 'system', label: 'System UI', stack: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  georgia: { id: 'georgia', label: 'Georgia', stack: 'Georgia,"Times New Roman",serif' },
  arial: { id: 'arial', label: 'Arial', stack: 'Arial,Helvetica,sans-serif' },
});

export const DENSITY_OPTIONS = Object.freeze({
  compact: { id: 'compact', label: 'Compact', padding: 30, bodySize: 13 },
  comfortable: { id: 'comfortable', label: 'Comfortable', padding: 42, bodySize: 14 },
  spacious: { id: 'spacious', label: 'Spacious', padding: 54, bodySize: 15 },
});

export const SPACING_OPTIONS = Object.freeze({
  tight: { id: 'tight', label: 'Tight', gap: 16 },
  normal: { id: 'normal', label: 'Normal', gap: 24 },
  relaxed: { id: 'relaxed', label: 'Relaxed', gap: 32 },
});

export const BUILT_IN_TEMPLATES = Object.freeze([
  Object.freeze({
    id: 'visual-classic',
    version: 1,
    name: 'Classic',
    description: 'Balanced two-column visual resume with an accent chart.',
    mode: 'visual',
    renderer: 'classic',
    capabilities: Object.freeze(['accent', 'density', 'font', 'logo', 'spacing']),
    defaultAccent: '#6d28d9',
  }),
  Object.freeze({
    id: 'visual-studio',
    version: 1,
    name: 'Studio',
    description: 'Editorial header with a strong portfolio-first hierarchy.',
    mode: 'visual',
    renderer: 'studio',
    capabilities: Object.freeze(['accent', 'density', 'font', 'logo', 'spacing']),
    defaultAccent: '#0f766e',
  }),
  Object.freeze({
    id: 'visual-minimal',
    version: 1,
    name: 'Minimal',
    description: 'Quiet monochrome layout with generous whitespace.',
    mode: 'visual',
    renderer: 'minimal',
    capabilities: Object.freeze(['accent', 'density', 'font', 'logo', 'spacing']),
    defaultAccent: '#334155',
  }),
  Object.freeze({
    id: 'ats-basic',
    version: 1,
    name: 'ATS Basic',
    description: 'Machine-readable single-column fallback without decorative media.',
    mode: 'ats',
    renderer: 'ats',
    capabilities: Object.freeze(['density', 'font', 'spacing']),
    defaultAccent: '#111111',
  }),
]);

const BUILT_IN_CATALOG = new Map(BUILT_IN_TEMPLATES.map((template) => [template.id, template]));

export const DEFAULT_PRESENTATION = Object.freeze({
  schemaVersion: TEMPLATE_SCHEMA_VERSION,
  templateId: 'visual-classic',
  templateVersion: 1,
  visualTemplateId: 'visual-classic',
  accent: '#6d28d9',
  font: 'inter',
  density: 'comfortable',
  spacing: 'normal',
});

export function normalizeTemplateDefinition(value) {
  if (!value || typeof value !== 'object') return null;
  const id = String(value.id || '').trim().toLowerCase();
  const name = String(value.name || '').trim().slice(0, 80);
  const description = String(value.description || '').trim().slice(0, 240);
  const mode = TEMPLATE_MODES.has(value.mode) ? value.mode : null;
  const renderer = TEMPLATE_RENDERERS.has(value.renderer) ? value.renderer : null;
  const version = Number.isInteger(value.version) && value.version > 0 && value.version <= 100 ? value.version : null;
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(id) || !name || !mode || !renderer || !version) return null;
  if ((mode === 'ats') !== (renderer === 'ats')) return null;
  const capabilities = [...new Set((Array.isArray(value.capabilities) ? value.capabilities : [])
    .filter((capability) => TEMPLATE_CAPABILITIES.includes(capability)))];
  const defaultAccent = sanitizeAccent(value.defaultAccent, mode === 'ats' ? '#111111' : '#6d28d9');
  return Object.freeze({ id, version, name, description, mode, renderer, capabilities: Object.freeze(capabilities), defaultAccent });
}

export function createTemplateCatalog(definitions = []) {
  const catalog = new Map(BUILT_IN_CATALOG);
  for (const candidate of Array.isArray(definitions) ? definitions : []) {
    const definition = normalizeTemplateDefinition(candidate);
    if (!definition || catalog.has(definition.id)) continue;
    catalog.set(definition.id, definition);
  }
  return catalog;
}

export function getTemplateDefinition(templateId, catalog = BUILT_IN_CATALOG) {
  return catalog.get(String(templateId || '').trim()) || null;
}

export function resolvePresentation(value, { mode = null, catalog = BUILT_IN_CATALOG } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const requestedMode = mode === 'ats' ? 'ats' : mode === 'visual' ? 'visual' : null;
  const requestedId = String(source.templateId || '').trim();
  const requestedDefinition = getTemplateDefinition(requestedId, catalog);
  const versionCompatible = requestedDefinition
    && (!Number.isFinite(Number(source.templateVersion)) || Number(source.templateVersion) <= requestedDefinition.version);
  const modeCompatible = requestedDefinition && (!requestedMode || requestedDefinition.mode === requestedMode);

  let fallbackReason = null;
  let definition = requestedDefinition;
  if (!definition) fallbackReason = requestedId ? 'unknown-template' : 'missing-template';
  else if (!versionCompatible) fallbackReason = 'newer-template-version';
  else if (!modeCompatible) fallbackReason = 'mode-mismatch';

  if (fallbackReason) {
    const fallbackId = requestedMode === 'ats' ? 'ats-basic' : 'visual-classic';
    definition = getTemplateDefinition(fallbackId, catalog) || BUILT_IN_CATALOG.get(fallbackId);
  }

  const visualCandidate = getTemplateDefinition(source.visualTemplateId, catalog);
  const visualTemplateId = visualCandidate?.mode === 'visual' ? visualCandidate.id : definition.mode === 'visual' ? definition.id : 'visual-classic';
  const accent = sanitizeAccent(source.accent, definition.defaultAccent);
  const font = Object.hasOwn(FONT_OPTIONS, source.font) ? source.font : DEFAULT_PRESENTATION.font;
  const density = Object.hasOwn(DENSITY_OPTIONS, source.density) ? source.density : DEFAULT_PRESENTATION.density;
  const spacing = Object.hasOwn(SPACING_OPTIONS, source.spacing) ? source.spacing : DEFAULT_PRESENTATION.spacing;

  return {
    presentation: {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      templateId: definition.id,
      templateVersion: definition.version,
      visualTemplateId,
      accent,
      font,
      density,
      spacing,
    },
    definition,
    fallbackUsed: Boolean(fallbackReason),
    fallbackReason,
  };
}

export function normalizePresentation(value, options = {}) {
  return resolvePresentation(value, options).presentation;
}

export function presentationMode(value, options = {}) {
  return resolvePresentation(value, options).definition.mode;
}

export function withPresentationTemplate(value, requestedTemplate, { catalog = BUILT_IN_CATALOG } = {}) {
  const current = normalizePresentation(value, { catalog });
  const requested = String(requestedTemplate || '').trim();
  if (requested === 'ats') {
    return normalizePresentation({ ...current, templateId: 'ats-basic', visualTemplateId: current.visualTemplateId }, { mode: 'ats', catalog });
  }
  if (requested === 'visual') {
    return normalizePresentation({ ...current, templateId: current.visualTemplateId || 'visual-classic' }, { mode: 'visual', catalog });
  }
  const definition = getTemplateDefinition(requested, catalog);
  if (!definition) return normalizePresentation(current, { catalog });
  return normalizePresentation({
    ...current,
    templateId: definition.id,
    visualTemplateId: definition.mode === 'visual' ? definition.id : current.visualTemplateId,
    accent: current.accent || definition.defaultAccent,
  }, { mode: definition.mode, catalog });
}

export function sanitizePresentationForStorage(value, options = {}) {
  return normalizePresentation(value, options);
}

export function contrastRatio(foreground, background = '#ffffff') {
  const left = relativeLuminance(foreground);
  const right = relativeLuminance(background);
  if (left === null || right === null) return 1;
  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function validateAccentContrast(value, { background = '#ffffff', minimum = 4.5 } = {}) {
  const presentation = normalizePresentation(value);
  const ratio = contrastRatio(presentation.accent, background);
  return { ratio, minimum, passes: ratio >= minimum, accent: presentation.accent, background };
}

export function renderResumeDocument({ draft, user = {}, presentation, editable = true, labels = {}, logoUrl = '' }) {
  const resolved = resolvePresentation(presentation);
  const model = normalizeResumeModel(draft, user);
  const copy = {
    visualLabel: labels.visualLabel || 'Visual resume',
    atsLabel: labels.atsLabel || 'ATS resume',
    avatarAlt: labels.avatarAlt || `${model.name} avatar`,
    about: labels.about || 'About',
    projects: labels.projects || 'Projects',
    skills: labels.skills || 'Skills',
  };
  const context = { model, presentation: resolved.presentation, definition: resolved.definition, editable, labels: copy, logoUrl: sanitizeImageUrl(logoUrl) };
  const renderer = RENDERERS[resolved.definition.renderer] || RENDERERS.classic;
  return renderer(context);
}

export function resumeClassName(presentation) {
  const { presentation: normalized, definition } = resolvePresentation(presentation);
  return [
    'resume-paper',
    definition.mode === 'ats' ? 'resume-ats' : 'resume-visual',
    `template-${definition.id}`,
    `font-${normalized.font}`,
    `density-${normalized.density}`,
    `spacing-${normalized.spacing}`,
  ].join(' ');
}

export function resumeStyleAttribute(presentation) {
  const normalized = normalizePresentation(presentation);
  const font = FONT_OPTIONS[normalized.font];
  const density = DENSITY_OPTIONS[normalized.density];
  const spacing = SPACING_OPTIONS[normalized.spacing];
  return [
    `--resume-accent:${normalized.accent}`,
    `--resume-font:${font.stack}`,
    `--resume-pad:${density.padding}px`,
    `--resume-body-size:${density.bodySize}px`,
    `--resume-section-gap:${spacing.gap}px`,
  ].join(';');
}

export function ensureTemplateStyles(documentRef = globalThis.document) {
  if (!documentRef?.head || documentRef.querySelector('#autoResumeTemplateStyles')) return;
  const style = documentRef.createElement('style');
  style.id = 'autoResumeTemplateStyles';
  style.textContent = TEMPLATE_STYLES;
  documentRef.head.append(style);
}

export const TEMPLATE_STYLES = `
.resume-paper[data-template-version]{font-family:var(--resume-font);font-size:var(--resume-body-size);padding:var(--resume-pad);--resume-accent:#6d28d9;--resume-section-gap:24px}
.resume-paper[data-template-version] section{margin-top:var(--resume-section-gap)}
.resume-paper[data-template-version] .resume-label,.resume-paper[data-template-version] h3,.resume-paper[data-template-version] .resume-project a{color:var(--resume-accent)}
.resume-paper[data-template-version] .resume-project{border-left-color:var(--resume-accent)}
.resume-paper[data-template-version] [contenteditable="true"]:focus{outline-color:var(--resume-accent)}
.resume-paper[data-template-version] .resume-brand-image{width:84px;height:84px;border-radius:18px;object-fit:contain;background:#fff}
.resume-paper.template-visual-classic{background:#fff;color:#111827}
.resume-paper.template-visual-studio{padding:0;overflow:hidden;background:#fff;color:#172033}
.resume-paper.template-visual-studio .resume-header{padding:var(--resume-pad);border-bottom:0;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;position:relative}
.resume-paper.template-visual-studio .resume-header::after{content:"";position:absolute;left:var(--resume-pad);right:var(--resume-pad);bottom:0;height:5px;background:var(--resume-accent);border-radius:999px 999px 0 0}
.resume-paper.template-visual-studio .resume-label,.resume-paper.template-visual-studio .resume-headline{color:#cbd5e1}
.resume-paper.template-visual-studio .resume-body{padding:0 var(--resume-pad) var(--resume-pad)}
.resume-paper.template-visual-studio .resume-contact{border-bottom:1px solid #e2e8f0;padding:20px 0}
.resume-paper.template-visual-studio .resume-project{border-left-width:5px;background:#f8fafc;padding:14px 16px;margin:14px 0;border-radius:0 12px 12px 0}
.resume-paper.template-visual-minimal{background:#fff;color:#0f172a;border-radius:4px;box-shadow:0 18px 70px rgba(15,23,42,.16)}
.resume-paper.template-visual-minimal .resume-header{border-bottom:1px solid #0f172a;align-items:flex-end}
.resume-paper.template-visual-minimal .resume-header h2{font-weight:500;letter-spacing:-.025em}
.resume-paper.template-visual-minimal .resume-label,.resume-paper.template-visual-minimal h3{letter-spacing:.2em;color:#334155}
.resume-paper.template-visual-minimal .resume-project{border-left:0;border-top:1px solid #cbd5e1;padding:14px 0 0;margin-top:18px}
.resume-paper.template-visual-minimal .resume-project a{color:#334155}
.resume-paper.template-visual-minimal .resume-brand-image{border-radius:50%;filter:grayscale(1)}
.resume-paper.template-ats-basic{font-family:var(--resume-font);padding:var(--resume-pad);border-radius:0;box-shadow:none;color:#111;background:#fff}
.resume-paper.template-ats-basic .resume-header{display:block;border-bottom:1px solid #111}
.resume-paper.template-ats-basic .resume-label,.resume-paper.template-ats-basic h3,.resume-paper.template-ats-basic .resume-project a{color:#111}
.resume-paper.template-ats-basic h3{border-bottom:1px solid #bbb;padding-bottom:5px}
.resume-paper.template-ats-basic .resume-project{border-left:0;padding-left:0}
.resume-paper.template-ats-basic .resume-skills{display:block}
.presentation-controls{display:grid;gap:12px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.presentation-controls__grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.presentation-control{display:grid;gap:5px;color:var(--muted);font-size:.72rem;font-weight:700}
.presentation-control select,.presentation-control input[type="color"]{width:100%;min-width:0;border:1px solid var(--line);background:var(--panel-2);color:var(--text);border-radius:10px;padding:9px;font:600 .76rem Inter}
.presentation-control input[type="color"]{height:39px;padding:4px;cursor:pointer}
.presentation-control--wide{grid-column:1/-1}
.presentation-logo-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.presentation-logo-actions .btn{padding:9px 11px;font-size:.72rem}
.presentation-warning{margin:0;color:#ffd59a;font-size:.72rem;line-height:1.45}
.presentation-warning[data-valid="true"]{color:#9af0d1}
.presentation-controls[aria-disabled="true"] .presentation-visual-only{opacity:.45}
.presentation-controls[aria-disabled="true"] .presentation-visual-only :is(select,input,button){pointer-events:none}
@media(max-width:520px){.presentation-controls__grid{grid-template-columns:1fr}.presentation-control--wide{grid-column:auto}}
`;

const RENDERERS = {
  classic: renderClassic,
  studio: renderStudio,
  minimal: renderMinimal,
  ats: renderAts,
};

function renderClassic(context) {
  return `${renderHeader(context, { includeImage: true })}<div class="resume-body">${renderBody(context, { includeChart: true })}</div>`;
}

function renderStudio(context) {
  return `${renderHeader(context, { includeImage: true })}<div class="resume-body">${renderBody(context, { includeChart: true })}</div>`;
}

function renderMinimal(context) {
  return `${renderHeader(context, { includeImage: true })}<div class="resume-body">${renderBody(context, { includeChart: true })}</div>`;
}

function renderAts(context) {
  return `${renderHeader(context, { includeImage: false })}<div class="resume-body">${renderBody(context, { includeChart: false })}</div>`;
}

function renderHeader(context, { includeImage }) {
  const { model, editable, labels, logoUrl } = context;
  const editName = editableAttribute(editable, 'data-draft-field="name"');
  const editHeadline = editableAttribute(editable, 'data-draft-field="headline"');
  const imageUrl = logoUrl || sanitizeImageUrl(model.user.avatar_url);
  const customLogo = Boolean(logoUrl);
  const image = includeImage && imageUrl
    ? `<img class="resume-brand-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(customLogo ? `${model.name} logo` : labels.avatarAlt)}" crossorigin="anonymous"${customLogo ? ' data-custom-logo="true"' : ''}>`
    : '';
  const label = context.definition.mode === 'ats' ? labels.atsLabel : labels.visualLabel;
  return `<header class="resume-header"><div><p class="resume-label">${escapeHtml(label)}</p><h2 ${editName}>${escapeHtml(model.name)}</h2><p class="resume-headline" ${editHeadline}>${escapeHtml(model.headline)}</p></div>${image}</header>`;
}

function renderBody(context, { includeChart }) {
  const { model, editable, labels } = context;
  const editContact = editableAttribute(editable, 'data-draft-field="contact"');
  const editAbout = editableAttribute(editable, 'data-draft-field="about"');
  const projects = model.projects.map((project, index) => {
    const editName = editableAttribute(editable, `data-project-field="name"`);
    const editDescription = editableAttribute(editable, `data-project-field="description"`);
    const url = safeExternalUrl(project.url);
    return `<article class="resume-project" data-project-index="${index}"><h4 ${editName}>${escapeHtml(project.name)}</h4><p ${editDescription}>${escapeHtml(project.description)}</p>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>` : ''}</article>`;
  }).join('');
  const skills = model.skills.map((skill, index) => {
    const editName = editableAttribute(editable, 'data-skill-field="name"');
    return `<div class="skill-item" data-skill-index="${index}"><span ${editName}>${escapeHtml(skill.name)}</span>${Number.isFinite(skill.percent) ? `<strong>${skill.percent}%</strong>` : ''}</div>`;
  }).join('');
  return `<div class="resume-contact" ${editContact}>${escapeHtml(model.contact)}</div><section><h3>${escapeHtml(labels.about)}</h3><p ${editAbout}>${escapeHtml(model.about)}</p></section><section><h3>${escapeHtml(labels.projects)}</h3><div class="resume-projects">${projects}</div></section><section class="resume-skills"><div><h3>${escapeHtml(labels.skills)}</h3><div class="skill-legend">${skills}</div></div>${includeChart ? '<div class="donut-wrap"><canvas id="skillsChart"></canvas></div>' : ''}</section>`;
}

function normalizeResumeModel(draft, user) {
  const source = draft && typeof draft === 'object' ? draft : {};
  return {
    name: String(source.name || user?.name || user?.login || 'Developer'),
    headline: String(source.headline || ''),
    contact: String(source.contact || ''),
    about: String(source.about || ''),
    projects: (Array.isArray(source.projects) ? source.projects : []).slice(0, 12).map((project) => ({
      name: String(project?.name || ''),
      description: String(project?.description || ''),
      url: String(project?.url || ''),
    })),
    skills: (Array.isArray(source.skills) ? source.skills : []).slice(0, 16).map((skill) => ({
      name: String(typeof skill === 'object' ? skill?.name || '' : skill || ''),
      percent: typeof skill === 'object' && Number.isFinite(Number(skill?.percent)) ? Math.max(0, Math.min(100, Number(skill.percent))) : null,
      value: typeof skill === 'object' && Number.isFinite(Number(skill?.value)) ? Number(skill.value) : null,
    })),
    user: user && typeof user === 'object' ? user : {},
  };
}

function sanitizeAccent(value, fallback) {
  const color = String(value || '').trim();
  return HEX_COLOR_RE.test(color) ? color.toLowerCase() : fallback;
}

function editableAttribute(editable, dataAttribute) {
  return editable ? `${dataAttribute} contenteditable="true" spellcheck="true"` : dataAttribute;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('blob:')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function relativeLuminance(value) {
  const color = String(value || '').trim();
  if (!HEX_COLOR_RE.test(color)) return null;
  const channels = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}
