import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../db/types';
import { paceOf } from '../pace';
import { periodOf } from '../period';

const tx = (occurredAt: number, amount: number, type: Transaction['type'] = 'expense'): Transaction => ({
  id: `${occurredAt}-${amount}`,
  type,
  amount,
  fee: 0,
  categoryId: 'food',
  occurredAt,
  method: 'cash',
  source: 'manual',
  createdAt: 0,
  updatedAt: 0,
});

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
const october = periodOf('month', at(2026, 9, 1));

describe('paceOf', () => {
  const txs = [tx(at(2026, 9, 1), 10000), tx(at(2026, 9, 3), 20000), tx(at(2026, 9, 3), 5000, 'income'), tx(at(2026, 9, 20), 99900)];

  it('runs the total up to today and spreads the budget evenly', () => {
    const p = paceOf(txs, october, { budget: 310000, now: at(2026, 9, 10) })!;
    expect(p.days).toBe(31);
    expect(p.elapsed).toBe(10);
    expect(p.actual).toEqual([10000, 10000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000]);
    expect(p.plan[9]).toBe(100000);
    expect(p.planKind).toBe('budget');
    expect(p.diff).toBe(30000 - 100000);
  });

  it('draws all of a past month', () => {
    const p = paceOf(txs, october, { budget: 310000, now: at(2026, 10, 5) })!;
    expect(p.elapsed).toBe(31);
    expect(p.actual[30]).toBe(129900);
  });

  it('has nothing to draw for a future month or without a plan', () => {
    expect(paceOf(txs, october, { budget: 310000, now: at(2026, 8, 30) })).toBeNull();
    expect(paceOf(txs, october, { now: at(2026, 9, 10) })).toBeNull();
  });

  it('falls back to last month, holding its last day for longer months', () => {
    const september = [tx(at(2026, 8, 2), 40000), tx(at(2026, 8, 30), 60000)];
    const p = paceOf(txs, october, { previous: september, now: at(2026, 9, 31) })!;
    expect(p.planKind).toBe('lastMonth');
    expect(p.plan[0]).toBe(0);
    expect(p.plan[1]).toBe(40000);
    expect(p.plan[29]).toBe(100000);
    expect(p.plan[30]).toBe(100000); // October 31 vs September's last day
    expect(p.diff).toBe(129900 - 100000);
  });
});
