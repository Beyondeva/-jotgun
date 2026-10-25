import { describe, expect, it } from 'vitest';
import { daysIn, daysLeft, periodLabel, periodOf, periodProgress, shiftPeriod } from '../period';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('periodOf', () => {
  it('weeks run Monday to Sunday', () => {
    const p = periodOf('week', at(2026, 10, 23)); // Friday
    expect(new Date(p.from).getDay()).toBe(1);
    expect(new Date(p.from).getDate()).toBe(19);
    expect(daysIn(p)).toHaveLength(7);
  });

  it('a Sunday belongs to the week that started the Monday before', () => {
    const p = periodOf('week', at(2026, 10, 25));
    expect(new Date(p.from).getDate()).toBe(19);
  });

  it('months cover every calendar day', () => {
    expect(daysIn(periodOf('month', at(2026, 2, 10)))).toHaveLength(28);
    expect(daysIn(periodOf('month', at(2028, 2, 10)))).toHaveLength(29);
    expect(daysIn(periodOf('month', at(2026, 10, 23)))).toHaveLength(31);
  });
});

describe('shiftPeriod', () => {
  it('moves months across a year boundary', () => {
    const p = shiftPeriod(periodOf('month', at(2026, 12, 5)), 1);
    expect(new Date(p.from).getFullYear()).toBe(2027);
    expect(new Date(p.from).getMonth()).toBe(0);
  });

  it('moves weeks by seven days', () => {
    const p = shiftPeriod(periodOf('week', at(2026, 10, 23)), -1);
    expect(new Date(p.from).getDate()).toBe(12);
  });
});

describe('progress and days left', () => {
  const oct = periodOf('month', at(2026, 10, 1));
  it('counts today as used', () => {
    expect(daysLeft(oct, at(2026, 10, 23))).toBe(9);
    expect(periodProgress(oct, at(2026, 10, 23))).toBeCloseTo(23 / 31);
  });
  it('is finished after the period', () => {
    expect(daysLeft(oct, at(2026, 11, 2))).toBe(0);
    expect(periodProgress(oct, at(2026, 11, 2))).toBe(1);
  });
});

describe('periodLabel', () => {
  it('uses Thai short months and Buddhist-era years', () => {
    expect(periodLabel(periodOf('week', at(2026, 10, 23)))).toBe('19 – 25 ต.ค. 69');
    expect(periodLabel(periodOf('week', at(2026, 10, 28)))).toBe('26 ต.ค. – 1 พ.ย. 69');
    expect(periodLabel(periodOf('month', at(2026, 10, 23)))).toBe('ตุลาคม 2569');
  });
});

describe('year periods', () => {
  it('cover the calendar year, step by years and read in Buddhist era', () => {
    const p = periodOf('year', at(2026, 10, 23));
    expect(new Date(p.from)).toEqual(new Date(2026, 0, 1));
    expect(daysIn(p)).toHaveLength(365);
    expect(new Date(shiftPeriod(p, -1).from).getFullYear()).toBe(2025);
    expect(periodLabel(p)).toBe('ปี 2569');
    expect(daysIn(periodOf('year', at(2028, 5, 1)))).toHaveLength(366);
  });
});
