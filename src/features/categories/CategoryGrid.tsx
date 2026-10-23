import { faPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Icon } from '../../design/Icon';
import type { Category } from '../../db/types';

interface Props {
  categories: Category[];
  suggestedId?: string;
  selectedId?: string;
  onPick: (categoryId: string) => void;
  onCreate?: () => void;
}

/** 4-column grid of categories; the last cell creates a new one. */
export function CategoryGrid({ categories, suggestedId, selectedId, onPick, onCreate }: Props) {
  return (
    <div className="cat-grid" role="group" aria-label="เลือกหมวดหมู่">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`cat-grid__cell ${c.id === suggestedId ? 'is-suggested' : ''} ${c.id === selectedId ? 'is-selected' : ''}`}
          onClick={() => onPick(c.id)}
          aria-pressed={c.id === selectedId}
        >
          <CategoryIcon icon={c.icon} color={c.color} size={22} />
          <span className="cat-grid__name">{c.name}</span>
          {c.id === suggestedId && (
            <span className="cat-grid__hint" aria-label="ข้าวตังเดาว่าหมวดนี้" role="img">
              <Icon icon={faWandMagicSparkles} size={9} />
            </span>
          )}
        </button>
      ))}
      {onCreate && (
        <button type="button" className="cat-grid__cell cat-grid__cell--new" onClick={onCreate} aria-label="สร้างหมวดใหม่">
          <Icon icon={faPlus} size={18} />
        </button>
      )}
    </div>
  );
}
