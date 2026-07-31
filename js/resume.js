import { $, els, state } from './config.js';
import { escapeHtml, languageStats, score, toast } from './utils.js';

export function generateResume() {
  const user = state.user;
  const topLanguages = languageStats().slice(0, 3);
  const projects = [...state.repos].sort((a, b) => score(b) - score(a)).slice(0, 5);

  $('#resumeName').textContent = user.name || user.login;
  $('#resumeHeadline').textContent = `${topLanguages.map((item) => item.name).join(' / ') || 'Software'} Developer`;
  $('#resumeAvatar').src = user.avatar_url;
  $('#resumeContact').innerHTML = [
    user.location && `📍 ${escapeHtml(user.location)}`,
    `🔗 github.com/${escapeHtml(user.login)}`,
    `${Number(user.followers || 0)} подписчиков`,
    `${state.contributions.commits} публичных коммитов за год`,
  ].filter(Boolean).map((item) => `<span>${item}</span>`).join('');

  $('#resumeAbout').textContent = buildAbout();
  $('#resumeProjects').innerHTML = projects.map((repo) => `
    <div class="resume-project">
      <h4>${escapeHtml(repo.name)}</h4>
      <p>${escapeHtml(repo.description || `Проект на ${repo.language || 'современном технологическом стеке'}.`)} Стек: ${escapeHtml(Object.keys(repo.languages || {}).slice(0, 4).join(', ') || repo.language || 'не указан')}. ${repo.stargazers_count} ★, ${repo.forks_count} форков.</p>
    </div>
  `).join('');

  renderSkills();
  els.resumeSection.classList.remove('hidden');
  setTimeout(() => els.resumeSection.scrollIntoView({ behavior: 'smooth' }), 80);
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
    <div class="skill-item"><span>${escapeHtml(item.name)}</span><strong>${item.percent}%</strong></div>
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

export async function copyResume() {
  const projects = [...document.querySelectorAll('.resume-project')]
    .map((item) => `${item.querySelector('h4').textContent}: ${item.querySelector('p').textContent}`)
    .join('\n\n');
  const skills = languageStats().slice(0, 8).map((item) => `${item.name} — ${item.percent}%`).join(', ');
  const text = `${$('#resumeName').textContent}\n${$('#resumeHeadline').textContent}\n\nО СЕБЕ\n${$('#resumeAbout').textContent}\n\nПРОЕКТЫ\n${projects}\n\nНАВЫКИ\n${skills}`;

  await navigator.clipboard.writeText(text);
  toast($('#copyBtn'), 'Скопировано ✓');
}

export async function downloadPdf() {
  const button = $('#pdfBtn');
  button.disabled = true;
  button.textContent = 'Создаём PDF…';

  try {
    const canvas = await html2canvas($('#resume'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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
    pdf.save(`${state.user.login}-github-resume.pdf`);
  } finally {
    button.disabled = false;
    button.textContent = 'Скачать PDF';
  }
}
