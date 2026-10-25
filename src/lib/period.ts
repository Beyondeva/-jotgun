import { startOfDay } from './date';

export type PeriodKind = 'week' | 'month' | 'year';

export interface Period {
  kind: PeriodKind;
  /** inclusive, local midnight */
  from: number;
  /** exclusive */
  to: number;
}

const DAY = 86_400_000;

/** Weeks start on Monday. */
export function periodOf(kind: PeriodKind, at: number): Period {
  const d = new Date(startOfDay(at));
  if (kind === 'year') return { kind, from: new Date(d.getFullYear(), 0, 1).getTime(), to: new Date(d.getFullYear() + 1, 0, 1).getTime() };
  if (kind === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    return { kind, from, to };
  }
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset).getTime();
  const to = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset + 7).getTime();
  return { kind, from, to };
}

export function shiftPeriod(p: Period, steps: number): Period {
  const anchor = new Date(p.from);
  if (p.kind === 'year') return periodOf('year', new Date(anchor.getFullYear() + steps, 0, 1).getTime());
  if (p.kind === 'month') return periodOf('month', new Date(anchor.getFullYear(), anchor.getMonth() + steps, 1).getTime());
  return periodOf('week', new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + steps * 7).getTime());
}

/** Local midnight of every day in the period (DST-safe: built from calendar dates, not ms offsets). */
export function daysIn(p: Period): number[] {
  const days: number[] = [];
  const d = new Date(p.from);
  while (d.getTime() < p.to) {
    days.push(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** 0–1: how much of the period has passed at `now` (counting today as passed). */
export function periodProgress(p: Period, now = Date.now()): number {
  if (now < p.from) return 0;
  if (now >= p.to) return 1;
  return Math.min(1, (startOfDay(now) + DAY - p.from) / (p.to - p.from));
}

/** Whole days left including today; 0 if the period is over. */
export function daysLeft(p: Period, now = Date.now()): number {
  if (now >= p.to) return 0;
  return daysIn({ ...p, from: Math.max(p.from, startOfDay(now)) }).length;
}

const dayMonth = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
const monthYear = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' });

/** "17 – 23 ต.ค. 69", "28 ต.ค. – 3 พ.ย. 69", "ตุลาคม 2569", "ปี 2569" */
export function periodLabel(p: Period): string {
  if (p.kind === 'year') return `ปี ${new Date(p.from).getFullYear() + 543}`;
  if (p.kind === 'month') return monthYear.format(p.from);
  const last = p.to - DAY;
  const a = new Date(p.from);
  const b = new Date(last);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${dayMonthYear.format(last)}`;
  return `${dayMonth.format(p.from)} – ${dayMonthYear.format(last)}`;
}

export const isCurrent = (p: Period, now = Date.now()) => now >= p.from && now < p.to;
