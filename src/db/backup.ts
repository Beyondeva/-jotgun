import type { Backup } from '../lib/backup';
import { db } from './db';

export async function buildBackup(): Promise<Backup> {
  const [transactions, categories, rules, payeeMemory, budgets, settings] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.rules.toArray(),
    db.payeeMemory.toArray(),
    db.budgets.toArray(),
    db.settings.toArray(),
  ]);
  return { app: 'jotgun', version: 1, exportedAt: new Date().toISOString(), transactions, categories, rules, payeeMemory, budgets, settings };
}

/** Replace all data with the backup. Slips waiting in "รอจด" are left alone. */
export async function restoreBackup(b: Backup): Promise<void> {
  const tables = [db.transactions, db.categories, db.rules, db.payeeMemory, db.budgets, db.settings];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.transactions.bulkAdd(b.transactions);
    await db.categories.bulkAdd(b.categories);
    await db.rules.bulkAdd(b.rules);
    await db.payeeMemory.bulkAdd(b.payeeMemory);
    await db.budgets.bulkAdd(b.budgets);
    await db.settings.bulkAdd(b.settings);
  });
}
