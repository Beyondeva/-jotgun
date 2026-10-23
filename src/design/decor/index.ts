import { useEffect, useState, type ComponentType } from 'react';
import { activeTheme, useActiveTheme } from '../../lib/theme';
import type { TabKey } from '../components/TabBar';
import { themeById } from '../themes';

/**
 * Decorated (ข้าวตัง) themes. Each lives in its own folder here — ./<name>/index.tsx
 * default-exports a Decor — and is code-split, so its SVGs only download for
 * people who pick it. Colours stay in tokens.css like every other theme.
 */
export interface Decor {
  /**
   * Home header art, drawn behind the usual header text. Its ground must fade
   * into var(--paper) at the very bottom, so the page reads as the same scene
   * carrying on, with no seam.
   */
  Scene: ComponentType;
  /**
   * The scene carried on behind page content: a few motifs a shade lighter than
   * the page (--scene-mark*). Fixed, untouchable, never under the tab bar.
   */
  Pattern: ComponentType;
  /** drawn tab icons; tabs without one keep the plain icon */
  tabIcons?: Partial<Record<TabKey | 'add', ComponentType<{ active: boolean }>>>;
}

const folders = import.meta.glob<{ default: Decor }>('./*/index.tsx');
const loaded = new Map<string, Decor>();
const failed = new Set<string>();

function load(name: string): Promise<Decor> {
  const hit = loaded.get(name);
  if (hit) return Promise.resolve(hit);
  const importer = folders[`./${name}/index.tsx`];
  if (!importer) return Promise.reject(new Error(`no decor folder "${name}"`));
  return importer().then(
    (m) => {
      loaded.set(name, m.default);
      return m.default;
    },
    (e) => {
      failed.add(name);
      throw e;
    },
  );
}

/** Start downloading the current theme's decor at boot, before any page asks for it. */
export function preloadDecor() {
  const name = themeById(activeTheme())?.decor;
  if (name) void load(name).catch(() => {});
}

/**
 * The current theme's decor: null for plain themes, "loading" while its chunk is
 * on the way (pages hold their layout instead of jumping from plain to decorated).
 */
export function useDecor(): Decor | null | 'loading' {
  const name = themeById(useActiveTheme())?.decor;
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!name || loaded.has(name) || failed.has(name)) return;
    let live = true;
    load(name)
      .catch(() => {})
      .finally(() => live && rerender((n) => n + 1));
    return () => {
      live = false;
    };
  }, [name]);
  if (!name) return null;
  // a missing or failed folder falls back to the plain layout
  return loaded.get(name) ?? (folders[`./${name}/index.tsx`] && !failed.has(name) ? 'loading' : null);
}
