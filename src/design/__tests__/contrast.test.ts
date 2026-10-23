import { describe, expect, it } from 'vitest';
import { parseThemeId, resolveTheme, THEMES, themeBootScript } from '../themes';
import tokens from '../tokens.css?raw';

/**
 * Guards the theme colours: WCAG AA for text in every theme, every theme defining
 * every colour, and the picker swatches staying in step with tokens.css.
 */

const css = tokens.replace(/\/\*[\s\S]*?\*\//g, '');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no block ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const root = block(':root');
const themeVars = (id: string) => (id === 'paper' ? root : { ...root, ...block(`:root[data-theme='${id}']`) });

function resolve(vars: Record<string, string>, name: string): string {
  let v = vars[name];
  for (let i = 0; v?.startsWith('var('); i++) v = vars[v.slice(4, -1).trim()];
  if (!v) throw new Error(`${name} undefined`);
  return v;
}

function rgb(c: string): [number, number, number] {
  const h = c.replace('#', '');
  const full = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
const lum = (c: string) => {
  const [r, g, b] = rgb(c).map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const TEXT = ['--ink', '--ink-2', '--ink-3', '--accent', '--over', '--income'];
const SURFACES = ['--paper', '--paper-2', '--sheet'];
const CATS = Object.keys(root).filter((k) => k.startsWith('--cat-'));
const COLOR_VARS = Object.keys(block(":root[data-theme='rain']"));

describe.each(THEMES.map((t) => t.id))('theme %s', (id) => {
  const v = themeVars(id);
  const c = (a: string, b: string) => contrast(resolve(v, a), resolve(v, b));

  it('defines every colour (no leaking from the default theme)', () => {
    if (id === 'paper') COLOR_VARS.forEach((k) => expect(root, k).toHaveProperty(k));
    else expect(Object.keys(block(`:root[data-theme='${id}']`)).sort()).toEqual([...COLOR_VARS].sort());
  });

  it.each(TEXT.flatMap((t) => SURFACES.map((s) => [t, s])))('%s on %s ≥ 4.5', (t, s) => {
    expect(c(t, s)).toBeGreaterThanOrEqual(4.5);
  });

  it('paired text ≥ 4.5', () => {
    expect(c('--on-accent', '--accent')).toBeGreaterThanOrEqual(4.5);
    expect(c('--on-ink', '--ink')).toBeGreaterThanOrEqual(4.5);
    expect(c('--mark-text', '--mark')).toBeGreaterThanOrEqual(4.5);
    expect(c('--mark-ink', '--mark')).toBeGreaterThanOrEqual(4.5);
    expect(c('--toast-action', '--ink')).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CATS)('%s icon on sheet ≥ 3', (k) => {
    expect(c(k, '--sheet')).toBeGreaterThanOrEqual(3);
  });

  it('picker swatch matches tokens.css', () => {
    const t = THEMES.find((x) => x.id === id)!;
    const want = { paper: '--paper', sheet: '--sheet', ink: '--ink', ink2: '--ink-2', accent: '--accent', income: '--income' };
    for (const [key, name] of Object.entries(want)) expect(t.swatch[key as keyof typeof want], key).toBe(resolve(v, name));
    expect(t.themeColor).toBe(resolve(v, '--paper'));
  });
});

describe('theme choice', () => {
  it('migrates old values and rejects unknown ones', () => {
    expect(parseThemeId(null)).toBe('system');
    expect(parseThemeId('light')).toBe('paper');
    expect(parseThemeId('dark')).toBe('rain');
    expect(parseThemeId('navy')).toBe('navy');
    expect(parseThemeId('nope')).toBe('system');
    expect(resolveTheme('system', true)).toBe('rain');
    expect(resolveTheme('system', false)).toBe('paper');
    expect(resolveTheme('plum', false)).toBe('plum');
  });

  const boot = (stored: string | null, dark: boolean) => {
    const attrs: Record<string, string> = {};
    const meta = { content: '', setAttribute: (_: string, val: string) => (meta.content = val) };
    const document = {
      documentElement: { setAttribute: (k: string, val: string) => (attrs[k] = val) },
      querySelector: () => meta,
    };
    const matchMedia = () => ({ matches: dark });
    new Function('document', 'localStorage', 'matchMedia', 'window', themeBootScript())(document, { getItem: () => stored }, matchMedia, { matchMedia });
    return [attrs['data-theme'], meta.content];
  };

  it('boot script paints the saved theme before React loads', () => {
    expect(boot(null, false)).toEqual(['paper', '#f4efe6']);
    expect(boot(null, true)).toEqual(['rain', '#191612']);
    expect(boot('dark', false)).toEqual(['rain', '#191612']);
    expect(boot('navy', false)).toEqual(['navy', '#0f141c']);
    expect(boot('garbage', true)).toEqual(['rain', '#191612']);
  });
});
