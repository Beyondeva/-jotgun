import type { Transaction } from '../db/types';
import { startOfDay } from './date';

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

/** Fees count as spending: the money left the account either way. */
const spent = (t: Transaction) => t.amount + (t.type === 'expense' ? t.fee : 0);

export function totals(txs: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += spent(t);
  }
  return { income, expense, balance: income - expense };
}

/** Expense per category, largest first. */
export function expenseByCategory(txs: Transaction[]): { categoryId: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of txs) if (t.type === 'expense') map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + spent(t));
  return [...map.entries()].map(([categoryId, value]) => ({ categoryId, value })).sort((a, b) => b.value - a.value);
}

/** Expense per day, aligned to the given list of day starts. */
export function expenseByDay(txs: Transaction[], days: number[]): number[] {
  const index = new Map(days.map((d, i) => [d, i]));
  const out = days.map(() => 0);
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const i = index.get(startOfDay(t.occurredAt));
    if (i !== undefined) out[i] += spent(t);
  }
  return out;
}
