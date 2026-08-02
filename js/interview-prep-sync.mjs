const TRACKER_KEY = 'auto-resume:application-tracker:v1';

export function initInterviewPrepTrackerSync(documentRef = globalThis.document, storage = globalThis.localStorage) {
  if (!documentRef?.body || typeof MutationObserver === 'undefined') return null;
  let scheduled = false;
  const sync = () => {
    scheduled = false;
    const select = documentRef.querySelector('#interviewPrepApplication');
    if (!select) return;
    const current = select.value;
    const locale = documentRef.querySelector('#localeSelect')?.value === 'en' ? 'en' : 'ru';
    let applications = [];
    try {
      const tracker = JSON.parse(storage?.getItem?.(TRACKER_KEY) || '{}');
      applications = (Array.isArray(tracker.records) ? tracker.records : [])
        .filter((item) => item && typeof item.id === 'string' && item.company && item.role)
        .slice(0, 120)
        .map((item) => ({ id: String(item.id).slice(0, 160), company: String(item.company).slice(0, 120), role: String(item.role).slice(0, 160) }));
    } catch {
      applications = [];
    }
    const empty = documentRef.createElement('option');
    empty.value = '';
    empty.textContent = locale === 'en' ? 'No linked application' : 'Без привязки';
    select.replaceChildren(empty, ...applications.map((application) => {
      const option = documentRef.createElement('option');
      option.value = application.id;
      option.textContent = `${application.company} — ${application.role}`;
      return option;
    }));
    select.value = applications.some((item) => item.id === current) ? current : '';
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(sync);
  };
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      if (mutation.target?.closest?.('#applicationTrackerPanel')) return true;
      return [...mutation.addedNodes].some((node) =>
        node?.id === 'applicationTrackerPanel'
        || node?.id === 'interviewPrepApplication'
        || node?.querySelector?.('#applicationTrackerPanel, #interviewPrepApplication'));
    });
    if (relevant) schedule();
  });
  observer.observe(documentRef.body, { childList: true, subtree: true });
  schedule();
  return { sync: schedule, disconnect: () => observer.disconnect() };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initInterviewPrepTrackerSync(), { once: true });
  else initInterviewPrepTrackerSync();
}
