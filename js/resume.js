import { $, els, state } from './config.js';
import { getSelectedProjects } from './projects.js';
import { buildResumeText, safeFilename } from './resume-text.mjs';
import { escapeHtml, languageStats, score, toast } from './utils.js';

export function generateResume() {
  const user = state.user;
  if (!user) return;

  const topLanguages = languageStats().slice(0, 3);
  const selectedProjects = getSelectedProjects();
  const projects = selectedProjects.length
    ? selectedProjects
    : [...state.repos].sort((a, b) => score(b) - score(a)).slice(0, 5);

  $('#resumeName').textContent = user.name || user.login;
  $('#resumeHeadline').textContent = `${topLanguages.map((item) => item.name).join(' / ') || 'Software'} Developer`;
  $('#resumeAvatar').src = user.avatar_url;
  $('#resumeContact').innerHTML = [
    user.location && `Локация: ${escapeHtml(user.location)}`,
    `GitHub: github.com/${escapeHtml(user.login)}`,
    `Подписчики: ${Number(user.followers || 0)}`,
    `Публичные коммиты за год: ${state.contributions.commits}`,
  ].filter(Boolean).map((item) => `<span>${item}</span>`).join('');

  $('#resumeAbout').textContent = buildAbout();
  $('#resumeProjects').innerHTML = projects.map((repo) => `
    <div class="resume-project" data-repo-key="${escapeHtml(repo.full_name || repo.name)}">
      <h4 data-editable="true">${escapeHtml(repo.name)}</h4>
      <a class="resume-project-link" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.html_url)}</a>
      <p data-editable="true">${escapeHtml(buildProjectDescription(repo))}</p>
    </div>
  `).join('');

  renderSkills();
  setResumeEditing(false);
  setResumeTemplate(els.templateSelect.value || state.resumeTemplate || 'visual');
  els.resumeSection.classList.remove('hidden');
  setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 80);
}

function buildProjectDescription(repo) {
  const base = repo.description || `Проект на ${repo.language || 'современном технологическом стеке'}.`;
  const stack = Object.keys(repo.languages || {}).slice(0, 4).join(', ') || repo.language || 'не указан';
  return `${base} Стек: ${stack}. ${Number(repo.stargazers_count || 0)} ★, ${Number(repo.forks_count || 0)} форков.`;
}

function buildAbout() {
  const user = state.user;
  const languages = languageStats().slice(0, 3).map((item) => item.name).join(', ');
  const commits = state.contributions.commits;
  const activity = commits > 250 ? 'высокую' : commits > 80 ? 'стабильную' : 'развивающуюся';

  return `${user.bio ? `${user.bio} ` : ''}Разработчик с публичным портфолио из ${state.repos.length} проектов. Основной технологический фокус: ${languages || 'разработка программного обеспечения'}. За последние 12 месяцев проявил ${activity} активность — ${commits} публичных коммитов и ${state.contributions.total} вкладов. Ориентирован на создание практичных решений, развитие качества кода и понятную презентацию проектов.`;
}

function renderSkills() {
  const stats = languageStats().slice(0, 8);
  $('#skillLegend').innerHTML = stats.map((item) => `
    <div class="skill-item" data-editable="true"><span>${escapeHtml(item.name)}</span><strong>${item.percent}%</strong></div>
  `).join('');

  if (state.charts.skills) state.charts.skills.destroy();
  state.charts.skills = new Chart($('#skillsChart'), {
    type: 'doughnut',
    data: {
      labels: stats.map((item) => item.name),
      datasets: [{
        data: stats.map((item) => item.value),
        backgroundColor: ['#7c5cff', '#29d3a2', '#4da3ff', '#ffb84d', '#ff6b7a', '#ad7cff', '#59d6ff', '#87e36b'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false } },
    },
  });
}

export function toggleResumeEditing() {
  setResumeEditing(!state.resumeEditing);
  if (state.resumeEditing) $('#resumeHeadline').focus();
}

function setResumeEditing(enabled) {
  state.resumeEditing = Boolean(enabled);
  const resume = $('#resume');
  resume.classList.toggle('is-editing', state.resumeEditing);
  resume.querySelectorAll('[data-editable="true"]').forEach((element) => {
    element.contentEditable = String(state.resumeEditing);
    element.spellcheck = state.resumeEditing;
  });
  els.editButton.textContent = state.resumeEditing ? 'Завершить редактирование' : 'Редактировать текст';
  els.editButton.setAttribute('aria-pressed', String(state.resumeEditing));
}

export function setResumeTemplate(template) {
  const nextTemplate = template === 'ats' ? 'ats' : 'visual';
  state.resumeTemplate = nextTemplate;
  els.templateSelect.value = nextTemplate;

  const resume = $('#resume');
  resume.dataset.template = nextTemplate;
  resume.classList.toggle('ats-template', nextTemplate === 'ats');

  if (nextTemplate === 'ats') {
    els.templateHint.textContent = 'ATS PDF создаётся через печать браузера: текст остаётся выделяемым и хорошо распознаётся системами найма.';
    els.pdfButton.textContent = 'Сохранить ATS PDF';
  } else {
    els.templateHint.textContent = 'Визуальный PDF сохраняется как оформленный документ.';
    els.pdfButton.textContent = 'Скачать PDF';
  }
}

function collectResumeModel() {
  const projects = [...document.querySelectorAll('#resumeProjects .resume-project')].map((item) => ({
    name: item.querySelector('h4')?.textContent || '',
    url: item.querySelector('.resume-project-link')?.textContent || '',
    description: item.querySelector('p')?.textContent || '',
  }));
  const skills = [...document.querySelectorAll('#skillLegend .skill-item')]
    .map((item) => {
      const name = item.querySelector('span')?.textContent?.trim();
      const percentage = item.querySelector('strong')?.textContent?.trim();
      return [name, percentage].filter(Boolean).join(' — ') || item.textContent.replace(/\s+/g, ' ').trim();
    });
  const contacts = [...document.querySelectorAll('#resumeContact span')].map((item) => item.textContent);

  return {
    name: $('#resumeName').textContent,
    headline: $('#resumeHeadline').textContent,
    contacts,
    about: $('#resumeAbout').textContent,
    projects,
    skills,
  };
}

export async function copyResume() {
  const text = buildResumeText(collectResumeModel());
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  toast(els.copyButton, 'Скопировано ✓');
}

export function downloadText() {
  const text = buildResumeText(collectResumeModel());
  downloadBlob(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
    `${safeFilename(state.user?.login)}-resume.txt`,
  );
  toast(els.textButton, 'TXT готов ✓');
}

export async function downloadPdf() {
  if (state.resumeTemplate === 'ats') {
    printAtsResume();
    return;
  }

  const button = els.pdfButton;
  const wasEditing = state.resumeEditing;
  button.disabled = true;
  button.textContent = 'Создаём PDF…';
  if (wasEditing) setResumeEditing(false);

  try {
    const canvas = await html2canvas($('#resume'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const image = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 198;
    const pageHeight = 285;
    const imageHeight = canvas.height * pageWidth / canvas.width;
    let heightLeft = imageHeight;
    let position = 6;

    pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imageHeight + 6;
      pdf.addPage();
      pdf.addImage(image, 'PNG', 6, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${safeFilename(state.user?.login)}-github-resume.pdf`);
  } finally {
    if (wasEditing) setResumeEditing(true);
    button.disabled = false;
    button.textContent = 'Скачать PDF';
  }
}

function printAtsResume() {
  const existing = document.querySelector('#atsPrintRoot');
  existing?.remove();

  const printRoot = document.createElement('div');
  printRoot.id = 'atsPrintRoot';
  const clone = $('#resume').cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.remove('is-editing');
  clone.classList.add('ats-template');
  clone.dataset.template = 'ats';
  clone.querySelectorAll('[contenteditable]').forEach((element) => element.removeAttribute('contenteditable'));
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);
  document.body.classList.add('ats-printing');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove('ats-printing');
    printRoot.remove();
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 60_000);
  }, 80);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
