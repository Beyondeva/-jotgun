import { useSyncExternalStore } from 'react';

/**
 * Whether ข้าวตัง may move in 3D. Until the Settings switch is touched this follows
 * the device's reduce-motion setting; after that the switch decides.
 */
const KEY = 'jotgun:mascot3d';
const CHANGED = 'jotgun:mascot3d-changed';

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function read(): boolean {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  return saved === null ? !reducedMotion() : saved === '1';
}

export function setMascot3D(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* private mode: the choice just won't persist */
  }
  window.dispatchEvent(new Event(CHANGED));
}

let webgl: boolean | undefined;
function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGED, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener('storage', cb);
  };
}

/** The Settings switch. */
export function useMascot3DPref(): boolean {
  return useSyncExternalStore(subscribe, read);
}

/** Whether a live 3D cat can be drawn here. */
export function useMascot3D(): boolean {
  return useMascot3DPref() && hasWebGL();
}
