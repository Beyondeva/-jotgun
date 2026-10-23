import { useLiveQuery } from 'dexie-react-hooks';

/** Last result per query key, kept for the whole session. */
const cache = new Map<string, unknown>();

/**
 * useLiveQuery that starts from the last result seen for the same key.
 * useLiveQuery returns undefined on every mount until IndexedDB answers, so
 * switching tabs would blank the page for a frame; with this, a page you've
 * visited renders its previous data immediately and updates in place.
 */
export function useCachedLiveQuery<T>(key: string, querier: () => Promise<T> | T, deps: unknown[]): T | undefined {
  const live = useLiveQuery(querier, deps);
  if (live !== undefined) {
    cache.set(key, live);
    return live;
  }
  return cache.get(key) as T | undefined;
}
