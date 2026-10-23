import type { Budget } from '../db/types';

export type BudgetStatus = 'ok' | 'ahead' | 'over';

export interface BudgetState {
  categoryId: string;
  /** satang */
  spent: number;
  /** satang */
  limit: number;
  /** spent / limit */
  ratio: number;
  status: BudgetStatus;
}

/** How far ahead of the calendar spending may run before we call it "too fast". */
const SLACK = 0.1;

/**
 * Compare each budgeted category's spending with how much of the month has passed.
 * "ahead" = spent a larger share of the budget than the share of the month gone by.
 */
export function budgetStates(spentByCategory: { categoryId: string; value: number }[], budgets: Budget[], monthProgress: number): BudgetState[] {
  const spent = new Map(spentByCategory.map((s) => [s.categoryId, s.value]));
  return budgets
    .filter((b) => b.monthlyLimit > 0)
    .map((b) => {
      const s = spent.get(b.categoryId) ?? 0;
      const ratio = s / b.monthlyLimit;
      const status: BudgetStatus = ratio > 1 ? 'over' : ratio > monthProgress + SLACK ? 'ahead' : 'ok';
      return { categoryId: b.categoryId, spent: s, limit: b.monthlyLimit, ratio, status };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

/** The state that deserves a mention: anything over first, then the fastest-running one. */
export const worstBudget = (states: BudgetState[]) => states.find((s) => s.status === 'over') ?? states.find((s) => s.status === 'ahead');
