import type { PayMethod, Transaction, TxType } from '../db/types';

export interface TxFilter {
  query: string;
  type: TxType | 'all';
  categoryIds: string[];
  method: PayMethod | 'all';
  /** inclusive epoch ms; undefined = no limit */
  from?: number;
}

export const EMPTY_FILTER: TxFilter = { query: '', type: 'all', categoryIds: [], method: 'all' };

const norm = (s: string) => s.toLocaleUpperCase('th').replace(/\s+/g, ' ').trim();

/**
 * Match transactions against a filter. The text query looks at the payee, note,
 * category name and reference, and at the amount ("189" finds ฿189.00).
 */
export function filterTransactions(txs: Transaction[], f: TxFilter, categoryName: (id: string) => string): Transaction[] {
  const words = norm(f.query).split(' ').filter(Boolean);
  return txs.filter((t) => {
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.method !== 'all' && t.method !== f.method) return false;
    if (f.categoryIds.length && !f.categoryIds.includes(t.categoryId)) return false;
    if (f.from !== undefined && t.occurredAt < f.from) return false;
    if (!words.length) return true;
    const baht = (t.amount / 100).toFixed(2);
    const hay = norm([t.counterparty, t.note, categoryName(t.categoryId), t.ref, baht, baht.replace(/\.00$/, '')].filter(Boolean).join(' '));
    // every word must appear somewhere
    return words.every((w) => hay.includes(w.replace(/,/g, '')));
  });
}

export const isFiltered = (f: TxFilter) => !!f.query.trim() || f.type !== 'all' || f.method !== 'all' || f.categoryIds.length > 0 || f.from !== undefined;
