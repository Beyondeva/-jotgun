import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from './seed';
import type { Budget, Category, PayeeMemory, Rule, Setting, Slip, Transaction } from './types';

class JotDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  slips!: EntityTable<Slip, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  rules!: EntityTable<Rule, 'id'>;
  payeeMemory!: EntityTable<PayeeMemory, 'key'>;
  budgets!: EntityTable<Budget, 'categoryId'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor() {
    super('jotgun');
    this.version(1).stores({
      transactions: 'id, occurredAt, type, categoryId, ref, [type+occurredAt]',
      slips: 'id, status, dedupeKey, createdAt',
      categories: 'id, order',
      rules: 'id, keyword, categoryId',
      payeeMemory: 'key',
      budgets: 'categoryId',
      settings: 'key',
    });

    // first open only: seed the default categories and keyword rules
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(DEFAULT_CATEGORIES);
      tx.table('rules').bulkAdd(DEFAULT_RULES);
    });
  }
}

export const db = new JotDB();
