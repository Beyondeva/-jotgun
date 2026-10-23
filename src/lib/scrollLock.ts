import { useEffect } from 'react';

/**
 * Freeze the page behind an open sheet. iOS Safari ignores `overflow: hidden`
 * on <body> for touch scrolling, so the body is pinned with position: fixed at
 * its current offset and put back when the last sheet closes. Counted, so
 * stacked sheets (a sheet opened from a sheet) don't unlock early.
 */
let locks = 0;
let savedY = 0;

function lock() {
  if (locks++ > 0) return;
  savedY = window.scrollY;
  const s = document.body.style;
  s.position = 'fixed';
  s.top = `-${savedY}px`;
  s.left = '0';
  s.right = '0';
  s.width = '100%';
  s.overflow = 'hidden';
}

function unlock() {
  if (--locks > 0) return;
  const s = document.body.style;
  s.position = s.top = s.left = s.right = s.width = s.overflow = '';
  window.scrollTo(0, savedY);
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
