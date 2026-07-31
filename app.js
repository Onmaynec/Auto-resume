import { els, state } from './js/config.js';
import { applyData, getProfileData, isValidUsername, normalizeUsername } from './js/data.js';
import { bindProjectBuilder, renderProjectBuilder } from './js/projects.js';
import { renderAll, renderVacancyResult } from './js/render.js';
import {
  copyResume, copyShareLink, downloadText, downloadVisualPdf, generateResume,
  printAtsPdf, renderSharedResume, setTemplate,
} from './js/resume.js';
import { decodeSharePayload } from './js/share.mjs';
import { analyzeVacancy } from './js/vacancy.mjs';
import { showStatus } from './js/utils.js';

bindProjectBuilder();

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = normalizeUsername(els.username.value);
  if (!isValidUsername(username)) {
    showStatus('Некорректный GitHub username. Используйте латинские буквы, цифры и дефисы.', 'error');
    return;
  }

  showStatus('Анализируем профиль, проекты, активность и историю языков…');
  els.dashboard.classList.add('hidden');
  els.resumeSection.classList.add('hidden');
  els.form.querySelector('button').disabled = true;

  try {
    const { data, cached } = await getProfileData(username);
    applyData(data);
    renderAll();
    els.dashboard.classList.remove('hidden');
    if (data.source === 'github-graphql') {
      const remaining = data.rateLimit?.remaining;
      const suffix = Number.isFinite(remaining) ? ` Осталось запросов GitHub: ${remaining}.` : '';
      showStatus(`${cached ? 'Показаны кэшированные данные.' : 'Годовая аналитика загружена через безопасный API-прокси.'}${suffix}`, 'success');
    } else {
      showStatus('Включён экономный режим. История языков и точная годовая активность доступны после развёртывания на Vercel с GITHUB_TOKEN.', 'warning');
    }
  } catch (error) {
    showStatus(error.message || 'Не удалось загрузить данные GitHub.', 'error');
  } finally {
    els.form.querySelector('button').disabled = false;
  }
});

els.vacancyButton.addEventListener('click', () => {
  const text = els.vacancyText.value.trim();
  if (text.length < 40) {
    showStatus('Добавьте более подробное описание вакансии — минимум 40 символов.', 'warning');
    return;
  }
  state.vacancyAnalysis = analyzeVacancy(text, { repos: state.repos, languages: state.languages });
  if (state.vacancyAnalysis.rankedRepos.length) {
    state.selectedProjects = state.vacancyAnalysis.rankedRepos.map((repo) => repo.full_name || repo.name).slice(0, 5);
    renderProjectBuilder();
  }
  renderVacancyResult();
  showStatus('Вакансия проанализирована. Проекты и заголовок резюме адаптированы под требования.', 'success');
});

document.querySelector('#clearVacancyBtn').addEventListener('click', () => {
  els.vacancyText.value = '';
  state.vacancyAnalysis = null;
  renderVacancyResult();
});

els.generate.addEventListener('click', generateResume);
document.querySelector('#copyBtn').addEventListener('click', copyResume);
document.querySelector('#txtBtn').addEventListener('click', downloadText);
document.querySelector('#visualPdfBtn').addEventListener('click', downloadVisualPdf);
document.querySelector('#atsPdfBtn').addEventListener('click', printAtsPdf);
document.querySelector('#shareBtn').addEventListener('click', copyShareLink);
document.querySelectorAll('[data-template-button]').forEach((button) => {
  button.addEventListener('click', () => setTemplate(button.dataset.templateButton));
});

try {
  const match = window.location.hash.match(/^#resume=(.+)$/);
  if (match) renderSharedResume(decodeSharePayload(match[1]));
} catch (error) {
  showStatus(error.message || 'Не удалось открыть публичное резюме.', 'error');
}

window.autoResumeState = state;
