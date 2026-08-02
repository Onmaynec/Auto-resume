const TRACKER_KEY = 'auto-resume:application-tracker:v1';

export function initInterviewPrepTrackerSync(documentRef = globalThis.document, windowRef = globalThis.window) {
  if (!documentRef?.body || !windowRef?.dispatchEvent || typeof MutationObserver === 'undefined') return null;
  let scheduled = false;
  const notify = () => {
    scheduled = false;
    let event;
    try {
      event = new StorageEvent('storage', { key: TRACKER_KEY });
    } catch {
      event = new Event('storage');
      Object.defineProperty(event, 'key', { value: TRACKER_KEY });
    }
    windowRef.dispatchEvent(event);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(notify);
  };
  const observer = new MutationObserver((mutations) => {
    const trackerChanged = mutations.some((mutation) => {
      if (mutation.target?.closest?.('#applicationTrackerPanel')) return true;
      return [...mutation.addedNodes].some((node) => node?.id === 'applicationTrackerPanel' || node?.querySelector?.('#applicationTrackerPanel'));
    });
    if (trackerChanged) schedule();
  });
  observer.observe(documentRef.body, { childList: true, subtree: true });
  return { disconnect: () => observer.disconnect() };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initInterviewPrepTrackerSync(), { once: true });
  else initInterviewPrepTrackerSync();
}
