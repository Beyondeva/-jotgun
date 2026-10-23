/**
 * Theme registry — the single list of themes the user can pick (one at a time).
 *
 * Colours live in tokens.css as [data-theme="<id>"] blocks; this file only holds
 * what JS needs: names, grouping, the PWA bar colour, and a few swatch colours for
 * the picker cards (a test checks the swatches match tokens.css).
 *
 * Adding a plain theme: add a block to tokens.css and an entry here.
 * Adding a decorated (ข้าวตัง) theme: the same, plus a folder in src/design/decor/
 * named by `decor` (header scene + optional tab icons, loaded only when picked).
 */

export type ThemeGroup = 'plain' | 'khaotang';

/** A theme that maps to one [data-theme] block. */
export type ConcreteThemeId = 'paper' | 'rain' | 'navy' | 'plum' | 'beach' | 'monsoon' | 'stars';
/** What the user can pick; "system" follows the device: paper by day, rain at night. */
export type ThemeId = 'system' | ConcreteThemeId;

export interface ThemeSwatch {
  paper: string;
  sheet: string;
  ink: string;
  ink2: string;
  accent: string;
  income: string;
  /** decorated themes: a tiny version of the header scene for the picker card (sky, a middle band, the ground fading into the page, one bright spot) */
  scene?: { sky: string; band: string; ground: string; spot: string };
}

export interface ConcreteTheme {
  id: ConcreteThemeId;
  name: string;
  group: ThemeGroup;
  scheme: 'light' | 'dark';
  /** <meta name="theme-color">: the PWA status bar / Safari toolbar */
  themeColor: string;
  swatch: ThemeSwatch;
  /** folder in src/design/decor/ holding this theme's scene and tab icons */
  decor?: string;
}

export const THEMES: ConcreteTheme[] = [
  {
    id: 'paper',
    name: 'สว่าง',
    group: 'plain',
    scheme: 'light',
    themeColor: '#f4efe6',
    swatch: { paper: '#f4efe6', sheet: '#fffcf6', ink: '#1f1b17', ink2: '#595048', accent: '#ae401d', income: '#2b7147' },
  },
  {
    id: 'rain',
    name: 'มืด',
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
  {
    id: 'beach',
    name: 'ทะเลยามค่ำ',
    group: 'khaotang',
    scheme: 'dark',
    // the status bar sits over the scene's sky, not the page
    themeColor: '#101a2f',
    decor: 'beach',
    swatch: {
      paper: '#231b14',
      sheet: '#2e241b',
      ink: '#f6efe4',
      ink2: '#b3a491',
      accent: '#ff7a59',
      income: '#5fd4a0',
      scene: { sky: '#14213a', band: '#245074', ground: '#8a6a46', spot: '#f6df6b' },
    },
  },
  {
    id: 'monsoon',
    name: 'หน้าฝน',
    group: 'khaotang',
    scheme: 'dark',
    themeColor: '#141e24',
    decor: 'monsoon',
    swatch: {
      paper: '#1a2428',
      sheet: '#223038',
      ink: '#eef3f4',
      ink2: '#9fb1b7',
      accent: '#ffb347',
      income: '#5fd4b0',
      scene: { sky: '#18242b', band: '#33454e', ground: '#2a3a40', spot: '#ffb347' },
    },
  },
  {
    id: 'stars',
    name: 'นอนดูดาว',
    group: 'khaotang',
    scheme: 'dark',
    themeColor: '#232458',
    decor: 'stars',
    swatch: {
      paper: '#121331',
      sheet: '#1b1c42',
      ink: '#f0eefa',
      ink2: '#a6a3c8',
      accent: '#ffd166',
      income: '#6fe0b8',
      scene: { sky: '#232458', band: '#33346f', ground: '#3a2f5c', spot: '#ffd166' },
    },
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
