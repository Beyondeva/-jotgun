import { useLiveQuery } from 'dexie-react-hooks';
import { transactionsBetween } from '../../db/repo';
import type { Transaction } from '../../db/types';
import type { Period } from '../../lib/period';

/** Live list of transactions in a period, newest first. `undefined` while loading. */
export function useTransactions(period: Period): Transaction[] | undefined {
  return useLiveQuery(async () => (await transactionsBetween(period.from, period.to)).sort((a, b) => b.occurredAt - a.occurredAt), [period.from, period.to]);
}
