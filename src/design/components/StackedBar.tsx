import { motion, useReducedMotion } from 'framer-motion';
import { catColor, type CatColor } from '../palette';

export interface Slice {
  id: string;
  name: string;
  /** satang */
  value: number;
  color: CatColor;
}

interface Props {
  data: Slice[];
  onSelect?: (s: Slice) => void;
  /** Show this many of the biggest slices; the rest fold into one grey "อีก N หมวด" (tapping it calls onMore). */
  max?: number;
  onMore?: () => void;
}

const REST = 'rest';

/** One horizontal bar split by category. Reads faster than a donut on a phone. */
export function StackedBar({ data, onSelect, max = 4, onMore }: Props) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  // folding a single slice saves nothing
  const fold = sorted.length > max + 1;
  const shown = fold ? sorted.slice(0, max) : sorted;
  const rest = fold ? sorted.slice(max).reduce((s, d) => s + d.value, 0) : 0;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  const segs = [...shown.map((d) => ({ id: d.id, value: d.value, bg: catColor(d.color).ink, label: d.name })), ...(fold ? [{ id: REST, value: rest, bg: 'var(--rule-strong)', label: `อีก ${sorted.length - max} หมวด` }] : [])];
  const pick = (id: string) => (id === REST ? onMore?.() : onSelect?.(sorted.find((d) => d.id === id)!));

  return (
    <div className="stack">
      <div className="stack__bar">
        {segs.map((s, i) => (
          <motion.button
            key={s.id}
            type="button"
            aria-label={`${s.label} ${pct(s.value)}`}
            className="stack__seg"
            style={{ background: s.bg }}
            initial={{ flexGrow: reduce ? s.value : 0 }}
            animate={{ flexGrow: s.value }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: [0.2, 0, 0, 1] }}
            onClick={() => pick(s.id)}
          />
        ))}
      </div>
      <div className="stack__legend">
        {segs.map((s) => (
          <button key={s.id} type="button" className="stack__item" onClick={() => pick(s.id)}>
            <span className="stack__dot" style={{ background: s.bg }} />
            {s.label}
            <span className="stack__pct num">{pct(s.value)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
