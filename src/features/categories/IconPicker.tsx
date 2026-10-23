import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Icon } from '../../design/Icon';
import { CATEGORY_ICON_GROUPS, type CategoryIconKey } from '../../design/icons';
import { catColor, type CatColor } from '../../design/palette';

interface Props {
  value: CategoryIconKey;
  color: CatColor;
  onChange: (icon: CategoryIconKey) => void;
}

/** Icon grid split into groups, with chips that jump to each group. */
export function IconPicker({ value, color, onChange }: Props) {
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const c = catColor(color);

  return (
    <div className="icon-picker">
      <div className="tag-row icon-picker__jump">
        {CATEGORY_ICON_GROUPS.map((g, i) => (
          <button key={g.label} type="button" className="icon-picker__jump-chip" onClick={() => groupRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {g.label}
          </button>
        ))}
      </div>

      {CATEGORY_ICON_GROUPS.map((g, i) => (
        <div key={g.label} ref={(el) => void (groupRefs.current[i] = el)} className="icon-picker__group">
          <div className="icon-picker__label">{g.label}</div>
          <div className="icon-picker__grid" role="radiogroup" aria-label={g.label}>
            {(Object.entries(g.icons) as [CategoryIconKey, (typeof g.icons)[keyof typeof g.icons]][]).map(([k, def]) => (
              <motion.button
                key={k}
                type="button"
                role="radio"
                aria-checked={k === value}
                aria-label={k}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.12 }}
                className={`icon-picker__cell ${k === value ? 'is-active' : ''}`}
                style={k === value ? { background: c.wash, color: c.ink, borderColor: c.ink } : undefined}
                onClick={() => onChange(k)}
              >
                <Icon icon={def} size={19} />
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
