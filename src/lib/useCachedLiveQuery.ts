import { useLiveQuery } from 'dexie-react-hooks';
import { useRef } from 'react';

/** Last result per query key, kept for the whole session. */
const cache = new Map<string, unknown>();

/**
 * useLiveQuery that never blanks the screen while it waits:
 * 1. a page you've visited renders its previous data for the same key immediately;
 * 2. when the key changes (e.g. switching month) and nothing is cached yet,
 *    the previous result stays on screen until the new one arrives.
 * Returns undefined only on the very first load.
 */
export function useCachedLiveQuery<T>(key: string, querier: () => Promise<T> | T, deps: unknown[]): T | undefined {
  // tag each result with its key so a late answer for an old key is never filed under the new one
  const live = useLiveQuery(async () => ({ key, value: await querier() }), [key, ...deps]);
  const last = useRef<T | undefined>(undefined);

  if (live && live.key === key) {
    cache.set(key, live.value);
    last.current = live.value;
    return live.value;
  }
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) {
    last.current = cached;
    return cached;
  }
  return last.current;
}
