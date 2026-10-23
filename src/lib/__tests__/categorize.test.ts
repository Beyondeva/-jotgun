import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from '../../db/seed';
import type { PayeeMemory } from '../../db/types';
import { suggestCategory } from '../categorize';

const ctx = (memory: PayeeMemory[] = []) => ({ categories: DEFAULT_CATEGORIES, rules: DEFAULT_RULES, memory });

describe('suggestCategory', () => {
  it('uses keyword rules', () => {
    expect(suggestCategory('LINE MAN ข้าวมันไก่', 'expense', ctx())).toEqual({ categoryId: 'food', source: 'rule' });
    expect(suggestCategory('BTS สยาม', 'expense', ctx()).categoryId).toBe('travel');
    expect(suggestCategory('การไฟฟ้านครหลวง', 'expense', ctx()).categoryId).toBe('bills');
  });

  it('prefers the longest keyword', () => {
    expect(suggestCategory('GRABFOOD ส้มตำ', 'expense', ctx()).categoryId).toBe('food');
    expect(suggestCategory('GRAB TAXI', 'expense', ctx()).categoryId).toBe('travel');
  });

  it('is case-insensitive', () => {
    expect(suggestCategory('Starbucks Siam', 'expense', ctx()).categoryId).toBe('cafe');
  });

  it('lets remembered payees win over rules', () => {
    const memory = [{ key: 'BTS สยาม', categoryId: 'fun', count: 3, updatedAt: 0 }];
    expect(suggestCategory('BTS สยาม', 'expense', ctx(memory))).toEqual({ categoryId: 'fun', source: 'memory' });
  });

  it('matches memory regardless of honorifics', () => {
    const memory = [{ key: 'ขวัญ ร้านตัดผม', categoryId: 'health', count: 1, updatedAt: 0 }];
    expect(suggestCategory('นาย ขวัญ ร้านตัดผม', 'expense', ctx(memory)).categoryId).toBe('health');
  });

  it('ignores memory that points at a category of the wrong type', () => {
    const memory = [{ key: 'บริษัท ตัวอย่าง', categoryId: 'salary', count: 1, updatedAt: 0 }];
    expect(suggestCategory('บริษัท ตัวอย่าง', 'expense', ctx(memory)).source).toBe('fallback');
  });

  it('falls back per type', () => {
    expect(suggestCategory('ใครก็ไม่รู้', 'expense', ctx())).toEqual({ categoryId: 'other', source: 'fallback' });
    expect(suggestCategory('ใครก็ไม่รู้', 'income', ctx())).toEqual({ categoryId: 'transfer-in', source: 'fallback' });
    expect(suggestCategory(undefined, 'expense', ctx()).categoryId).toBe('other');
  });
});
