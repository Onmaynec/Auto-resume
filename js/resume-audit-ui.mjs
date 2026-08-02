import {
  auditResume,
  buildResumeAuditMarkdown,
  buildResumeAuditText,
  resumeAuditFilename,
} from './resume-audit.mjs';

const bindings = new WeakMap();
const COPY = {
  ru: {
    kicker: 'Локальная проверка',
    title: 'Качество резюме',
    note: 'Оценка ATS-структуры, полноты, доказательности и читаемости. Резюме не изменяется автоматически.',
    recheck: 'Проверить снова',
    copy: 'Копировать отчёт',
    markdown: 'Скачать Markdown',
    text: 'Скачать TXT',
    copied: 'Отчёт скопирован',
    copyFailed: 'Не удалось скопировать',
    downloaded: 'Файл создан локально',
    issues: 'Рекомендации',
    noIssues: 'Важных рекомендаций не найдено.',
    privacy: 'Только в этой вкладке · без отправки на сервер',
    scoreLabel: 'Итоговый балл качества резюме',
  },
  en: {
    kicker: 'Local check',
    title: 'Resume quality',
    note: 'ATS structure, completeness, evidence and readability. The resume is never changed automatically.',
    recheck: 'Run again',
    copy: 'Copy report',
    markdown: 'Download Markdown',
    text: 'Download TXT',
    copied: 'Report copied',
    copyFailed: 'Could not copy',
    downloaded: 'File created locally',
    issues: 'Recommendations',
    noIssues: 'No important recommendations were found.',
    privacy: 'Current tab only · no server upload',
    scoreLabel: 'Overall resume quality score',
  },
};

export function mountResumeAudit({
  draft,
  requirements = [],
  locale = 'ru',
  editable = true,
  resumeElement,
  actionsElement,
  userLogin = 'developer',
} = {}) {
  if (!resumeElement || !actionsElement) return null;
  const previous = bindings.get(resumeElement);
  if (previous) {
    resumeElement.removeEventListener('input', previous.onInput);
    clearTimeout(previous.timer);
    previous.panel?.remove();
    bindings.delete(resumeElement);
  }
  if (!editable || !draft) return null;

  ensureStyles();
  const language = locale === 'en' ? 'en' : 'ru';
  const copy = COPY[language];
  const panel = document.createElement('section');
  panel.id = 'resumeAuditPanel';
  panel.className = 'resume-audit';
  panel.dataset.resumeAuditReady = 'true';
  panel.setAttribute('aria-labelledby', 'resumeAuditTitle');

  const anchor = actionsElement.querySelector('#presentationControls') || actionsElement.querySelector('.template-switch');
  if (anchor) anchor.insertAdjacentElement('afterend', panel);
  else actionsElement.prepend(panel);

  let report = null;
  let timer = null;

  const calculate = () => {
    report = auditResume({ draft, requirements, locale: language });
    renderPanel(panel, report, copy);
  };

  const onInput = () => {
    clearTimeout(timer);
    timer = setTimeout(calculate, 260);
    const binding = bindings.get(resumeElement);
    if (binding) binding.timer = timer;
  };

  panel.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-audit-action]');
    if (!button) return;
    const status = panel.querySelector('[data-audit-status]');
    const action = button.dataset.auditAction;
    if (action === 'recheck') {
      calculate();
      status.textContent = '';
      return;
    }
    if (!report) calculate();
    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(buildResumeAuditMarkdown(report));
        status.textContent = copy.copied;
      } catch {
        status.textContent = copy.copyFailed;
      }
      return;
    }
    if (action === 'markdown') {
      downloadText(buildResumeAuditMarkdown(report), resumeAuditFilename(userLogin, language, 'md'), 'text/markdown;charset=utf-8');
      status.textContent = copy.downloaded;
      return;
    }
    if (action === 'text') {
      downloadText(buildResumeAuditText(report), resumeAuditFilename(userLogin, language, 'txt'), 'text/plain;charset=utf-8');
      status.textContent = copy.downloaded;
    }
  });

  resumeElement.addEventListener('input', onInput);
  bindings.set(resumeElement, { onInput, timer, panel });
  calculate();
  return report;
}

function renderPanel(panel, report, copy) {
  const categories = Object.values(report.categories).map((category) => `
    <div class="resume-audit__category">
      <div><span>${escapeHtml(category.label)}</span><strong>${category.score}/${category.max}</strong></div>
      <progress max="${category.max}" value="${category.score}" aria-label="${escapeHtml(category.label)}"></progress>
    </div>`).join('');

  const issues = report.issues.length
    ? report.issues.slice(0, 8).map((issue) => `
      <li class="resume-audit__issue" data-severity="${issue.severity}" data-issue-code="${issue.code}">
        <span class="resume-audit__severity" aria-hidden="true"></span>
        <div><strong>${escapeHtml(issue.title)}</strong><p>${escapeHtml(issue.action)}</p><code>${issue.code}</code></div>
      </li>`).join('')
    : `<li class="resume-audit__empty">${copy.noIssues}</li>`;

  panel.dataset.auditScore = String(report.score);
  panel.dataset.auditGrade = report.grade;
  panel.innerHTML = `
    <div class="resume-audit__heading">
      <div>
        <span class="kicker">${copy.kicker}</span>
        <h3 id="resumeAuditTitle">${copy.title}</h3>
      </div>
      <div class="resume-audit__score" role="img" aria-label="${copy.scoreLabel}: ${report.score} из 100">
        <strong>${report.score}</strong><span>/100</span>
      </div>
    </div>
    <p class="resume-audit__grade">${escapeHtml(report.gradeLabel)}</p>
    <p class="resume-audit__note">${copy.note}</p>
    <div class="resume-audit__categories">${categories}</div>
    <div class="resume-audit__issues">
      <strong>${copy.issues}</strong>
      <ol>${issues}</ol>
    </div>
    <div class="resume-audit__actions">
      <button class="btn btn-secondary" type="button" data-audit-action="recheck">${copy.recheck}</button>
      <button class="btn btn-secondary" type="button" data-audit-action="copy">${copy.copy}</button>
      <button class="btn btn-secondary" type="button" data-audit-action="markdown">${copy.markdown}</button>
      <button class="btn btn-secondary" type="button" data-audit-action="text">${copy.text}</button>
    </div>
    <small class="resume-audit__privacy">${copy.privacy}</small>
    <small class="resume-audit__status" data-audit-status role="status" aria-live="polite"></small>`;
}

function ensureStyles() {
  if (document.querySelector('link[data-resume-audit-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './resume-audit.css';
  link.dataset.resumeAuditStyles = 'true';
  document.head.append(link);
}

function downloadText(content, filename, type) {
  const blob = new Blob([`\uFEFF${content}`], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}
