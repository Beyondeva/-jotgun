import { faPen, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import { Money } from '../design/components/Money';
import { CategoryIcon } from '../design/components/CategoryIcon';
import { Icon } from '../design/Icon';
import { catColor } from '../design/palette';
import type { Category, Transaction } from '../db/types';
import { totals } from '../lib/aggregate';
import { formatTime, formatWeekday, relativeDay, startOfDay } from '../lib/date';

interface Props {
  txs: Transaction[];
  categoryOf: (id: string) => Category;
  /** open a row (edit) */
  onOpen: (tx: Transaction) => void;
  /** with these, each row gets a checkbox */
  selected?: Set<string>;
  onSelect?: (ids: string[], on: boolean) => void;
  /** "เวลา" column (off where space is tight) */
  showTime?: boolean;
}

/**
 * Transactions as a table on wide screens: รายการ · หมวด · ที่มา · เวลา · จำนวน,
 * grouped by day with each day's net, like the receipt on phones.
 */
export function TxTable({ txs, categoryOf, onOpen, selected, onSelect, showTime = true }: Props) {
  const days = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    for (const t of [...txs].sort((a, b) => b.occurredAt - a.occurredAt)) {
      const d = startOfDay(t.occurredAt);
      map.set(d, [...(map.get(d) ?? []), t]);
    }
    return [...map.entries()];
  }, [txs]);

  const selectable = !!(selected && onSelect);
  const allOn = selectable && txs.length > 0 && txs.every((t) => selected!.has(t.id));
  const cols = 3 + (showTime ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <table className="w-table">
      <thead>
        <tr>
          {selectable && (
            <th className="w-table__check">
              <input type="checkbox" checked={allOn} onChange={(e) => onSelect!(txs.map((t) => t.id), e.target.checked)} aria-label="เลือกทั้งหมด" />
            </th>
          )}
          <th>รายการ</th>
          <th className="w-table__cat">หมวด</th>
          <th className="w-table__src">ที่มา</th>
          {showTime && <th className="w-table__time">เวลา</th>}
          <th className="w-table__amt">จำนวน</th>
        </tr>
      </thead>
      <tbody>
        {days.map(([day, items]) => {
          const net = totals(items).balance;
          return [
            <tr key={`d${day}`} className="w-table__day">
              <td colSpan={cols}>
                {relativeDay(day)} · {formatWeekday(day)}
              </td>
              <td className="w-table__amt">
                <Money value={net} size="sm" bare sign="auto" tone={net > 0 ? 'income' : 'muted'} />
              </td>
            </tr>,
            ...items.map((t) => {
              const c = categoryOf(t.categoryId);
              const tint = catColor(c.color);
              const on = selected?.has(t.id) ?? false;
              return (
                <tr key={t.id} className={on ? 'is-selected' : undefined} onClick={() => onOpen(t)}>
                  {selectable && (
                    <td className="w-table__check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={on} onChange={(e) => onSelect!([t.id], e.target.checked)} aria-label={`เลือก ${t.counterparty || c.name}`} />
                    </td>
                  )}
                  <td>
                    {/* the row opens on click; this button is the keyboard way in */}
                    <button type="button" className="w-table__name" onClick={(e) => (e.stopPropagation(), onOpen(t))}>
                      {t.counterparty || t.note || c.name}
                    </button>
                  </td>
                  <td>
                    <span className="w-tag" style={{ background: tint.wash, color: tint.ink }}>
                      <CategoryIcon icon={c.icon} color={c.color} size={16} />
                      {c.name}
                    </span>
                  </td>
                  <td className="w-table__src">
                    <Icon icon={t.source === 'slip' ? faReceipt : faPen} size={11} />
                    {t.source === 'slip' ? 'อ่านจากสลิป' : 'จดเอง'}
                  </td>
                  {showTime && <td className="w-table__time num">{formatTime(t.occurredAt)}</td>}
                  <td className="w-table__amt">
                    <Money value={t.amount} size="md" bare flow={t.type === 'income' ? 'in' : 'out'} />
                  </td>
                </tr>
              );
            }),
          ];
        })}
      </tbody>
    </table>
  );
}
