import { faCreditCard, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Money } from '../../design/components/Money';
import { Icon } from '../../design/Icon';
import type { Category, Transaction } from '../../db/types';
import { formatTime } from '../../lib/date';

interface Props {
  tx: Transaction;
  category: Category;
}

/** One line on the receipt. */
export function TxRow({ tx, category }: Props) {
  const method = tx.method === 'cash' ? { icon: faMoneyBill, label: 'เงินสด' } : tx.method === 'credit' ? { icon: faCreditCard, label: 'บัตร' } : null;
  return (
    <div className="tx">
      <CategoryIcon icon={category.icon} color={category.color} />
      <div className="tx__main">
        <div className="tx__title">{tx.counterparty || tx.note || category.name}</div>
        <div className="tx__sub">
          <span>{category.name}</span>
          <span aria-hidden>·</span>
          <span className="num">{formatTime(tx.occurredAt)}</span>
          {method && (
            <span title={method.label} aria-label={method.label} role="img">
              <Icon icon={method.icon} size={11} />
            </span>
          )}
        </div>
      </div>
      <div className="tx__amt">
        <Money value={tx.amount} size="md" bare flow={tx.type === 'income' ? 'in' : 'out'} />
      </div>
    </div>
  );
}
