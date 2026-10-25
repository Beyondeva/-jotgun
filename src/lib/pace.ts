import type { Transaction } from '../db/types';
import { expenseByDay } from './aggregate';
import { startOfDay } from './date';
import { daysIn, shiftPeriod, type Period } from './period';

/**
 * A month's spending as a running total, next to the line it should follow:
 * the budget spread evenly over the month, or last month's running total when
 * there is no budget.
 */
export interface Pace {
  /** days in the month */
  days: number;
  /** days drawn: up to today in the current month, all of a past month, none of a future one */
  elapsed: number;
  /** satang, running total for each elapsed day */
  actual: number[];
  /** satang, running total for every day of the month */
  plan: number[];
  planKind: 'budget' | 'lastMonth';
  /** satang, actual minus plan on the last elapsed day: below 0 is under plan */
  diff: number;
}

const running = (xs: number[]) => {
  let sum = 0;
  return xs.map((x) => (sum += x));
};

export function paceOf(txs: Transaction[], period: Period, opts: { budget?: number; previous?: Transaction[]; now?: number }): Pace | null {
  const now = opts.now ?? Date.now();
  const days = daysIn(period);
  const today = startOfDay(now);
  const elapsed = now >= period.to ? days.length : now < period.from ? 0 : days.findIndex((d) => d === today) + 1;
  if (elapsed === 0) return null;

  const actual = running(expenseByDay(txs, days)).slice(0, elapsed);
  let plan: number[];
  let planKind: Pace['planKind'];
  if (opts.budget && opts.budget > 0) {
    plan = days.map((_, i) => Math.round((opts.budget! * (i + 1)) / days.length));
    planKind = 'budget';
  } else if (opts.previous?.length) {
    const prevDays = daysIn(shiftPeriod(period, -1));
    const prev = running(expenseByDay(opts.previous, prevDays));
    // day 31 of a long month is compared with the last day of a shorter one
    plan = days.map((_, i) => prev[Math.min(i, prev.length - 1)]);
    planKind = 'lastMonth';
  } else {
    return null;
  }
  return { days: days.length, elapsed, actual, plan, planKind, diff: actual[elapsed - 1] - plan[elapsed - 1] };
}
