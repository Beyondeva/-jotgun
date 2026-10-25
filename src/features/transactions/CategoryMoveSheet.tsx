import { Sheet } from '../../design/components/Sheet';
import type { Transaction } from '../../db/types';
import { CategoryGrid } from '../categories/CategoryGrid';
import { forType, useCategories } from '../categories/store';

interface Props {
  /** the transaction being moved; null when closed */
  tx: Transaction | null;
  onClose: () => void;
  onPick: (tx: Transaction, categoryId: string) => void;
}

/** Swipe a row right: pick another category in one tap. */
export function CategoryMoveSheet({ tx, onClose, onPick }: Props) {
  const { categories } = useCategories();
  return (
    <Sheet open={!!tx} onClose={onClose} title={tx ? `ย้าย “${tx.counterparty || tx.note || 'รายการนี้'}” ไปหมวด` : ''}>
      {tx && (
        <CategoryGrid
          categories={forType(categories, tx.type)}
          selectedId={tx.categoryId}
          onPick={(id) => {
            onClose();
            if (id !== tx.categoryId) onPick(tx, id);
          }}
        />
      )}
    </Sheet>
  );
}
