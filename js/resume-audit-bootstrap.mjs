import { els, state } from './config.js';
import { mountResumeAudit } from './resume-audit-ui.mjs';

let observer = null;
let scheduled = false;

export function bootstrapResumeAudit() {
  if (typeof document === 'undefined') return null;
  const resumeElement = els.resume || document.querySelector('#resume');
  const actionsElement = document.querySelector('.resume-actions');
  if (!resumeElement || !actionsElement) return null;

  const sync = () => {
    scheduled = false;
    mountResumeAudit({
      draft: state.resumeDraft,
      requirements: Array.isArray(state.vacancyAnalysis?.requirements) ? state.vacancyAnalysis.requirements : [],
      locale: state.locale,
      editable: Boolean(state.resumeDraft && !state.sharedMode),
      resumeElement,
      actionsElement,
      userLogin: state.user?.login || 'developer',
    });
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(sync);
  };

  observer?.disconnect();
  observer = new MutationObserver(schedule);
  observer.observe(resumeElement, { childList: true, subtree: true });

  document.querySelector('#localeSelect')?.addEventListener('change', () => setTimeout(schedule, 0));
  document.querySelector('#analyzeVacancyBtn')?.addEventListener('click', () => setTimeout(schedule, 0));
  document.querySelector('#clearVacancyBtn')?.addEventListener('click', () => setTimeout(schedule, 0));

  schedule();
  return { sync: schedule, disconnect: () => observer?.disconnect() };
}

if (typeof document !== 'undefined') bootstrapResumeAudit();
