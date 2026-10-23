import { motion } from 'framer-motion';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Money } from '../../design/components/Money';
import { catColor } from '../../design/palette';
import type { Category } from '../../db/types';

interface Row {
  category: Category;
  /** satang */
  value: number;
  /** satang; when set, the bar shows budget used with a "today" marker */
  budget?: number;
}

interface Props {
  rows: Row[];
  /** 0–1: how far through the period we are, for the today marker */
  periodProgress?: number;
  onSelect?: (c: Category) => void;
}

export function CategoryBars({ rows, periodProgress, onSelect }: Props) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="catbars">
      {rows.map(({ category: c, value, budget }, i) => {
        const ratio = budget ? value / budget : value / total;
        const over = !!budget && ratio > 1;
        // ahead of pace: spent a bigger share of the budget than of the month
        const ahead = !!budget && !over && periodProgress !== undefined && ratio > periodProgress + 0.1;
        const fill = over ? 'var(--over)' : catColor(c.color).ink;
        return (
          <button key={c.id} className="catbar" onClick={() => onSelect?.(c)}>
            <CategoryIcon icon={c.icon} color={c.color} />
            <div className="catbar__main">
              <div className="catbar__head">
                <span className="catbar__name">{c.name}</span>
                <Money value={value} size="sm" bare />
              </div>
              <div className="catbar__track">
                <motion.div
                  className="catbar__fill"
                  style={{ background: fill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: [0.2, 0, 0, 1] }}
                />
                {budget && periodProgress !== undefined && <span className="catbar__today" style={{ left: `${periodProgress * 100}%` }} />}
              </div>
              <div className={`catbar__foot ${over ? 'is-over' : ahead ? 'is-ahead' : ''}`}>
                {budget
                  ? over
                    ? `เกินงบ ฿${((value - budget) / 100).toLocaleString('en-US')}`
                    : `ใช้ ${Math.round(ratio * 100)}% ของงบ ฿${(budget / 100).toLocaleString('en-US')}${ahead ? ' · เร็วกว่ากำหนด' : ''}`
                  : `${Math.round(ratio * 100)}% ของรายจ่าย`}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
