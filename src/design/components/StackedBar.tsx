import { motion, useReducedMotion } from 'framer-motion';
import { catColor, type CatColor } from '../palette';

export interface Slice {
  id: string;
  name: string;
  /** satang */
  value: number;
  color: CatColor;
}

/** One horizontal bar split by category. Reads faster than a donut on a phone. */
export function StackedBar({ data, onSelect }: { data: Slice[]; onSelect?: (s: Slice) => void }) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="stack">
      <div className="stack__bar">
        {data.map((d, i) => (
          <motion.button
            key={d.id}
            type="button"
            aria-label={`${d.name} ${Math.round((d.value / total) * 100)}%`}
            className="stack__seg"
            style={{ background: catColor(d.color).ink }}
            initial={{ flexGrow: reduce ? d.value : 0 }}
            animate={{ flexGrow: d.value }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: [0.2, 0, 0, 1] }}
            onClick={() => onSelect?.(d)}
          />
        ))}
      </div>
      <div className="stack__legend">
        {data.map((d) => (
          <button key={d.id} type="button" className="stack__item" onClick={() => onSelect?.(d)}>
            <span className="stack__dot" style={{ background: catColor(d.color).ink }} />
            {d.name}
            <span className="stack__pct num">{Math.round((d.value / total) * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
