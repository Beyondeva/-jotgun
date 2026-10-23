import { faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../design/components/Button';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Icon } from '../../design/Icon';
import type { Category } from '../../db/types';
import { useCategories } from './store';

interface Props {
  onEdit: (category: Category) => void;
  onCreate: () => void;
}

/** All categories grouped by type; tap a row to edit it. */
export function CategoryList({ onEdit, onCreate }: Props) {
  const { categories, keywordsOf } = useCategories();
  const groups: { label: string; items: Category[] }[] = [
    { label: 'รายจ่าย', items: categories.filter((c) => c.kind !== 'income') },
    { label: 'รายรับ', items: categories.filter((c) => c.kind === 'income') },
  ];

  return (
    <div className="cat-list">
      <Button variant="quiet" icon={faPlus} block onClick={onCreate}>
        สร้างหมวดหมู่
      </Button>
      {groups.map((g) => (
        <div key={g.label}>
          <div className="cat-list__group">{g.label}</div>
          {g.items.map((c) => {
            const n = keywordsOf(c.id).length;
            return (
              <button key={c.id} className="cat-list__row" onClick={() => onEdit(c)}>
                <CategoryIcon icon={c.icon} color={c.color} />
                <span className="cat-list__name">{c.name}</span>
                <span className="cat-list__meta">{n > 0 ? `${n} คำ` : ''}</span>
                <Icon icon={faChevronRight} size={13} style={{ color: 'var(--ink-3)' }} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
