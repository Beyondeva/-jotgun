import { useMemo } from 'react';
import { Money } from '../../design/components/Money';
import { Paper } from '../../design/components/Paper';
import { SwipeRow } from '../../design/components/SwipeRow';
import type { Category, Transaction } from '../../db/types';
import { formatWeekday, relativeDay, startOfDay } from '../../lib/date';
import { totals } from '../../lib/aggregate';
import { TxRow } from './TxRow';

interface Props {
  txs: Transaction[];
  categoryOf: (id: string) => Category;
  /** swipe left to delete, right to edit */
  onDelete?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
}

/** Transactions grouped by day and printed like a receipt, with each day's net total. */
export function Receipt({ txs, categoryOf, onDelete, onEdit }: Props) {
  const days = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    for (const t of [...txs].sort((a, b) => b.occurredAt - a.occurredAt)) {
      const d = startOfDay(t.occurredAt);
      map.set(d, [...(map.get(d) ?? []), t]);
    }
    return [...map.entries()];
  }, [txs]);

  const swipe = !!(onDelete || onEdit);

  return (
    <Paper torn className="receipt">
      {days.map(([day, items], i) => {
        const { balance: net } = totals(items);
        return (
          <div key={day}>
            {i > 0 && <div className="day-sep" />}
            <div className="day-head">
              <span>
                {relativeDay(day)} · {formatWeekday(day)}
              </span>
              <Money value={net} size="sm" bare sign="auto" tone={net > 0 ? 'income' : 'muted'} />
            </div>
            {items.map((t) =>
              swipe ? (
                <SwipeRow key={t.id} onDelete={onDelete && (() => onDelete(t))} onEdit={onEdit && (() => onEdit(t))} onTap={onEdit && (() => onEdit(t))}>
                  <TxRow tx={t} category={categoryOf(t.categoryId)} />
                </SwipeRow>
              ) : (
                <TxRow key={t.id} tx={t} category={categoryOf(t.categoryId)} />
              ),
            )}
          </div>
        );
      })}
    </Paper>
  );
}
