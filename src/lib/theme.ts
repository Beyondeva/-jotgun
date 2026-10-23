import { useEffect, useState } from 'react';
import { parseThemeId, resolveTheme, THEME_STORAGE_KEY, themeById, type ThemeId } from '../design/themes';

export type { ThemeId };

const systemQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export function getThemePref(): ThemeId {
  try {
    return parseThemeId(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

/** Put a theme on the page: the [data-theme] block in tokens.css plus the PWA bar colour. */
function paint(pref: ThemeId) {
  const id = resolveTheme(pref, !!systemQuery()?.matches);
  document.documentElement.setAttribute('data-theme', id);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', themeById(id).themeColor);
}

export function applyTheme(pref: ThemeId) {
  paint(pref);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* private mode: the choice just won't persist */
  }
}

/** While "system" is chosen, follow the device switching between light and dark. */
export function watchSystemTheme(): () => void {
  const q = systemQuery();
  if (!q) return () => {};
  const onChange = () => getThemePref() === 'system' && paint('system');
  q.addEventListener('change', onChange);
  return () => q.removeEventListener('change', onChange);
}

export function useThemePref() {
  const [pref, setPref] = useState<ThemeId>(getThemePref);
  // another open picker (or tab) may change it; stay in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === THEME_STORAGE_KEY && setPref(getThemePref());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const set = (p: ThemeId) => {
    applyTheme(p);
    setPref(p);
  };
  return [pref, set] as const;
}
