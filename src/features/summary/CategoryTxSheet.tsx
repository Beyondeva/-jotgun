import { useShell } from '../../app/shell';
import { EmptyState } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { Sheet } from '../../design/components/Sheet';
import type { Transaction } from '../../db/types';
import { totals } from '../../lib/aggregate';
import { useCategoryOf } from '../categories/store';
import { Receipt } from '../transactions/Receipt';

/** Transactions of one category within the list it was opened from. */
export function CategoryTxSheet({ categoryId, txs, onClose }: { categoryId: string | null; txs: Transaction[]; onClose: () => void }) {
  const { openManual, removeTx } = useShell();
  const categoryOf = useCategoryOf();
  const list = categoryId ? txs.filter((t) => t.categoryId === categoryId) : [];
  const sum = totals(list);

  return (
    <Sheet open={!!categoryId} onClose={onClose} title={categoryId ? categoryOf(categoryId).name : undefined}>
      {list.length === 0 ? (
        <EmptyState mood="sleeping" title="ยังไม่มีรายการ" />
      ) : (
        <>
          <div className="cat-sheet__total">
            <Money value={sum.expense || sum.income} size="lg" tone={sum.expense ? 'default' : 'income'} />
            <span className="num">{list.length} รายการ</span>
          </div>
          <Receipt
            txs={list}
            categoryOf={categoryOf}
            onEdit={(t) => {
              onClose();
              openManual(t);
            }}
            onDelete={removeTx}
          />
        </>
      )}
    </Sheet>
  );
}
