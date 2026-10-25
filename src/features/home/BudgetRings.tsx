import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../../design/components/Button';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { catColor } from '../../design/palette';
import type { Category } from '../../db/types';
import type { BudgetState } from '../../lib/budget';
import { useBahtText } from '../../lib/privacy';

const R = 27;
const C = 2 * Math.PI * R;

interface Props {
  states: BudgetState[];
  categoryOf: (id: string) => Category;
  onSelect: (categoryId: string) => void;
  onMore: () => void;
}

/**
 * Each budgeted category as a thin ink ring around its icon, most used first,
 * with what's left (or how far over) underneath. Scrolls sideways when there are many.
 */
export function BudgetRings({ states, categoryOf, onSelect, onMore }: Props) {
  const baht = useBahtText();
  return (
    <>
      <div className="section-head">
        <h2>งบ</h2>
        <IconButton icon={faArrowRight} label="ดูงบทุกหมวด" onClick={onMore} />
      </div>
      <div className="rings">
        {states.map((s) => {
          const c = categoryOf(s.categoryId);
          const over = s.status === 'over';
          const text = over ? `เกิน ${baht(s.spent - s.limit)}` : `เหลือ ${baht(s.limit - s.spent)}`;
          return (
            <button key={s.categoryId} type="button" className="ring" onClick={() => onSelect(s.categoryId)} aria-label={`${c.name} ${text}`}>
              <span className="ring__dial">
                <svg viewBox="0 0 64 64" aria-hidden>
                  <circle cx="32" cy="32" r={R} className="ring__track" />
                  <circle
                    cx="32"
                    cy="32"
                    r={R}
                    className="ring__fill"
                    transform="rotate(-90 32 32)"
                    style={{ stroke: over ? 'var(--over)' : catColor(c.color).ink, strokeDasharray: `${Math.min(1, s.ratio) * C} ${C}` }}
                  />
                </svg>
                <CategoryIcon icon={c.icon} color={c.color} size={26} />
              </span>
              <span className={`ring__left num ${over ? 'is-over' : s.status === 'ahead' ? 'is-ahead' : ''}`}>{text}</span>
              <span className="ring__name">{c.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
