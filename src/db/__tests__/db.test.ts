import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { validateBackup } from '../../lib/backup';
import { buildBackup, restoreBackup } from '../backup';
import { setBudget } from '../budgets';
import { db } from '../db';
import { deleteCategory, saveCategory, saveTransaction } from '../repo';
import { setOwnerNames } from '../settings';
import { confirmAll, confirmSlip, ingestSlip, pickCategory, updateSlip } from '../slips';

const img = () => new Blob(['img'], { type: 'image/png' });
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();

beforeEach(async () => {
  // fresh, seeded database for every test
  db.close();
  await db.delete();
  await db.open();
});

describe('seed', () => {
  it('starts with the default categories and keyword rules', async () => {
    expect(await db.categories.count()).toBe(15);
    expect(await db.rules.count()).toBeGreaterThan(40);
  });
});

describe('slip flow', () => {
  it('guesses the category, confirms into a transaction and remembers the payee', async () => {
    const slip = await ingestSlip({ image: img(), thumb: img(), parsed: { amount: 35000, receiver: 'นาย ขวัญ ร้านตัดผม', occurredAt: at(22), ref: 'R1', bank: 'ktb' } });
    expect(slip.suggestedType).toBe('expense');
    expect(slip.suggestedCategoryId).toBe('other');

    expect(await confirmSlip(slip.id, 'health')).toBe(true);
    const tx = (await db.transactions.toArray())[0];
    expect(tx).toMatchObject({ amount: 35000, categoryId: 'health', counterparty: 'นาย ขวัญ ร้านตัดผม', source: 'slip', ref: 'R1', slipId: slip.id });
    expect((await db.slips.get(slip.id))?.status).toBe('confirmed');

    // next slip from the same payee is pre-filed under the learned category
    const again = await ingestSlip({ image: img(), thumb: img(), parsed: { amount: 30000, receiver: 'ขวัญ ร้านตัดผม', occurredAt: at(29), ref: 'R2', bank: 'ktb' } });
    expect(again.suggestedCategoryId).toBe('health');
  });

  it('treats transfers to the owner as income', async () => {
    await setOwnerNames(['นาย สมชาย ใจดี']);
    const slip = await ingestSlip({ image: img(), thumb: img(), parsed: { amount: 50000, receiver: 'สมชาย ใ***', sender: 'น.ส. มะปราง หวานใจ', occurredAt: at(20) } });
    expect(slip.suggestedType).toBe('income');
    expect(slip.suggestedCategoryId).toBe('transfer-in');
  });

  it('flags the same transfer twice, including after it was confirmed', async () => {
    const parsed = { amount: 18900, receiver: 'LINE MAN', occurredAt: at(23), ref: 'DUP1', bank: 'kbank' as const };
    const first = await ingestSlip({ image: img(), thumb: img(), parsed });
    expect(first.duplicateOf).toBeUndefined();
    const second = await ingestSlip({ image: img(), thumb: img(), parsed });
    expect(second.duplicateOf).toBe(first.id);
    await confirmSlip(first.id, 'food');
    await db.slips.delete(second.id);
    const third = await ingestSlip({ image: img(), thumb: img(), parsed });
    expect(third.duplicateOf).toBeDefined();
  });

  it('won’t confirm a slip without an amount, and confirm-all skips it', async () => {
    const empty = await ingestSlip({ image: img(), thumb: img(), parsed: {} });
    await ingestSlip({ image: img(), thumb: img(), parsed: { amount: 4700, receiver: 'BTS สยาม', occurredAt: at(23) } });
    expect(await confirmSlip(empty.id, 'other')).toBe(false);
    expect(await confirmAll()).toBe(1);
    expect(await db.transactions.count()).toBe(1);
    expect((await db.slips.get(empty.id))?.status).toBe('pending');
  });
});

describe('pick before confirm', () => {
  it('picking a category records nothing until confirmed, and survives later edits', async () => {
    const slip = await ingestSlip({ image: img(), thumb: img(), parsed: { amount: 6500, receiver: 'ร้านใหม่', occurredAt: at(23) } });
    await pickCategory(slip.id, 'cafe');
    expect(await db.transactions.count()).toBe(0);
    expect(await db.slips.get(slip.id)).toMatchObject({ suggestedCategoryId: 'cafe', categoryPicked: true, status: 'pending' });

    // editing the receiver would normally re-guess, but a hand-picked category stays
    await updateSlip(slip.id, { amount: 6500, receiver: 'LINE MAN', occurredAt: at(23) }, 'expense');
    expect((await db.slips.get(slip.id))?.suggestedCategoryId).toBe('cafe');

    expect(await confirmAll()).toBe(1);
    expect((await db.transactions.toArray())[0].categoryId).toBe('cafe');
  });
});

describe('categories', () => {
  it('moves a deleted category’s transactions to "อื่นๆ"', async () => {
    const cat = await saveCategory({ name: 'ตัดผม', kind: 'expense', color: 'teal', icon: 'scissors', keywords: ['ร้านตัดผม'] });
    await saveTransaction({ type: 'expense', amount: 100, fee: 0, categoryId: cat.id, occurredAt: at(1), method: 'cash', source: 'manual' });
    await setBudget(cat.id, 50000);
    await deleteCategory(cat.id);
    expect((await db.transactions.toArray())[0].categoryId).toBe('other');
    expect(await db.rules.where('categoryId').equals(cat.id).count()).toBe(0);
    expect(await db.budgets.get(cat.id)).toBeUndefined();
  });

  it('a keyword belongs to one category: claiming it moves it', async () => {
    await saveCategory({ name: 'รถไฟฟ้า', kind: 'expense', color: 'sky', icon: 'train', keywords: ['bts'] });
    const owners = await db.rules.filter((r) => r.keyword.toUpperCase() === 'BTS').toArray();
    expect(owners).toHaveLength(1);
    expect(owners[0].categoryId).not.toBe('travel');
  });
});

describe('backup', () => {
  it('round-trips through JSON and replaces existing data', async () => {
    await saveTransaction({ type: 'expense', amount: 18900, fee: 0, categoryId: 'food', occurredAt: at(23), method: 'transfer', source: 'slip' });
    await setBudget('food', 600000);
    const json = JSON.parse(JSON.stringify(await buildBackup()));
    const checked = validateBackup(json);
    expect(checked.ok).toBe(true);

    await saveTransaction({ type: 'expense', amount: 1, fee: 0, categoryId: 'food', occurredAt: at(24), method: 'cash', source: 'manual' });
    expect(await db.transactions.count()).toBe(2);

    if (checked.ok) await restoreBackup(checked.backup);
    expect(await db.transactions.count()).toBe(1);
    expect((await db.transactions.toArray())[0].amount).toBe(18900);
    expect(await db.budgets.get('food')).toEqual({ categoryId: 'food', monthlyLimit: 600000 });
    expect(await db.categories.count()).toBe(15);
  });
});
