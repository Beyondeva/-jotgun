import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../db/types';
import { catLines, catMood, streakOf, type CatFacts } from '../insights';
import type { Pace } from '../pace';

const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();
const tx = (d: number): Transaction => ({
  id: `t${d}`,
  type: 'expense',
  amount: 10000,
  fee: 0,
  categoryId: 'food',
  occurredAt: at(d),
  method: 'cash',
  source: 'manual',
  createdAt: 0,
  updatedAt: 0,
});
const baht = (s: number) => `฿${s / 100}`;
const pace = (diff: number, planKind: Pace['planKind'] = 'budget'): Pace => ({ dates: [], days: 31, elapsed: 25, actual: [], plan: [], planKind, diff });
const facts = (over: Partial<CatFacts> = {}): CatFacts => ({ current: true, now: at(25, 15), txs: [tx(23), tx(24), tx(25)], pace: null, perDay: 0, pending: 0, ...over });

describe('catMood', () => {
  it('is happy by default and only reacts in the current month', () => {
    expect(catMood(facts())).toBe('happy');
    expect(catMood(facts({ current: false, txs: [] }))).toBe('happy');
  });
  it('dozes off with no entries for three days', () => {
    expect(catMood(facts({ txs: [] }))).toBe('sleeping');
    expect(catMood(facts({ txs: [tx(22)] }))).toBe('sleeping');
    expect(catMood(facts({ txs: [tx(23)] }))).toBe('happy');
  });
  it('worries when over a budget or ahead of the budget plan, not of last month', () => {
    expect(catMood(facts({ worst: { name: 'กาแฟ', status: 'over', ratio: 1.2, spent: 120, limit: 100 } }))).toBe('worried');
    expect(catMood(facts({ pace: pace(500) }))).toBe('worried');
    expect(catMood(facts({ pace: pace(500, 'lastMonth') }))).toBe('happy');
  });
});

describe('streakOf', () => {
  it('counts back from today, or from yesterday before today’s first entry', () => {
    expect(streakOf([tx(23), tx(24), tx(25)], at(25, 20))).toBe(3);
    expect(streakOf([tx(22), tx(23), tx(24)], at(25, 9))).toBe(3);
    expect(streakOf([tx(20), tx(24)], at(25, 9))).toBe(1);
    expect(streakOf([], at(25))).toBe(0);
  });
});

describe('catLines', () => {
  it('puts what needs doing first', () => {
    const lines = catLines(facts({ pending: 2, worst: { name: 'กาแฟ', status: 'over', ratio: 1.2, spent: 12000, limit: 10000 }, pace: pace(-5000), perDay: 30000, top: { name: 'อาหาร', value: 90000 } }), baht);
    expect(lines).toEqual(['มีสลิปรอจด 2 ใบ', 'กาแฟเกินงบแล้ว ฿20', 'ใช้ต่ำกว่าแผน ฿50 เก่งมาก', 'ใช้ได้อีกวันละ ฿300', 'เดือนนี้หมดไปกับอาหารมากสุด ฿900', 'จดติดกัน 3 วันแล้ว']);
  });
  it('nudges an empty or quiet month', () => {
    expect(catLines(facts({ txs: [] }), baht)).toEqual(['เดือนนี้ยังว่างอยู่เลย แตะ + แล้วจดรายการแรกกัน']);
    expect(catLines(facts({ txs: [tx(20)] }), baht)[0]).toBe('ไม่ได้จดมา 5 วันแล้วนะ');
  });
});
