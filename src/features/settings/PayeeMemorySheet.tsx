import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconButton } from '../../design/components/Button';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { EmptyState } from '../../design/components/Feedback';
import { Sheet } from '../../design/components/Sheet';
import { db } from '../../db/db';
import { forgetPayee } from '../../db/slips';
import { useCategoryOf } from '../categories/store';

/** Payees the app has learned a category for; forgetting one lets the keyword rules decide again. */
export function PayeeMemorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const memory = useLiveQuery(() => db.payeeMemory.orderBy('key').toArray(), []);
  const categoryOf = useCategoryOf();

  return (
    <Sheet open={open} onClose={onClose} title="ผู้รับที่จำไว้">
      {memory && memory.length === 0 ? (
        <EmptyState mood="sleeping" title="ยังไม่ได้จำใคร" />
      ) : (
        <div className="cat-list">
          {memory?.map((m) => {
            const c = categoryOf(m.categoryId);
            return (
              <div key={m.key} className="cat-list__row">
                <CategoryIcon icon={c.icon} color={c.color} />
                <span>
                  <span className="cat-list__name">{m.key}</span>
                  <br />
                  <span className="cat-list__meta">
                    {c.name} · {m.count} ครั้ง
                  </span>
                </span>
                <span />
                <IconButton icon={faXmark} label={`ลืม ${m.key}`} onClick={() => void forgetPayee(m.key)} />
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
