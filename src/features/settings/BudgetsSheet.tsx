import { useState } from 'react';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Sheet } from '../../design/components/Sheet';
import { setBudget, useBudgets } from '../../db/budgets';
import type { Category } from '../../db/types';
import { amountToSatang, satangToAmountText } from '../../lib/amountInput';
import { forType, useCategories } from '../categories/store';

/** Monthly budget per expense category; leave empty for no budget. */
export function BudgetsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories } = useCategories();
  const budgets = useBudgets() ?? [];
  const limitOf = (id: string) => budgets.find((b) => b.categoryId === id)?.monthlyLimit ?? 0;
  const total = budgets.reduce((s, b) => s + b.monthlyLimit, 0);

  return (
    <Sheet open={open} onClose={onClose} title="งบรายเดือน">
      <p className="field__help budget-total num">รวม ฿{(total / 100).toLocaleString('en-US')} ต่อเดือน</p>
      <div className="cat-list">
        {forType(categories, 'expense').map((c) => (
          <BudgetRow key={c.id} category={c} limit={limitOf(c.id)} />
        ))}
      </div>
    </Sheet>
  );
}

function BudgetRow({ category, limit }: { category: Category; limit: number }) {
  const [text, setText] = useState(satangToAmountText(limit));
  const commit = () => {
    const v = amountToSatang(text.replace(/[^\d.]/g, ''));
    if (v !== limit) void setBudget(category.id, v);
  };
  return (
    <label className="cat-list__row budget-row">
      <CategoryIcon icon={category.icon} color={category.color} />
      <span className="cat-list__name">{category.name}</span>
      <span className="budget-row__input">
        <span aria-hidden>฿</span>
        <input
          inputMode="decimal"
          value={text}
          placeholder="—"
          onChange={(e) => setText(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          aria-label={`งบ${category.name}`}
          enterKeyHint="done"
        />
      </span>
    </label>
  );
}
