import { $, els, state } from './config.js';
import { selectedRepos } from './projects.js';
import { buildResumeText, safeFilename } from './resume-text.mjs';
import { buildSharePayload, encodeSharePayload } from './share.mjs';
import { downloadBlob, escapeHtml, languageStats, toast } from './utils.js';

const COLORS = ['#7c5cff', '#29d3a2', '#4da3ff', '#ffb84d', '#ff6b7a', '#ad7cff', '#59d6ff', '#87e36b'];

export function generateResume() {
  const user = state.user;
  const skills = languageStats().slice(0, 8);
  const projects = selectedRepos();
  const analysis = state.vacancyAnalysis;
  const topLanguages = skills.slice(0, 3).map((item) => item.name);
  const headline = analysis?.headline || `${topLanguages.join(' / ') || 'Software'} Developer`;
  const contactParts = [
    user.location,
    `github.com/${user.login}`,
    `${Number(user.followers || 0)} подписчиков`,
    `${state.contributions.commits} публичных коммитов за год`,
  ].filter(Boolean);

  state.resumeDraft = {
    name: user.name || user.login,
    headline,
    contact: contactParts.join(' · '),
    about: buildAbout(analysis),
    projects: projects.map((repo) => ({
      id: repo.full_name || repo.name,
      name: repo.name,
      url: repo.html_url,
      description: buildProjectDescription(repo),
    })),
    skills,
  };

  renderResume();
  els.resumeSection.classList.remove('hidden');
  setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 80);
}

export function renderSharedResume(payload) {
  state.sharedMode = true;
  state.user = payload.user || {};
  state.resumeDraft = payload.draft;
  state.resumeTemplate = payload.template || 'ats';
  document.body.classList.add('shared-view');
  els.dashboard.classList.remove('hidden');
  [...els.dashboard.children].forEach((child) => {
    if (child !== els.resumeSection) child.classList.add('hidden');
  });
  els.resumeSection.classList.remove('hidden');
  els.sharedBanner.classList.remove('hidden');
  renderResume({ editable: false });
}

export function setTemplate(template) {
  state.resumeTemplate = template === 'ats' ? 'ats' : 'visual';
  renderResume({ editable: !state.sharedMode });
}

export function renderResume({ editable = true } = {}) {
  const draft = state.resumeDraft;
  if (!draft) return;
  const isAts = state.resumeTemplate === 'ats';
  els.resume.className = `resume-paper ${isAts ? 'resume-ats' : 'resume-visual'}`;
  els.resume.dataset.template = state.resumeTemplate;
  const edit = editable ? 'contenteditable="true" spellcheck="true"' : '';
  const user = state.user || {};

  els.resume.innerHTML = `
    <header class="resume-header">
      <div>
        <p class="resume-label">${isAts ? 'Professional Resume' : 'GitHub Resume'}</p>
        <h2 data-draft-field="name" ${edit}>${escapeHtml(draft.name)}</h2>
        <p class="resume-headline" data-draft-field="headline" ${edit}>${escapeHtml(draft.headline)}</p>
      </div>
      ${!isAts && user.avatar_url ? `<img src="${escapeHtml(user.avatar_url)}" alt="Аватар ${escapeHtml(draft.name)}" crossorigin="anonymous">` : ''}
    </header>
    <div class="resume-contact" data-draft-field="contact" ${edit}>${escapeHtml(draft.contact)}</div>
    <section>
      <h3>О себе</h3>
      <p data-draft-field="about" ${edit}>${escapeHtml(draft.about)}</p>
    </section>
    <section>
      <h3>Проекты</h3>
      <div class="resume-projects">${draft.projects.map((project, index) => `
        <article class="resume-project" data-project-index="${index}">
          <h4 data-project-field="name" ${edit}>${escapeHtml(project.name)}</h4>
          <p data-project-field="description" ${edit}>${escapeHtml(project.description)}</p>
          ${project.url ? `<a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(project.url)}</a>` : ''}
        </article>`).join('')}</div>
    </section>
    <section class="resume-skills">
      <div>
        <h3>Навыки</h3>
        <div class="skill-legend">${draft.skills.map((skill, index) => `
          <div class="skill-item" data-skill-index="${index}">
            <span data-skill-field="name" ${edit}>${escapeHtml(skill.name || skill)}</span>
            ${typeof skill === 'object' && Number.isFinite(skill.percent) ? `<strong>${skill.percent}%</strong>` : ''}
          </div>`).join('')}</div>
      </div>
      ${!isAts ? '<div class="donut-wrap"><canvas id="skillsChart"></canvas></div>' : ''}
    </section>`;

  document.querySelectorAll('[data-template-button]').forEach((button) => {
    button.classList.toggle('active', button.dataset.templateButton === state.resumeTemplate);
  });
  $('#visualPdfBtn').classList.toggle('hidden', isAts);
  $('#atsPdfBtn').classList.toggle('hidden', !isAts);
  if (editable) bindEditing();
  if (!isAts) renderSkillsChart();
}

function bindEditing() {
  els.resume.querySelectorAll('[data-draft-field]').forEach((element) => {
    element.addEventListener('input', () => {
      state.resumeDraft[element.dataset.draftField] = element.textContent.trim();
    });
  });
  els.resume.querySelectorAll('[data-project-index]').forEach((element) => {
    const index = Number(element.dataset.projectIndex);
    element.querySelectorAll('[data-project-field]').forEach((field) => {
      field.addEventListener('input', () => {
        state.resumeDraft.projects[index][field.dataset.projectField] = field.textContent.trim();
      });
    });
  });
  els.resume.querySelectorAll('[data-skill-index]').forEach((element) => {
    const index = Number(element.dataset.skillIndex);
    const field = element.querySelector('[data-skill-field="name"]');
    field?.addEventListener('input', () => {
      if (typeof state.resumeDraft.skills[index] === 'string') state.resumeDraft.skills[index] = field.textContent.trim();
      else state.resumeDraft.skills[index].name = field.textContent.trim();
    });
  });
}

function buildAbout(analysis) {
  const user = state.user;
  const languages = languageStats().slice(0, 3).map((item) => item.name).join(', ');
  const commits = state.contributions.commits;
  const activity = commits > 250 ? 'высокую' : commits > 80 ? 'стабильную' : 'развивающуюся';
  const vacancyPart = analysis?.matched?.length
    ? ` Для целевой позиции подтверждены навыки: ${analysis.matched.slice(0, 7).join(', ')}.`
    : '';
  return `${user.bio ? `${user.bio} ` : ''}Разработчик с публичным портфолио из ${state.repos.length} проектов. Основной технологический фокус: ${languages || 'разработка программного обеспечения'}. За последние 12 месяцев проявил ${activity} активность — ${commits} публичных коммитов и ${state.contributions.total} вкладов.${vacancyPart}`;
}

function buildProjectDescription(repo) {
  const stack = Object.keys(repo.languages || {}).slice(0, 4).join(', ') || repo.language || 'не указан';
  return `${repo.description || `Проект на ${repo.language || 'современном технологическом стеке'}.`} Стек: ${stack}. ${repo.stargazers_count || 0} ★, ${repo.forks_count || 0} форков.`;
}

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

export async function copyResume() {
  await navigator.clipboard.writeText(buildResumeText(state.resumeDraft));
  toast($('#copyBtn'), 'Скопировано ✓');
}

export function downloadText() {
  const filename = `${safeFilename(state.user?.login || state.resumeDraft.name)}-resume.txt`;
  downloadBlob(`\uFEFF${buildResumeText(state.resumeDraft)}`, filename);
}

export async function downloadVisualPdf() {
  const button = $('#visualPdfBtn');
  button.disabled = true;
  button.textContent = 'Создаём PDF…';
  try {
    const canvas = await html2canvas(els.resume, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const image = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 198;
    const imageHeight = canvas.height * pageWidth / canvas.width;
    let heightLeft = imageHeight;
    let position = 6;
    pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight);
    heightLeft -= 285;
    while (heightLeft > 0) {
      position = heightLeft - imageHeight + 6;
      pdf.addPage();
      pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight);
      heightLeft -= 285;
    }
    pdf.save(`${safeFilename(state.user?.login || state.resumeDraft.name)}-visual-resume.pdf`);
  } finally {
    button.disabled = false;
    button.textContent = 'Визуальный PDF';
  }
}

export function printAtsPdf() {
  const previous = state.resumeTemplate;
  if (previous !== 'ats') setTemplate('ats');
  document.body.classList.add('printing-resume');
  setTimeout(() => {
    window.print();
    document.body.classList.remove('printing-resume');
    if (previous !== 'ats') setTemplate(previous);
  }, 60);
}

export async function copyShareLink() {
  const payload = buildSharePayload(state);
  const encoded = encodeSharePayload(payload);
  const url = new URL(window.location.href);
  url.hash = `resume=${encoded}`;
  await navigator.clipboard.writeText(url.toString());
  toast($('#shareBtn'), 'Ссылка скопирована ✓');
}
