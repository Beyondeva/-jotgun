import { newId } from '../lib/id';
import { db } from './db';
import type { Category, Rule, Transaction } from './types';

/** Category everything falls back to; it can't be deleted. */
export const FALLBACK_CATEGORY_ID = 'other';

export type TxInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export async function saveTransaction(input: TxInput): Promise<Transaction> {
  const now = Date.now();
  const existing = input.id ? await db.transactions.get(input.id) : undefined;
  const tx: Transaction = {
    ...input,
    id: input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.transactions.put(tx);
  return tx;
}

export const deleteTransaction = (id: string) => db.transactions.delete(id);

/** Put a deleted transaction back exactly as it was (undo). */
export const restoreTransaction = (tx: Transaction) => db.transactions.put(tx);

export const transactionsBetween = (from: number, to: number) => db.transactions.where('occurredAt').between(from, to, true, false).toArray();

export const normalizeKeyword = (k: string) => k.trim().replace(/\s+/g, ' ');
export const sameKeyword = (a: string, b: string) => normalizeKeyword(a).toLocaleUpperCase('th') === normalizeKeyword(b).toLocaleUpperCase('th');

export interface CategoryInput {
  id?: string;
  name: string;
  kind: Category['kind'];
  color: Category['color'];
  icon: Category['icon'];
  keywords: string[];
}

/** Create or update a category and replace its payee keywords. A keyword belongs to one category, so claiming it moves it here. */
export async function saveCategory(input: CategoryInput): Promise<Category> {
  return db.transaction('rw', db.categories, db.rules, async () => {
    const id = input.id ?? newId();
    const existing = await db.categories.get(id);
    const maxOrder = (await db.categories.orderBy('order').last())?.order ?? -1;
    const category: Category = {
      id,
      name: input.name.trim(),
      kind: input.kind,
      color: input.color,
      icon: input.icon,
      order: existing?.order ?? maxOrder + 1,
    };
    await db.categories.put(category);

    const keywords = input.keywords.map(normalizeKeyword).filter(Boolean);
    const all = await db.rules.toArray();
    const stale = all.filter((r) => r.categoryId === id || keywords.some((k) => sameKeyword(k, r.keyword)));
    const mine: Rule[] = keywords.map((keyword) => {
      const prev = all.find((r) => sameKeyword(r.keyword, keyword));
      return { id: prev?.id ?? newId(), keyword, categoryId: id, builtin: prev?.builtin ?? false };
    });
    await db.rules.bulkDelete(stale.map((r) => r.id));
    await db.rules.bulkPut(mine);
    return category;
  });
}

/** Delete a category; its transactions move to the fallback category so no money disappears from the totals. */
export async function deleteCategory(id: string) {
  if (id === FALLBACK_CATEGORY_ID) return;
  await db.transaction('rw', [db.categories, db.rules, db.transactions, db.payeeMemory, db.budgets], async () => {
    await db.transactions.where('categoryId').equals(id).modify({ categoryId: FALLBACK_CATEGORY_ID });
    await db.rules.where('categoryId').equals(id).delete();
    await db.payeeMemory.filter((m) => m.categoryId === id).delete();
    await db.budgets.delete(id);
    await db.categories.delete(id);
  });
}
