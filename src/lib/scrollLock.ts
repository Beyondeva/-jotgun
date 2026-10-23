import { useEffect } from 'react';

/**
 * Keep the page behind an open sheet still, without touching its layout.
 *
 * Pinning <body> with position: fixed makes iOS re-lay-out the whole page and it
 * visibly flickers, so instead:
 *  - overflow: hidden on <html> stops scrolling (honoured by iOS Safari 16+);
 *  - touchmove outside a sheet's scrollable body is cancelled, so a drag on the
 *    backdrop or on a sheet whose content fits can't chain to the page.
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
  document.documentElement.style.overflow = 'hidden';
  document.addEventListener('touchmove', onTouchMove, { passive: false });
}

function unlock() {
  if (--locks > 0) return;
  document.documentElement.style.overflow = '';
  document.removeEventListener('touchmove', onTouchMove);
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
