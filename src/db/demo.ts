import { useCachedLiveQuery } from '../lib/useCachedLiveQuery';
import { db } from './db';
import type { Budget, Transaction } from './types';

/**
 * "ดูตัวอย่าง": a made-up but believable last month and this month, so an empty app
 * can show what it does. Demo rows have ids starting with DEMO_PREFIX; budgets it adds
 * are listed in a setting so clearing removes only those. Real use clears it.
 */
export const DEMO_PREFIX = 'demo-';
const DEMO_BUDGETS = 'demoBudgets';

const BUDGETS: Budget[] = [
  { categoryId: 'food', monthlyLimit: 600000 },
  { categoryId: 'cafe', monthlyLimit: 150000 },
  { categoryId: 'travel', monthlyLimit: 200000 },
  { categoryId: 'shopping', monthlyLimit: 250000 },
];

type Entry = [categoryId: string, counterparty: string, baht: number, hour: number, method?: Transaction['method']];

/** Same numbers for the same day, so the demo doesn't reshuffle on every load. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const pick = <T>(xs: T[], seed: number) => xs[Math.floor(rand(seed) * xs.length)];

const LUNCH = ['ร้านข้าวมันไก่ป้าแดง', 'ก๋วยเตี๋ยวเรือหน้าซอย', 'ข้าวแกงป้าศรี', 'ส้มตำเจ๊หน่อย'];
const COFFEE = ['Café Amazon', 'ร้านกาแฟหน้าออฟฟิศ', '7-Eleven'];

function entriesFor(day: Date): Entry[] {
  const d = day.getDate();
  const seed = day.getFullYear() * 400 + day.getMonth() * 32 + d;
  const weekday = day.getDay() % 6 !== 0;
  const out: Entry[] = [];
  if (d === 1) out.push(['home', 'ค่าเช่าห้อง', 6500, 9]);
  if (d === 5) out.push(['bills', 'ค่าไฟ กฟน.', 780 + Math.round(rand(seed) * 160), 20]);
  if (d === 8) out.push(['bills', 'ค่าโทรศัพท์', 399, 10]);
  if (d === 15) out.push(['fun', 'Netflix', 419, 21]);
  out.push(['food', pick(LUNCH, seed), 45 + Math.round(rand(seed + 1) * 7) * 10, 12, rand(seed + 2) < 0.4 ? 'cash' : 'transfer']);
  if (rand(seed + 3) < 0.55) out.push(['cafe', pick(COFFEE, seed + 4), 55 + Math.round(rand(seed + 5) * 4) * 10, 8]);
  if (weekday) out.push(['travel', 'BTS', 44 + Math.round(rand(seed + 6) * 18), 8]);
  if (rand(seed + 7) < 0.25) out.push(['food', 'Grab Food', 180 + Math.round(rand(seed + 8) * 14) * 10, 19]);
  if (rand(seed + 9) < 0.12) out.push(['shopping', 'Shopee', 250 + Math.round(rand(seed + 10) * 64) * 10, 22]);
  if (d % 14 === 3) out.push(['gift', 'ทำบุญวัด', 100, 7, 'cash']);
  return out;
}

/** Last month in full and this month up to `now`, plus salary on the 25th. Pure, for tests. */
export function buildDemo(now = Date.now()): Transaction[] {
  const end = new Date(now);
  const day = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const txs: Transaction[] = [];
  let n = 0;
  const add = (t: Omit<Transaction, 'id' | 'fee' | 'source' | 'createdAt' | 'updatedAt'>) =>
    txs.push({ ...t, id: `${DEMO_PREFIX}${n++}`, fee: 0, source: 'manual', createdAt: now, updatedAt: now });

  for (; day.getTime() <= now; day.setDate(day.getDate() + 1)) {
    for (const [categoryId, counterparty, baht, hour, method = 'transfer'] of entriesFor(day)) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(rand(n) * 60)).getTime();
      if (at <= now) add({ type: 'expense', amount: baht * 100, categoryId, occurredAt: at, counterparty, method });
    }
    const payday = new Date(day.getFullYear(), day.getMonth(), 25, 9).getTime();
    if (day.getDate() === 25 && payday <= now) add({ type: 'income', amount: 2800000, categoryId: 'salary', occurredAt: payday, counterparty: 'บริษัท ตัวอย่าง จำกัด', method: 'transfer' });
  }
  return txs;
}

export async function loadDemo(now = Date.now()) {
  const added = [];
  for (const b of BUDGETS) {
    if (await db.budgets.get(b.categoryId)) continue;
    await db.budgets.put(b);
    added.push(b.categoryId);
  }
  await db.settings.put({ key: DEMO_BUDGETS, value: added });
  await db.transactions.bulkPut(buildDemo(now));
}

const demoIds = () => db.transactions.where('id').startsWith(DEMO_PREFIX).primaryKeys();

/** Remove the demo (and only the budgets it added). Safe to call when there is none. */
export async function clearDemo() {
  const ids = await demoIds();
  const budgets = ((await db.settings.get(DEMO_BUDGETS))?.value as string[] | undefined) ?? [];
  if (!ids.length && !budgets.length) return;
  await db.transactions.bulkDelete(ids);
  await db.budgets.bulkDelete(budgets);
  await db.settings.delete(DEMO_BUDGETS);
}

export function useDemoActive(): boolean {
  return (useCachedLiveQuery('tx:demo', async () => (await demoIds()).length, []) ?? 0) > 0;
}
