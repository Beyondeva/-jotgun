import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const OWNER_NAMES = 'ownerNames';

export async function getOwnerNames(): Promise<string[]> {
  return ((await db.settings.get(OWNER_NAMES))?.value as string[] | undefined) ?? [];
}

export const setOwnerNames = (names: string[]) => db.settings.put({ key: OWNER_NAMES, value: names });

/** Names on the owner's own accounts; a slip paid to one of these is income. */
export function useOwnerNames(): string[] | undefined {
  return useLiveQuery(getOwnerNames, []);
}
