import { createContext, useContext, useState, type ReactNode } from 'react';
import { isCurrent, periodOf, shiftPeriod, type Period, type PeriodKind } from '../lib/period';

/** The period picked in the wide top bar, shared by the overview and รายการ. */
interface WidePeriod {
  period: Period;
  setKind: (kind: PeriodKind) => void;
  /** -1 earlier, +1 later (never past the current period) */
  step: (by: -1 | 1) => void;
  canStepForward: boolean;
}

const Ctx = createContext<WidePeriod | null>(null);

export function WidePeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => periodOf('month', Date.now()));
  const now = Date.now();
  const canStepForward = !isCurrent(period, now) && period.from < now;
  const value: WidePeriod = {
    period,
    // switching kind keeps the anchor: this period if it's current, else where it started
    setKind: (kind) => setPeriod((p) => periodOf(kind, isCurrent(p) ? Date.now() : p.from)),
    step: (by) => setPeriod((p) => (by > 0 && (isCurrent(p) || p.from > Date.now()) ? p : shiftPeriod(p, by))),
    canStepForward,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWidePeriod(): WidePeriod {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWidePeriod must be used inside <WidePeriodProvider>');
  return ctx;
}

const NOUN: Record<PeriodKind, string> = { week: 'สัปดาห์', month: 'เดือน', year: 'ปี' };
/** "เดือนนี้", "สัปดาห์ก่อน"… */
export const periodNoun = (kind: PeriodKind) => NOUN[kind];
