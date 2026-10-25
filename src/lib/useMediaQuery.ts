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

/** Wide screens (responsive.css ≥ 1100px): overview | detail columns under a full-width top bar. */
export const WIDE = '(min-width: 1100px)';
