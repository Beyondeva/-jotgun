import { Money } from '../../design/components/Money';
import type { Totals } from '../../lib/aggregate';

/** Income / expense / balance as three ledger columns. */
export function Ledger({ totals }: { totals: Totals }) {
  return (
    <div className="ledger">
      <div className="ledger__col">
        <span className="ledger__label">รายรับ</span>
        <Money value={totals.income} size="sm" tone="income" countUp="ledger-income" />
      </div>
      <div className="ledger__col">
        <span className="ledger__label">รายจ่าย</span>
        <Money value={totals.expense} size="sm" countUp="ledger-expense" />
      </div>
      <div className="ledger__col">
        <span className="ledger__label">คงเหลือ</span>
        <Money value={totals.balance} size="sm" tone={totals.balance < 0 ? 'over' : 'default'} countUp="ledger-balance" />
      </div>
    </div>
  );
}
