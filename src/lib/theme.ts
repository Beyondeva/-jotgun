import { useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'jotgun:theme';
const BG = { light: '#F4EFE6', dark: '#191612' };

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);

  // keep the iOS status bar area in sync with the forced theme
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    const scheme = m.media.includes('dark') ? 'dark' : 'light';
    m.content = pref === 'system' ? BG[scheme] : BG[pref];
  });

  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* private mode: theme just won't persist */
  }
}

export function useThemePref() {
  const [pref, setPref] = useState<ThemePref>(getThemePref);
  const set = (p: ThemePref) => {
    applyTheme(p);
    setPref(p);
  };
  return [pref, set] as const;
}
