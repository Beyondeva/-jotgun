/**
 * Theme registry — the single list of themes the user can pick (one at a time).
 *
 * Colours live in tokens.css as [data-theme="<id>"] blocks; this file only holds
 * what JS needs: names, grouping, the PWA bar colour, and a few swatch colours for
 * the picker cards (a test checks the swatches match tokens.css).
 *
 * Adding a plain theme: add a block to tokens.css and an entry here.
 * Decorated (ข้าวตัง) themes arrive in phase 2 and will add an optional `decor`.
 */

export type ThemeGroup = 'plain' | 'khaotang';

/** A theme that maps to one [data-theme] block. */
export type ConcreteThemeId = 'paper' | 'rain' | 'navy' | 'plum';
/** What the user can pick; "system" follows the device: paper by day, rain at night. */
export type ThemeId = 'system' | ConcreteThemeId;

export interface ThemeSwatch {
  paper: string;
  sheet: string;
  ink: string;
  ink2: string;
  accent: string;
  income: string;
}

export interface ConcreteTheme {
  id: ConcreteThemeId;
  name: string;
  group: ThemeGroup;
  scheme: 'light' | 'dark';
  /** <meta name="theme-color">: the PWA status bar / Safari toolbar */
  themeColor: string;
  swatch: ThemeSwatch;
}

export const THEMES: ConcreteTheme[] = [
  {
    id: 'paper',
    name: 'กระดาษ',
    group: 'plain',
    scheme: 'light',
    themeColor: '#f4efe6',
    swatch: { paper: '#f4efe6', sheet: '#fffcf6', ink: '#1f1b17', ink2: '#595048', accent: '#ae401d', income: '#2b7147' },
  },
  {
    id: 'rain',
    name: 'กระดาษคืนฝน',
    group: 'plain',
    scheme: 'dark',
    themeColor: '#191612',
    swatch: { paper: '#191612', sheet: '#26211c', ink: '#efe7da', ink2: '#ab9f90', accent: '#e8693f', income: '#73c48f' },
  },
  {
    id: 'navy',
    name: 'กรมท่า',
    group: 'plain',
    scheme: 'dark',
    themeColor: '#0f141c',
    swatch: { paper: '#0f141c', sheet: '#182131', ink: '#eef1f5', ink2: '#8e9bb0', accent: '#ff7a59', income: '#4fd1a0' },
  },
  {
    id: 'plum',
    name: 'พลัม',
    group: 'plain',
    scheme: 'dark',
    themeColor: '#17121b',
    swatch: { paper: '#17121b', sheet: '#241c2b', ink: '#f3ecf5', ink2: '#a596ad', accent: '#f2a93b', income: '#7bd389' },
  },
];

export const SYSTEM_LIGHT: ConcreteThemeId = 'paper';
export const SYSTEM_DARK: ConcreteThemeId = 'rain';

export const THEME_STORAGE_KEY = 'jotgun:theme';

/** Values saved by earlier versions of the app. */
const LEGACY: Record<string, ThemeId> = { light: 'paper', dark: 'rain' };

export const themeById = (id: ConcreteThemeId) => THEMES.find((t) => t.id === id)!;

/** Turn whatever is in storage into a valid choice (unknown or missing → system). */
export function parseThemeId(raw: string | null | undefined): ThemeId {
  const v = raw ? (LEGACY[raw] ?? raw) : 'system';
  return v === 'system' || THEMES.some((t) => t.id === v) ? (v as ThemeId) : 'system';
}

export const resolveTheme = (id: ThemeId, systemDark: boolean): ConcreteThemeId =>
  id === 'system' ? (systemDark ? SYSTEM_DARK : SYSTEM_LIGHT) : id;

/**
 * Inline <head> script (injected by vite.config.ts) that applies the saved theme
 * before the first paint, so the page never flashes the default colours first.
 * Self-contained: it can't import anything, so the data it needs is baked in.
 */
export function themeBootScript(): string {
  const colors = Object.fromEntries(THEMES.map((t) => [t.id, t.themeColor]));
  return `(function(){try{var C=${JSON.stringify(colors)},L=${JSON.stringify(LEGACY)},p=null;try{p=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )})}catch(e){}p=p&&L[p]||p||"system";if(p!=="system"&&!C[p])p="system";var t=p==="system"?(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?${JSON.stringify(
    SYSTEM_DARK,
  )}:${JSON.stringify(SYSTEM_LIGHT)}):p;document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",C[t])}catch(e){}})();`;
}
