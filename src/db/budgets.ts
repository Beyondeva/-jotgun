import { useCachedLiveQuery } from '../lib/useCachedLiveQuery';
import { db } from './db';
import type { Budget } from './types';

/** Set a monthly budget in satang; 0 removes it. */
export async function setBudget(categoryId: string, monthlyLimit: number) {
  if (monthlyLimit > 0) await db.budgets.put({ categoryId, monthlyLimit });
  else await db.budgets.delete(categoryId);
}

export function useBudgets(): Budget[] | undefined {
  return useCachedLiveQuery('budgets', () => db.budgets.toArray(), []);
}
