import { useMemo } from 'react';
import type { Slice } from '../../design/components/StackedBar';
import { useBudgets } from '../../db/budgets';
import { expenseByCategory, totals } from '../../lib/aggregate';
import { budgetStates, worstBudget } from '../../lib/budget';
import type { CatFacts } from '../../lib/insights';
import { paceOf } from '../../lib/pace';
import { daysLeft, isCurrent, periodProgress, shiftPeriod, type Period } from '../../lib/period';
import { useCategoryOf } from '../categories/store';
import { usePendingSlips } from '../inbox/usePendingSlips';
import { useTransactions } from '../transactions/useTransactions';

/**
 * Everything the overview shows for a period, worked out once. The phone home page and the
 * wide overview both read this; they differ only in how they lay it out.
 */
export function useOverview(period: Period) {
  const categoryOf = useCategoryOf();
  const txs = useTransactions(period);
  const previous = useMemo(() => shiftPeriod(period, -1), [period]);
  const prevTxs = useTransactions(previous);
  const pending = usePendingSlips();
  const allBudgets = useBudgets();

  const sum = useMemo(() => totals(txs ?? []), [txs]);
  const prevSum = useMemo(() => totals(prevTxs ?? []), [prevTxs]);
  const byCat = useMemo(() => expenseByCategory(txs ?? []), [txs]);
  const slices = useMemo<Slice[]>(
    () =>
      byCat.map(({ categoryId: id, value }) => {
        const c = categoryOf(id);
        return { id, name: c.name, value, color: c.color };
      }),
    [byCat, categoryOf],
  );

  // budgets are monthly and per category: only a month is compared with them, and only
  // with spending in the budgeted categories
  const budgets = useMemo(() => (period.kind === 'month' ? (allBudgets ?? []) : []), [allBudgets, period.kind]);
  const states = budgetStates(byCat, budgets, periodProgress(period));
  const budgetTotal = states.reduce((s, b) => s + b.limit, 0);
  const budgetLeft = budgetTotal - states.reduce((s, b) => s + b.spent, 0);
  const pace = useMemo(() => {
    if (!txs?.length) return null;
    if (!budgetTotal) return paceOf(txs, period, { previous: prevTxs });
    const budgeted = new Set(budgets.filter((b) => b.monthlyLimit > 0).map((b) => b.categoryId));
    return paceOf(
      txs.filter((t) => budgeted.has(t.categoryId)),
      period,
      { budget: budgetTotal },
    );
  }, [txs, prevTxs, period, budgets, budgetTotal]);

  const current = isCurrent(period);
  const days = daysLeft(period);
  const perDay = sum.balance > 0 && days > 0 ? Math.floor(sum.balance / days) : 0;
  const worst = current ? worstBudget(states) : undefined;

  const worstCat = worst && categoryOf(worst.categoryId);
  const catFacts: CatFacts = {
    current,
    now: Date.now(),
    txs: txs ?? [],
    pace,
    worst: worst && worstCat ? { name: worstCat.name, status: worst.status === 'over' ? 'over' : 'ahead', ratio: worst.ratio, spent: worst.spent, limit: worst.limit } : undefined,
    top: byCat[0] && { name: categoryOf(byCat[0].categoryId).name, value: byCat[0].value },
    perDay: budgetTotal > 0 ? (budgetLeft > 0 && days > 0 ? Math.floor(budgetLeft / days) : 0) : perDay,
    pending: pending?.length ?? 0,
  };

  return { txs, prevTxs, pending, sum, prevSum, byCat, slices, states, budgetTotal, budgetLeft, pace, current, days, perDay, worst, catFacts };
}
