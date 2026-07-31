import { els, state } from './js/config.js';
import { applyData, getProfileData, isValidUsername, normalizeUsername } from './js/data.js';
import { bindProjectSelector, initializeProjectSelection } from './js/projects.js';
import { renderAll } from './js/render.js';
import {
  copyResume, downloadPdf, downloadText, generateResume, setResumeTemplate, toggleResumeEditing,
} from './js/resume.js';
import { showStatus } from './js/utils.js';

bindProjectSelector();

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = normalizeUsername(els.username.value);

  if (!isValidUsername(username)) {
    showStatus('Некорректный GitHub username. Используйте латинские буквы, цифры и дефисы.', 'error');
    return;
  }

  showStatus('Анализируем профиль, проекты и вклад за последние 12 месяцев…');
  els.dashboard.classList.add('hidden');
  els.resumeSection.classList.add('hidden');
  els.form.querySelector('button').disabled = true;

  try {
    const { data, cached } = await getProfileData(username);
    applyData(data);
    initializeProjectSelection();
    renderAll();
    els.dashboard.classList.remove('hidden');

    if (data.source === 'github-graphql') {
      const remaining = data.rateLimit?.remaining;
      const suffix = Number.isFinite(remaining) ? ` Осталось запросов GitHub: ${remaining}.` : '';
      showStatus(`${cached ? 'Показаны кэшированные данные.' : 'Годовая статистика загружена через безопасный API-прокси.'}${suffix}`, 'success');
    } else {
      showStatus(
        'Включён экономный режим: профиль и репозитории загружены двумя публичными запросами. Для точного годового heatmap разверните проект на Vercel и добавьте GITHUB_TOKEN.',
        'warning',
      );
    }
  } catch (error) {
    showStatus(error.message || 'Не удалось загрузить данные GitHub.', 'error');
  } finally {
    els.form.querySelector('button').disabled = false;
  }
});

els.generate.addEventListener('click', generateResume);
els.editButton.addEventListener('click', toggleResumeEditing);
els.copyButton.addEventListener('click', copyResume);
els.textButton.addEventListener('click', downloadText);
els.pdfButton.addEventListener('click', downloadPdf);
els.templateSelect.addEventListener('change', (event) => setResumeTemplate(event.target.value));

// Keep the current state available for debugging without exposing secrets.
window.autoResumeState = state;
