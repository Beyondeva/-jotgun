import { useEffect } from 'react';

/**
 * Keep the page behind an open sheet still — without changing any page style.
 *
 * Both `position: fixed` on <body> and `overflow: hidden` on <html> make iOS
 * repaint the whole page (and the fixed tab bar) when a sheet opens and again
 * when it closes, which shows as a flicker. So the page is left untouched and
 * only touch drags are filtered: a drag that isn't inside a sheet body that can
 * scroll is cancelled. `overscroll-behavior: contain` on .sheet__body stops the
 * remaining case (scrolling past the end of the sheet list) from chaining.
 * Counted, so stacked sheets (a sheet opened from a sheet) don't unlock early.
 */
let locks = 0;

function canScroll(el: Element | null): boolean {
  const body = el?.closest('.sheet__body');
  return !!body && body.scrollHeight > body.clientHeight;
}

function onTouchMove(e: TouchEvent) {
  if (!canScroll(e.target as Element)) e.preventDefault();
}

function lock() {
  if (locks++ > 0) return;
  document.addEventListener('touchmove', onTouchMove, { passive: false });
}

function unlock() {
  if (--locks > 0) return;
  document.removeEventListener('touchmove', onTouchMove);
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
