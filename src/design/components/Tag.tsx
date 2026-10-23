import { Icon } from '../Icon';
import { CATEGORY_ICONS, type CategoryIconKey } from '../icons';
import { catColor, type CatColor } from '../palette';

interface Props {
  label: string;
  icon?: CategoryIconKey;
  color?: CatColor;
  selected?: boolean;
  onClick?: () => void;
}

/** A small category tag, like a stamp on the receipt. */
export function Tag({ label, icon, color = 'slate', selected, onClick }: Props) {
  const c = catColor(color);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`tag ${selected ? 'is-selected' : ''}`}
      style={selected ? { color: c.ink, borderColor: c.ink, background: c.wash } : undefined}
    >
      {icon && <Icon icon={CATEGORY_ICONS[icon]} size={12} style={{ color: c.ink }} />}
      <span>{label}</span>
    </button>
  );
}
