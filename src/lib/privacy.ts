import { useSyncExternalStore } from 'react';

/**
 * "Hide amounts" (the eye on home): every figure shows ฿••• until tapped again,
 * for showing the phone to someone. Screens where you check or type an amount opt out.
 */
const KEY = 'jotgun:hide-amounts';
const CHANGED = 'jotgun:hide-amounts-changed';
export const MASK = '•••';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setAmountsHidden(hidden: boolean) {
  try {
    localStorage.setItem(KEY, hidden ? '1' : '0');
  } catch {
    /* private mode: the choice just won't persist */
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGED, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useAmountsHidden(): boolean {
  return useSyncExternalStore(subscribe, read);
}

/** Whole baht with ฿ for running text, e.g. "ใช้ได้อีกวันละ ฿120"; masked while amounts are hidden. */
export function useBahtText() {
  const hidden = useAmountsHidden();
  return (satang: number) => `฿${hidden ? MASK : Math.round(satang / 100).toLocaleString('en-US')}`;
}
