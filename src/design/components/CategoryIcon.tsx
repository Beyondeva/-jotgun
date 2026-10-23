import { Icon } from '../Icon';
import { CATEGORY_ICONS, type CategoryIconKey } from '../icons';
import { catColor, type CatColor } from '../palette';

interface Props {
  icon: CategoryIconKey;
  color: CatColor;
  /** px of the glyph box */
  size?: number;
  /** glyph: coloured icon only (lists) · tile: icon on a faint wash (pickers, previews) */
  variant?: 'glyph' | 'tile';
}

export function CategoryIcon({ icon, color, size = 28, variant = 'glyph' }: Props) {
  const c = catColor(color);
  return (
    <span
      className={`cat-icon cat-icon--${variant}`}
      style={{ width: size, height: size, color: c.ink, background: variant === 'tile' ? c.wash : undefined }}
      aria-hidden
    >
      <Icon icon={CATEGORY_ICONS[icon] ?? CATEGORY_ICONS.ellipsis} size={Math.round(size * (variant === 'tile' ? 0.42 : 0.62))} />
    </span>
  );
}
