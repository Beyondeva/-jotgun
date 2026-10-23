import { describe, expect, it } from 'vitest';
import { budgetStates, worstBudget } from '../budget';

const spent = [
  { categoryId: 'food', value: 480000 },
  { categoryId: 'shopping', value: 170000 },
  { categoryId: 'cafe', value: 20000 },
];
const budgets = [
  { categoryId: 'food', monthlyLimit: 600000 },
  { categoryId: 'shopping', monthlyLimit: 150000 },
  { categoryId: 'cafe', monthlyLimit: 80000 },
  { categoryId: 'fun', monthlyLimit: 50000 },
  { categoryId: 'pet', monthlyLimit: 0 },
];

describe('budgetStates', () => {
  const states = budgetStates(spent, budgets, 0.5); // halfway through the month

  it('marks over, ahead of pace, and fine', () => {
    const by = Object.fromEntries(states.map((s) => [s.categoryId, s.status]));
    expect(by).toEqual({ shopping: 'over', food: 'ahead', cafe: 'ok', fun: 'ok' });
  });

  it('ignores zero budgets and sorts by how used up they are', () => {
    expect(states.map((s) => s.categoryId)).toEqual(['shopping', 'food', 'cafe', 'fun']);
  });

  it('is not "ahead" late in the month for the same spending', () => {
    const late = budgetStates(spent, budgets, 0.85);
    expect(late.find((s) => s.categoryId === 'food')?.status).toBe('ok');
  });
});

describe('worstBudget', () => {
  it('prefers over-budget categories', () => {
    expect(worstBudget(budgetStates(spent, budgets, 0.5))?.categoryId).toBe('shopping');
  });
  it('is undefined when everything is fine', () => {
    expect(worstBudget(budgetStates([{ categoryId: 'cafe', value: 100 }], budgets, 0.5))).toBeUndefined();
  });
});
