import type { Transaction } from '../db/types';
import { startOfDay } from './date';
import type { Pace } from './pace';

/**
 * What ข้าวตัง on the home header feels and says, from the month's numbers.
 * Its mood follows the state; tapping it reads out these lines one by one.
 */
export type CatMood = 'happy' | 'worried' | 'sleeping';

export interface CatFacts {
  /** the month on screen is this month */
  current: boolean;
  now: number;
  /** the month's transactions, any order */
  txs: Transaction[];
  pace: Pace | null;
  /** the budget that most needs a mention */
  worst?: { name: string; status: 'over' | 'ahead'; ratio: number; spent: number; limit: number };
  /** biggest spending category */
  top?: { name: string; value: number };
  /** satang a day still spendable, 0 when not known */
  perDay: number;
  /** slips waiting in รอจด */
  pending: number;
}

const DAY = 86_400_000;
/** this many whole days without an entry and the cat dozes off */
export const QUIET_DAYS = 3;

const daysQuiet = (f: CatFacts) => {
  const last = Math.max(...f.txs.map((t) => t.occurredAt));
  return Math.floor((startOfDay(f.now) - startOfDay(last)) / DAY);
};

export function catMood(f: CatFacts): CatMood {
  if (!f.current) return 'happy';
  if (!f.txs.length || daysQuiet(f) >= QUIET_DAYS) return 'sleeping';
  if (f.worst?.status === 'over' || (f.pace?.planKind === 'budget' && f.pace.diff > 0)) return 'worried';
  return 'happy';
}

/** Days in a row, ending today or yesterday, with at least one entry. */
export function streakOf(txs: Transaction[], now: number): number {
  const days = new Set(txs.map((t) => startOfDay(t.occurredAt)));
  let d = startOfDay(now);
  if (!days.has(d)) d = startOfDay(d - DAY / 2);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = startOfDay(d - DAY / 2);
  }
  return n;
}

/** The cat's lines, most useful first. `baht` formats satang (and masks it when amounts are hidden). */
export function catLines(f: CatFacts, baht: (satang: number) => string): string[] {
  const out: string[] = [];
  if (f.current && !f.txs.length) return ['เดือนนี้ยังว่างอยู่เลย แตะ + แล้วจดรายการแรกกัน'];
  if (f.current && daysQuiet(f) >= QUIET_DAYS) out.push(`ไม่ได้จดมา ${daysQuiet(f)} วันแล้วนะ`);
  if (f.pending) out.push(`มีสลิปรอจด ${f.pending} ใบ`);
  if (f.worst?.status === 'over') out.push(`${f.worst.name}เกินงบแล้ว ${baht(f.worst.spent - f.worst.limit)}`);
  else if (f.worst) out.push(`${f.worst.name}ใช้ไป ${Math.round(f.worst.ratio * 100)}% ของงบแล้ว`);
  if (f.pace) {
    const d = baht(Math.abs(f.pace.diff));
    if (f.pace.planKind === 'budget') out.push(f.pace.diff <= 0 ? `ใช้ต่ำกว่าแผน ${d} เก่งมาก` : `ใช้เร็วกว่าแผน ${d} ค่อยๆ นะ`);
    else out.push(f.pace.diff <= 0 ? `ใช้น้อยกว่าเดือนก่อน ${d}` : `ใช้มากกว่าเดือนก่อน ${d} แล้ว`);
  }
  if (f.current && f.perDay > 0) out.push(`ใช้ได้อีกวันละ ${baht(f.perDay)}`);
  if (f.top) out.push(`เดือนนี้หมดไปกับ${f.top.name}มากสุด ${baht(f.top.value)}`);
  const streak = f.current ? streakOf(f.txs, f.now) : 0;
  if (streak >= 2) out.push(`จดติดกัน ${streak} วันแล้ว`);
  return out.length ? out : ['เดือนนี้เรียบร้อยดี'];
}
