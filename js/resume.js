import { $, els, state } from './config.js';
import { selectedRepos } from './projects.js';
import { buildResumeText, safeFilename } from './resume-text.mjs';
import { buildResumeDocx, buildResumeMarkdown, DOCX_MIME } from './docx-export.mjs';
import { buildSharePayload, encodeSharePayload } from './share.mjs';
import { formatNumber, setLocale, t } from './i18n.mjs';
import {
  BUILT_IN_TEMPLATES,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  SPACING_OPTIONS,
  ensureTemplateStyles,
  normalizePresentation,
  presentationMode,
  renderResumeDocument,
  resolvePresentation,
  resumeClassName,
  resumeStyleAttribute,
  validateAccentContrast,
  withPresentationTemplate,
} from './template-system.mjs';
import { downloadBlob, languageStats, toast } from './utils.js';

const COLORS = ['#7c5cff', '#29d3a2', '#4da3ff', '#ffb84d', '#ff6b7a', '#ad7cff', '#59d6ff', '#87e36b'];
const MAX_LOGO_BYTES = 2_000_000;
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
let localLogoUrl = '';
let localLogoName = '';
let localLogoError = '';

export function generateResume() {
  const user = state.user; const skills = languageStats().slice(0, 8); const projects = selectedRepos(); const analysis = state.vacancyAnalysis;
  const topLanguages = skills.slice(0, 3).map((item) => item.name); const headlineSource = analysis?.matched?.length ? analysis.matched : analysis?.requirements?.length ? analysis.requirements : topLanguages;
  const headline = `${headlineSource.slice(0, 3).join(' / ') || t('resume.software')} ${t('resume.developer')}`;
  const contactParts = [user.location, `github.com/${user.login}`, t('resume.followers', { count: formatNumber(user.followers) }), t('resume.publicCommits', { count: formatNumber(state.contributions.commits) })].filter(Boolean);
  state.resumeTemplate = 'visual';
  state.resumeDraft = {
    locale: state.locale,
    name: user.name || user.login,
    headline,
    contact: contactParts.join(' · '),
    about: buildAbout(analysis),
    projects: projects.map((repo) => ({ id: repo.full_name || repo.name, name: repo.name, url: repo.html_url, description: buildProjectDescription(repo) })),
    skills,
    presentation: normalizePresentation(null, { mode: 'visual' }),
  };
  clearLocalLogo();
  renderResume(); els.resumeSection.classList.remove('hidden'); setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 80);
}

export function renderSharedResume(payload) {
  state.sharedMode = true;
  state.locale = setLocale(payload.locale || payload.draft?.locale || 'ru');
  state.user = payload.user || {};
  state.resumeDraft = payload.draft && typeof payload.draft === 'object' ? payload.draft : {};
  state.resumeDraft.locale = state.locale;
  const legacyMode = payload.template === 'ats' ? 'ats' : 'visual';
  const resolved = resolvePresentation(payload.presentation || state.resumeDraft.presentation, { mode: legacyMode });
  state.resumeDraft.presentation = resolved.presentation;
  state.resumeTemplate = resolved.definition.mode;
  clearLocalLogo();
  if (els.localeSelect) els.localeSelect.value = state.locale;
  document.body.classList.add('shared-view');
  els.dashboard.classList.remove('hidden');
  [...els.dashboard.children].forEach((child) => { if (child !== els.resumeSection) child.classList.add('hidden'); });
  els.resumeSection.classList.remove('hidden');
  els.sharedBanner.classList.remove('hidden');
  renderResume({ editable: false });
}

export function setTemplate(template) {
  if (!state.resumeDraft) return;
  state.resumeDraft.presentation = withPresentationTemplate(state.resumeDraft.presentation, template);
  state.resumeTemplate = presentationMode(state.resumeDraft.presentation);
  renderResume({ editable: !state.sharedMode });
  notifyDraftChanged();
}

export function renderResume({ editable = true } = {}) {
  const draft = state.resumeDraft;
  if (!draft) return;
  ensureTemplateStyles();
  draft.locale = state.locale;
  const resolved = resolvePresentation(draft.presentation, { mode: state.resumeTemplate });
  draft.presentation = resolved.presentation;
  state.resumeTemplate = resolved.definition.mode;
  const isAts = state.resumeTemplate === 'ats';
  els.resume.className = resumeClassName(draft.presentation);
  els.resume.dataset.template = draft.presentation.templateId;
  els.resume.dataset.templateVersion = String(draft.presentation.templateVersion);
  els.resume.style.cssText = resumeStyleAttribute(draft.presentation);
  els.resume.innerHTML = renderResumeDocument({
    draft,
    user: state.user || {},
    presentation: draft.presentation,
    editable,
    logoUrl: isAts ? '' : localLogoUrl,
    labels: {
      visualLabel: t('resume.visualLabel'),
      atsLabel: t('resume.atsLabel'),
      avatarAlt: t('resume.avatarAlt', { name: draft.name }),
      about: t('resume.about'),
      projects: t('resume.projects'),
      skills: t('resume.skills'),
    },
  });
  document.querySelectorAll('[data-template-button]').forEach((button) => button.classList.toggle('active', button.dataset.templateButton === state.resumeTemplate));
  $('#visualPdfBtn').classList.toggle('hidden', isAts);
  $('#atsPdfBtn').classList.toggle('hidden', !isAts);
  ensurePresentationControls({ editable });
  syncPresentationControls();
  if (editable) bindEditing();
  if (!isAts) renderSkillsChart();
}

function bindEditing() {
  els.resume.querySelectorAll('[data-draft-field]').forEach((element) => element.addEventListener('input', () => { state.resumeDraft[element.dataset.draftField] = element.textContent.trim(); }));
  els.resume.querySelectorAll('[data-project-index]').forEach((element) => { const index = Number(element.dataset.projectIndex); element.querySelectorAll('[data-project-field]').forEach((field) => field.addEventListener('input', () => { state.resumeDraft.projects[index][field.dataset.projectField] = field.textContent.trim(); })); });
  els.resume.querySelectorAll('[data-skill-index]').forEach((element) => { const index = Number(element.dataset.skillIndex); const field = element.querySelector('[data-skill-field="name"]'); field?.addEventListener('input', () => { if (typeof state.resumeDraft.skills[index] === 'string') state.resumeDraft.skills[index] = field.textContent.trim(); else state.resumeDraft.skills[index].name = field.textContent.trim(); }); });
}

function ensurePresentationControls({ editable }) {
  const actions = document.querySelector('.resume-actions');
  if (!actions) return;
  let panel = actions.querySelector('#presentationControls');
  if (!editable || state.sharedMode) {
    panel?.classList.add('hidden');
    return;
  }
  const locale = state.locale === 'en' ? 'en' : 'ru';
  if (panel?.dataset.locale === locale) {
    panel.classList.remove('hidden');
    return;
  }
  panel?.remove();
  panel = document.createElement('section');
  panel.id = 'presentationControls';
  panel.className = 'presentation-controls';
  panel.dataset.locale = locale;
  const copy = presentationCopy(locale);
  const visualTemplates = BUILT_IN_TEMPLATES.filter((template) => template.mode === 'visual');
  panel.innerHTML = `
    <strong>${copy.title}</strong>
    <div class="presentation-controls__grid">
      <label class="presentation-control presentation-control--wide presentation-visual-only">${copy.layout}
        <select data-presentation-control="template">${visualTemplates.map((template) => `<option value="${template.id}">${template.name}</option>`).join('')}</select>
      </label>
      <label class="presentation-control">${copy.font}
        <select data-presentation-control="font">${Object.values(FONT_OPTIONS).map((option) => `<option value="${option.id}">${option.label}</option>`).join('')}</select>
      </label>
      <label class="presentation-control">${copy.density}
        <select data-presentation-control="density">${Object.values(DENSITY_OPTIONS).map((option) => `<option value="${option.id}">${copy.option(option.id, option.label)}</option>`).join('')}</select>
      </label>
      <label class="presentation-control">${copy.spacing}
        <select data-presentation-control="spacing">${Object.values(SPACING_OPTIONS).map((option) => `<option value="${option.id}">${copy.option(option.id, option.label)}</option>`).join('')}</select>
      </label>
      <label class="presentation-control presentation-visual-only">${copy.accent}
        <input data-presentation-control="accent" type="color" value="#6d28d9">
      </label>
      <div class="presentation-control presentation-control--wide presentation-visual-only">
        <span>${copy.logo}</span>
        <div class="presentation-logo-actions">
          <label class="btn btn-secondary" for="presentationLogoInput">${copy.chooseLogo}</label>
          <input id="presentationLogoInput" class="sr-only" data-presentation-control="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">
          <button class="btn btn-secondary" type="button" data-presentation-action="remove-logo">${copy.removeLogo}</button>
        </div>
        <small data-presentation-logo-status>${copy.logoLocal}</small>
      </div>
    </div>
    <p class="presentation-warning" data-presentation-contrast role="status"></p>`;
  const switcher = actions.querySelector('.template-switch');
  switcher?.insertAdjacentElement('afterend', panel);
  bindPresentationControls(panel);
}

function bindPresentationControls(panel) {
  panel.addEventListener('change', async (event) => {
    const control = event.target.closest('[data-presentation-control]');
    if (!control || !state.resumeDraft) return;
    const key = control.dataset.presentationControl;
    if (key === 'logo') {
      const file = control.files?.[0];
      if (file) setLocalLogo(file);
      control.value = '';
      renderResume();
      return;
    }
    if (key === 'template') {
      applyPresentationPatch({ templateId: control.value, visualTemplateId: control.value }, { mode: 'visual' });
      return;
    }
    if (key === 'font' || key === 'density' || key === 'spacing' || key === 'accent') {
      applyPresentationPatch({ [key]: control.value });
    }
  });
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-presentation-action="remove-logo"]');
    if (!button) return;
    clearLocalLogo();
    renderResume();
  });
}

function applyPresentationPatch(patch, { mode = state.resumeTemplate } = {}) {
  state.resumeDraft.presentation = normalizePresentation({ ...state.resumeDraft.presentation, ...patch }, { mode });
  state.resumeTemplate = presentationMode(state.resumeDraft.presentation);
  renderResume();
  notifyDraftChanged();
}

function syncPresentationControls() {
  const panel = document.querySelector('#presentationControls');
  if (!panel || !state.resumeDraft) return;
  if (state.sharedMode) { panel.classList.add('hidden'); return; }
  const presentation = normalizePresentation(state.resumeDraft.presentation, { mode: state.resumeTemplate });
  const isAts = state.resumeTemplate === 'ats';
  panel.classList.remove('hidden');
  panel.setAttribute('aria-disabled', String(isAts));
  const values = {
    template: presentation.visualTemplateId,
    font: presentation.font,
    density: presentation.density,
    spacing: presentation.spacing,
    accent: presentation.accent,
  };
  Object.entries(values).forEach(([key, value]) => {
    const control = panel.querySelector(`[data-presentation-control="${key}"]`);
    if (control) control.value = value;
  });
  const copy = presentationCopy(state.locale === 'en' ? 'en' : 'ru');
  const contrast = validateAccentContrast(presentation);
  const warning = panel.querySelector('[data-presentation-contrast]');
  warning.dataset.valid = String(contrast.passes);
  warning.textContent = isAts
    ? copy.atsSafe
    : contrast.passes
      ? copy.contrastPass(contrast.ratio)
      : copy.contrastFail(contrast.ratio);
  const logoStatus = panel.querySelector('[data-presentation-logo-status]');
  logoStatus.textContent = localLogoError || (localLogoName ? copy.logoSelected(localLogoName) : copy.logoLocal);
  panel.querySelectorAll('.presentation-visual-only select, .presentation-visual-only input, .presentation-visual-only button').forEach((control) => { control.disabled = isAts; });
  panel.querySelector('[data-presentation-action="remove-logo"]')?.toggleAttribute('disabled', isAts || !localLogoUrl);
}

function setLocalLogo(file) {
  clearLocalLogo();
  if (!LOGO_TYPES.has(file.type)) {
    localLogoError = presentationCopy(state.locale === 'en' ? 'en' : 'ru').logoType;
    return;
  }
  if (file.size > MAX_LOGO_BYTES) {
    localLogoError = presentationCopy(state.locale === 'en' ? 'en' : 'ru').logoSize;
    return;
  }
  localLogoUrl = URL.createObjectURL(file);
  localLogoName = String(file.name || 'logo').slice(0, 80);
  localLogoError = '';
}

function clearLocalLogo() {
  if (localLogoUrl) URL.revokeObjectURL(localLogoUrl);
  localLogoUrl = '';
  localLogoName = '';
  localLogoError = '';
}

function notifyDraftChanged() {
  els.resume.dispatchEvent(new Event('input', { bubbles: true }));
}

function presentationCopy(locale) {
  const en = locale === 'en';
  const optionNames = en
    ? { compact: 'Compact', comfortable: 'Comfortable', spacious: 'Spacious', tight: 'Tight', normal: 'Normal', relaxed: 'Relaxed' }
    : { compact: 'Компактно', comfortable: 'Комфортно', spacious: 'Просторно', tight: 'Плотно', normal: 'Обычно', relaxed: 'Свободно' };
  return {
    title: en ? 'Presentation' : 'Оформление',
    layout: en ? 'Visual theme' : 'Визуальная тема',
    font: en ? 'Font' : 'Шрифт',
    density: en ? 'Density' : 'Плотность',
    spacing: en ? 'Section spacing' : 'Отступы секций',
    accent: en ? 'Accent color' : 'Акцентный цвет',
    logo: en ? 'Local logo' : 'Локальный логотип',
    chooseLogo: en ? 'Choose image' : 'Выбрать изображение',
    removeLogo: en ? 'Remove' : 'Удалить',
    logoLocal: en ? 'The logo exists only in this tab and is never added to drafts or public links.' : 'Логотип существует только в этой вкладке и не попадает в черновики или публичные ссылки.',
    logoType: en ? 'Use PNG, JPEG, WebP or SVG.' : 'Используйте PNG, JPEG, WebP или SVG.',
    logoSize: en ? 'The logo must be 2 MB or smaller.' : 'Размер логотипа должен быть не больше 2 МБ.',
    logoSelected: (name) => en ? `Local logo: ${name}` : `Локальный логотип: ${name}`,
    contrastPass: (ratio) => en ? `Accent contrast ${ratio}:1 passes WCAG AA for normal text.` : `Контраст акцента ${ratio}:1 соответствует WCAG AA для обычного текста.`,
    contrastFail: (ratio) => en ? `Accent contrast ${ratio}:1 is too low. Choose a darker color for readable text.` : `Контраст акцента ${ratio}:1 слишком низкий. Выберите более тёмный цвет для читаемого текста.`,
    atsSafe: en ? 'ATS mode ignores decorative accent and logo settings.' : 'ATS-режим игнорирует декоративный акцент и логотип.',
    option: (id, fallback) => optionNames[id] || fallback,
  };
}

function buildAbout(analysis) {
  const user = state.user; const languages = languageStats().slice(0, 3).map((item) => item.name).join(', '); const commits = state.contributions.commits;
  const activity = commits > 250 ? t('resume.activity.high') : commits > 80 ? t('resume.activity.stable') : t('resume.activity.growing');
  const vacancy = analysis?.matched?.length ? t('resume.vacancySkills', { skills: analysis.matched.slice(0, 7).join(', ') }) : '';
  return t('resume.aboutText', { bio: user.bio ? `${user.bio} ` : '', projects: formatNumber(state.repos.length), languages: languages || t('resume.softwareDevelopment'), activity, commits: formatNumber(commits), contributions: formatNumber(state.contributions.total), vacancy });
}

function buildProjectDescription(repo) { const stack = Object.keys(repo.languages || {}).slice(0, 4).join(', ') || repo.language || t('resume.stackUnknown'); const description = repo.description || t('resume.projectFallback', { language: repo.language || t('resume.modernStack') }); return t('resume.projectDescription', { description, stack, stars: formatNumber(repo.stargazers_count), forks: formatNumber(repo.forks_count) }); }

function renderSkillsChart() {
  const canvas = $('#skillsChart');
  if (!canvas) return;
  if (state.charts.skills) state.charts.skills.destroy();
  const skills = state.resumeDraft.skills.filter((item) => typeof item === 'object');
  state.charts.skills = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: skills.map((item) => item.name), datasets: [{ data: skills.map((item) => item.value || item.percent), backgroundColor: COLORS, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } },
  });
}

export async function copyResume() { await navigator.clipboard.writeText(buildResumeText(state.resumeDraft, state.locale)); toast($('#copyBtn'), t('export.copied')); }
export function downloadText() { const filename = `${safeFilename(state.user?.login || state.resumeDraft.name)}-resume-${state.locale}.txt`; downloadBlob(`\uFEFF${buildResumeText(state.resumeDraft, state.locale)}`, filename); }
export function downloadMarkdown() { const button = $('#markdownBtn'); const filename = `${safeFilename(state.user?.login || state.resumeDraft.name)}-resume-${state.locale}.md`; downloadBlob(`\uFEFF${buildResumeMarkdown(state.resumeDraft, state.locale)}`, filename, 'text/markdown;charset=utf-8'); toast(button, t('export.markdownSaved')); }
export function downloadDocx() { const button = $('#docxBtn'); button.disabled = true; button.textContent = t('export.creatingDocx'); try { const filename = `${safeFilename(state.user?.login || state.resumeDraft.name)}-resume-${state.locale}.docx`; const bytes = buildResumeDocx(state.resumeDraft, { locale: state.locale, title: `${state.resumeDraft.name} — ${state.resumeDraft.headline}` }); downloadBlob(bytes, filename, DOCX_MIME); } finally { button.disabled = false; button.textContent = t('editor.docx'); } toast(button, t('export.docxSaved')); }
export async function downloadVisualPdf() { const button = $('#visualPdfBtn'); button.disabled = true; button.textContent = t('export.creatingPdf'); try { const canvas = await html2canvas(els.resume, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }); const image = canvas.toDataURL('image/png'); const { jsPDF } = window.jspdf; const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }); const pageWidth = 198; const imageHeight = canvas.height * pageWidth / canvas.width; let heightLeft = imageHeight; let position = 6; pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight); heightLeft -= 285; while (heightLeft > 0) { position = heightLeft - imageHeight + 6; pdf.addPage(); pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight); heightLeft -= 285; } pdf.save(`${safeFilename(state.user?.login || state.resumeDraft.name)}-visual-resume-${state.locale}.pdf`); } finally { button.disabled = false; button.textContent = t('editor.visualPdf'); } }
export function printAtsPdf() {
  const previousPresentation = normalizePresentation(state.resumeDraft.presentation, { mode: state.resumeTemplate });
  const previousMode = state.resumeTemplate;
  if (previousMode !== 'ats') {
    state.resumeDraft.presentation = withPresentationTemplate(previousPresentation, 'ats');
    state.resumeTemplate = 'ats';
    renderResume();
  }
  document.body.classList.add('printing-resume');
  setTimeout(() => {
    window.print();
    document.body.classList.remove('printing-resume');
    if (previousMode !== 'ats') {
      state.resumeDraft.presentation = previousPresentation;
      state.resumeTemplate = previousMode;
      renderResume();
    }
  }, 60);
}
export async function copyShareLink() { const payload = buildSharePayload(state); const encoded = encodeSharePayload(payload); const url = new URL(window.location.href); url.hash = `resume=${encoded}`; await navigator.clipboard.writeText(url.toString()); toast($('#shareBtn'), t('export.linkCopied')); }
