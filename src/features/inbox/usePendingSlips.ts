import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Slip } from '../../db/types';

/** Slips waiting in "รอจด", oldest first so they're handled in the order they came in. */
export function usePendingSlips(): Slip[] | undefined {
  return useLiveQuery(() => db.slips.where('status').equals('pending').sortBy('createdAt'), []);
}

export function usePendingCount(): number {
  return useLiveQuery(() => db.slips.where('status').equals('pending').count(), [], 0);
}
