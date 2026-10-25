import type { ConcreteThemeId } from '../themes';
import { useActiveTheme } from '../../lib/theme';

const FILES = import.meta.glob<string>('../../assets/logo/{wordmark,logo-mark}-*.svg', { eager: true, query: '?url', import: 'default' });

/** logo file per theme; "rain" is the default art, and the monsoon theme uses the file named rain */
const ART: Record<ConcreteThemeId, string> = {
  paper: 'paper',
  rain: 'default',
  navy: 'navy',
  plum: 'plum',
  beach: 'beach',
  monsoon: 'rain',
  stars: 'stars',
};

const file = (kind: 'wordmark' | 'logo-mark', art: string) =>
  FILES[`../../assets/logo/${kind}-${art}.svg`] ?? FILES[`../../assets/logo/${kind}-default.svg`];

/** ข้าวตัง + "จดกัน" drawn for the theme on screen; `compact` shows the mark alone. */
export function AppLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  const art = ART[useActiveTheme()] ?? 'default';
  const size = compact ? 34 : 44;
  return (
    <img
      src={file(compact ? 'logo-mark' : 'wordmark', art)}
      alt="จดกัน"
      height={size}
      width={compact ? size : Math.round((size * 253) / 70)}
      className={className}
      draggable={false}
    />
  );
}
