import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../db/types';
import { EMPTY_FILTER, filterTransactions, isFiltered } from '../search';

const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36),
  type: 'expense',
  amount: 0,
  fee: 0,
  categoryId: 'other',
  occurredAt: 0,
  method: 'transfer',
  source: 'slip',
  createdAt: 0,
  updatedAt: 0,
  ...p,
});

const names: Record<string, string> = { food: 'อาหาร', travel: 'เดินทาง', salary: 'เงินเดือน', other: 'อื่นๆ' };
const name = (id: string) => names[id];

const list = [
  tx({ counterparty: 'LINE MAN ข้าวมันไก่', amount: 18900, categoryId: 'food', occurredAt: 3 }),
  tx({ counterparty: 'BTS สยาม', amount: 4700, categoryId: 'travel', occurredAt: 2, method: 'cash' }),
  tx({ note: 'ข้าวเที่ยงกับทีม', amount: 125000, categoryId: 'food', occurredAt: 1, method: 'credit' }),
  tx({ type: 'income', counterparty: 'บริษัท ตัวอย่าง', amount: 3250000, categoryId: 'salary', occurredAt: 4, ref: 'ABC123456789' }),
];

const run = (f: Partial<typeof EMPTY_FILTER>) => filterTransactions(list, { ...EMPTY_FILTER, ...f }, name).map((t) => t.amount);

describe('filterTransactions', () => {
  it('returns everything with an empty filter', () => {
    expect(run({})).toHaveLength(4);
    expect(isFiltered(EMPTY_FILTER)).toBe(false);
  });

  it('searches payee, note, category name and reference, case-insensitively', () => {
    expect(run({ query: 'line man' })).toEqual([18900]);
    expect(run({ query: 'ข้าว' })).toEqual([18900, 125000]);
    expect(run({ query: 'อาหาร' })).toEqual([18900, 125000]);
    expect(run({ query: 'abc1234' })).toEqual([3250000]);
  });

  it('finds amounts with or without satang and commas', () => {
    expect(run({ query: '189' })).toEqual([18900]);
    expect(run({ query: '1,250' })).toEqual([125000]);
    expect(run({ query: '47.00' })).toEqual([4700]);
  });

  it('needs every word to match', () => {
    expect(run({ query: 'ข้าว ทีม' })).toEqual([125000]);
  });

  it('filters by type, method, category and date', () => {
    expect(run({ type: 'income' })).toEqual([3250000]);
    expect(run({ method: 'cash' })).toEqual([4700]);
    expect(run({ categoryIds: ['food', 'travel'] })).toEqual([18900, 4700, 125000]);
    expect(run({ from: 3 })).toEqual([18900, 3250000]);
    expect(run({ categoryIds: ['food'], method: 'credit' })).toEqual([125000]);
  });
});
