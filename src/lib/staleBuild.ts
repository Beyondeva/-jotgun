/**
 * After a deploy, a page still running the old build asks for chunks that no longer exist
 * (old SummaryPage-xxxx.js → 404). Reload once to pick up the new index.html; a session flag
 * stops a reload loop if the chunk is missing for some other reason.
 */
const KEY = 'jotgun:stale-reload';

/** Reload once per session. Returns false if we already tried (show the fallback instead). */
export function reloadForNewBuild(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* no sessionStorage: still try once */
  }
  window.location.reload();
  return true;
}

/** True for the errors a missing lazy chunk throws (Chrome, Safari, Firefox wordings). */
export const isChunkError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch|preload/i.test(String((e as Error)?.message ?? e));

export function watchStaleBuild() {
  // Vite fires this when a lazy chunk (or its CSS) fails to load
  window.addEventListener('vite:preloadError', (e) => {
    if (reloadForNewBuild()) e.preventDefault();
  });
  // a page that loaded fine clears the flag after a while, so a later deploy can reload again
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, 10_000);
}
