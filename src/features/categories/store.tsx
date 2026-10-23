import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { db } from '../../db/db';
import { deleteCategory, saveCategory, sameKeyword, type CategoryInput } from '../../db/repo';
import type { Category, Rule } from '../../db/types';

export { FALLBACK_CATEGORY_ID, normalizeKeyword, type CategoryInput } from '../../db/repo';

interface CategoryStore {
  /** false until IndexedDB has answered once */
  ready: boolean;
  categories: Category[];
  byId: (id: string) => Category | undefined;
  rules: Rule[];
  keywordsOf: (categoryId: string) => string[];
  /** which other category already owns this payee keyword, if any */
  keywordOwner: (keyword: string, exceptCategoryId?: string) => Category | undefined;
  save: (input: CategoryInput) => Promise<Category>;
  remove: (categoryId: string) => Promise<void>;
}

const Ctx = createContext<CategoryStore | null>(null);

/** Live view of the categories and keyword rules in IndexedDB. */
export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const rules = useLiveQuery(() => db.rules.toArray(), []);

  const list = useMemo(() => categories ?? [], [categories]);
  const ruleList = useMemo(() => rules ?? [], [rules]);
  const map = useMemo(() => new Map(list.map((c) => [c.id, c])), [list]);

  const keywordsOf = useCallback((id: string) => ruleList.filter((r) => r.categoryId === id).map((r) => r.keyword), [ruleList]);
  const keywordOwner = useCallback(
    (keyword: string, exceptId?: string) => {
      const rule = ruleList.find((r) => r.categoryId !== exceptId && sameKeyword(r.keyword, keyword));
      return rule && map.get(rule.categoryId);
    },
    [ruleList, map],
  );

  const value = useMemo<CategoryStore>(
    () => ({
      ready: categories !== undefined && rules !== undefined,
      categories: list,
      byId: (id) => map.get(id),
      rules: ruleList,
      keywordsOf,
      keywordOwner,
      save: saveCategory,
      remove: deleteCategory,
    }),
    [categories, rules, list, map, ruleList, keywordsOf, keywordOwner],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCategories must be used inside <CategoryProvider>');
  return ctx;
}

const MISSING: Category = { id: 'missing', name: 'ไม่มีหมวด', icon: 'question', color: 'slate', kind: 'both', order: 999 };

/** Lookup that never returns undefined (deleted or not-yet-loaded categories fall back). */
export function useCategoryOf() {
  const { byId } = useCategories();
  return useCallback((id: string) => byId(id) ?? byId('other') ?? MISSING, [byId]);
}

export const forType = (categories: Category[], type: 'expense' | 'income') =>
  categories.filter((c) => !c.archived && (c.kind === type || c.kind === 'both'));
