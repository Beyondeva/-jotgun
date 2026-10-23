import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../design/Icon';
import { SYSTEM_DARK, SYSTEM_LIGHT, THEMES, themeById, type ThemeGroup, type ThemeId, type ThemeSwatch } from '../../design/themes';
import { useThemePref } from '../../lib/theme';
import './theme-picker.css';

const GROUPS: { id: ThemeGroup; label: string }[] = [
  { id: 'plain', label: 'เรียบ' },
  { id: 'khaotang', label: 'ข้าวตัง' },
];

/**
 * Every theme as a preview card. All cards form ONE radio group: exactly one theme
 * is active, whichever heading it sits under.
 */
export function ThemePicker() {
  const [pref, setPref] = useThemePref();

  const card = (id: ThemeId, name: string, preview: React.ReactNode) => (
    <button
      key={id}
      type="button"
      role="radio"
      aria-checked={pref === id}
      className={`theme-card ${pref === id ? 'is-active' : ''}`}
      onClick={() => setPref(id)}
    >
      <span className="theme-card__preview" aria-hidden>
        {preview}
      </span>
      <span className="theme-card__name">
        {name}
        {pref === id && <Icon icon={faCheck} size={12} />}
      </span>
    </button>
  );

  return (
    <div role="radiogroup" aria-label="ธีม" className="theme-picker">
      {GROUPS.map((g) => {
        const themes = THEMES.filter((t) => t.group === g.id);
        return (
          <section key={g.id} className="theme-picker__group">
            <div className="list-cap">{g.label}</div>
            {themes.length === 0 && g.id !== 'plain' ? (
              <p className="theme-picker__empty">ธีมข้าวตังกำลังมา</p>
            ) : (
              <div className="theme-picker__grid">
                {g.id === 'plain' &&
                  card(
                    'system',
                    'ตามระบบ',
                    <span className="theme-mini theme-mini--split">
                      <Mini s={themeById(SYSTEM_LIGHT).swatch} />
                      <Mini s={themeById(SYSTEM_DARK).swatch} />
                    </span>,
                  )}
                {themes.map((t) => card(t.id, t.name, <Mini s={t.swatch} />))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** A thumbnail of the app in a theme: page, a receipt with two lines, an income figure and the accent. */
function Mini({ s }: { s: ThemeSwatch }) {
  if (s.scene) return <SceneMini s={s} />;
  return (
    <span className="theme-mini" style={{ background: s.paper }}>
      <span className="theme-mini__sheet" style={{ background: s.sheet }}>
        <span className="theme-mini__line" style={{ background: s.ink, width: '70%' }} />
        <span className="theme-mini__line" style={{ background: s.ink2, width: '45%' }} />
        <span className="theme-mini__income" style={{ color: s.income }}>
          +฿
        </span>
      </span>
      <span className="theme-mini__accent" style={{ background: s.accent }} />
    </span>
  );
}

/** Decorated themes: sky, moon, sea and sand bands, with the page colour below. */
function SceneMini({ s }: { s: ThemeSwatch }) {
  const c = s.scene!;
  return (
    <span className="theme-mini" style={{ background: s.paper }}>
      <svg viewBox="0 0 100 64" preserveAspectRatio="none" className="theme-mini__scene">
        <rect width="100" height="40" fill={c.sky} />
        <circle cx="76" cy="12" r="5" fill={c.moon} />
        <path d="M0 26 Q 12 23 25 26 T 50 26 T 75 26 T 100 26 V 40 H 0 Z" fill={c.sea} />
        <path d="M0 34 Q 40 29 100 33 V 40 H 0 Z" fill={c.sand} />
        <circle cx="26" cy="20" r="9" fill={s.paper} opacity="0.72" />
        <rect x="8" y="48" width="56" height="4" rx="2" fill={s.ink} />
        <rect x="8" y="56" width="34" height="4" rx="2" fill={s.ink2} />
      </svg>
    </span>
  );
}
