import { transactionsBetween } from '../../db/repo';
import type { Transaction } from '../../db/types';
import type { Period } from '../../lib/period';
import { useCachedLiveQuery } from '../../lib/useCachedLiveQuery';

/** Live list of transactions in a period, newest first. `undefined` while loading. */
export function useTransactions(period: Period): Transaction[] | undefined {
  return useCachedLiveQuery(
    `tx:${period.from}-${period.to}`,
    async () => (await transactionsBetween(period.from, period.to)).sort((a, b) => b.occurredAt - a.occurredAt),
    [period.from, period.to],
  );
}
