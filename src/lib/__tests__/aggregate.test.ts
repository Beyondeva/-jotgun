import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../db/types';
import { expenseByCategory, expenseByDay, totals } from '../aggregate';

const day = (d: number, h = 10) => new Date(2026, 9, d, h).getTime();
const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36),
  type: 'expense',
  amount: 0,
  fee: 0,
  categoryId: 'food',
  occurredAt: day(1),
  method: 'cash',
  source: 'manual',
  createdAt: 0,
  updatedAt: 0,
  ...p,
});

const txs = [
  tx({ amount: 10000, categoryId: 'food', occurredAt: day(1) }),
  tx({ amount: 5000, fee: 1000, categoryId: 'travel', occurredAt: day(1, 18) }),
  tx({ amount: 20000, categoryId: 'food', occurredAt: day(3) }),
  tx({ type: 'income', amount: 100000, categoryId: 'salary', occurredAt: day(2) }),
];

describe('totals', () => {
  it('adds fees to spending and leaves income alone', () => {
    expect(totals(txs)).toEqual({ income: 100000, expense: 36000, balance: 64000 });
  });
  it('is zero for no transactions', () => {
    expect(totals([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe('expenseByCategory', () => {
  it('sorts largest first and ignores income', () => {
    expect(expenseByCategory(txs)).toEqual([
      { categoryId: 'food', value: 30000 },
      { categoryId: 'travel', value: 6000 },
    ]);
  });
});

describe('expenseByDay', () => {
  it('buckets by local day', () => {
    const days = [1, 2, 3].map((d) => new Date(2026, 9, d).getTime());
    expect(expenseByDay(txs, days)).toEqual([16000, 0, 20000]);
  });
});
