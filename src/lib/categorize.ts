import type { Category, PayeeMemory, Rule, TxType } from '../db/types';
import { payeeKey } from './names';

export interface Suggestion {
  categoryId: string;
  source: 'memory' | 'rule' | 'fallback';
}

interface Context {
  categories: Category[];
  rules: Rule[];
  memory: PayeeMemory[];
}

const FALLBACK: Record<TxType, string> = { expense: 'other', income: 'transfer-in' };

const fits = (c: Category | undefined, type: TxType) => !!c && !c.archived && (c.kind === type || c.kind === 'both');

/**
 * Guess a category for a counterparty name:
 * 1. what the user picked for this payee before
 * 2. the longest matching keyword rule ("GRABFOOD" beats "GRAB")
 * 3. a fallback category for the type
 */
export function suggestCategory(counterparty: string | undefined, type: TxType, ctx: Context): Suggestion {
  const byId = new Map(ctx.categories.map((c) => [c.id, c]));

  if (counterparty) {
    const key = payeeKey(counterparty);
    const remembered = ctx.memory.find((m) => m.key === key);
    if (remembered && fits(byId.get(remembered.categoryId), type)) return { categoryId: remembered.categoryId, source: 'memory' };

    const haystack = counterparty.toLocaleUpperCase('th');
    const rule = ctx.rules
      .filter((r) => fits(byId.get(r.categoryId), type) && haystack.includes(r.keyword.toLocaleUpperCase('th')))
      .sort((a, b) => b.keyword.length - a.keyword.length)[0];
    if (rule) return { categoryId: rule.categoryId, source: 'rule' };
  }

  const fallback = FALLBACK[type];
  if (fits(byId.get(fallback), type)) return { categoryId: fallback, source: 'fallback' };
  const any = ctx.categories.find((c) => fits(c, type));
  return { categoryId: any?.id ?? 'other', source: 'fallback' };
}
