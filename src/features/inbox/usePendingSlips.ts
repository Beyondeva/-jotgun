import { db } from '../../db/db';
import type { Slip } from '../../db/types';
import { useCachedLiveQuery } from '../../lib/useCachedLiveQuery';

/** Slips waiting in "รอจด", oldest first so they're handled in the order they came in. */
export function usePendingSlips(): Slip[] | undefined {
  return useCachedLiveQuery('slips:pending', () => db.slips.where('status').equals('pending').sortBy('createdAt'), []);
}

export function usePendingCount(): number {
  return useCachedLiveQuery('slips:pending-count', () => db.slips.where('status').equals('pending').count(), []) ?? 0;
}
