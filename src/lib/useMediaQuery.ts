import { useSyncExternalStore } from 'react';

/** Live match of a media query, for layout that CSS alone can't move (an element changing parent). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
  );
}

/** iPad landscape and computers: the separate wide layout in src/wide/. Below this is the phone layout. */
export const WIDE = '(min-width: 1024px)';

/** A finger rather than a mouse (iPad): the add button floats bottom right instead of sitting in the top bar. */
export const COARSE = '(pointer: coarse)';
