import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../../db/seed';
import type { Transaction } from '../../db/types';
import { fileStamp, toCsv, validateBackup } from '../backup';

const tx = (p: Partial<Transaction>): Transaction => ({
  id: 'x',
  type: 'expense',
  amount: 0,
  fee: 0,
  categoryId: 'food',
  occurredAt: new Date(2026, 9, 23, 14, 32).getTime(),
  method: 'transfer',
  source: 'slip',
  createdAt: 0,
  updatedAt: 0,
  ...p,
});

const valid = () => ({
  app: 'jotgun',
  version: 1,
  exportedAt: '2026-10-23T00:00:00.000Z',
  transactions: [tx({ amount: 100 })],
  categories: DEFAULT_CATEGORIES,
  rules: [],
  payeeMemory: [],
  budgets: [],
  settings: [],
});

describe('validateBackup', () => {
  it('accepts a backup it produced', () => {
    expect(validateBackup(valid()).ok).toBe(true);
  });

  it('rejects other files with a reason', () => {
    expect(validateBackup({ hello: 1 })).toEqual({ ok: false, reason: 'ไม่ใช่ไฟล์สำรองของจดกัน' });
    expect(validateBackup({ ...valid(), version: 9 })).toMatchObject({ ok: false });
    expect(validateBackup({ ...valid(), rules: undefined })).toMatchObject({ ok: false, reason: 'ไฟล์ไม่ครบ (ไม่มี rules)' });
    expect(validateBackup({ ...valid(), transactions: [{ id: 'a', amount: '12' }] })).toMatchObject({ ok: false, reason: 'รายการที่ 1 ข้อมูลไม่ถูกต้อง' });
    expect(validateBackup({ ...valid(), categories: [] })).toMatchObject({ ok: false });
  });
});

describe('toCsv', () => {
  const name = (id: string) => (id === 'food' ? 'อาหาร' : id);

  it('starts with a BOM and a Thai header', () => {
    const csv = toCsv([], name);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1).split('\r\n')[0]).toBe('วันที่,ประเภท,จำนวนเงิน,ค่าธรรมเนียม,หมวดหมู่,ผู้รับ/ผู้โอน,โน้ต,ช่องทาง,ธนาคาร,เลขที่รายการ');
  });

  it('writes baht with satang, local time and Thai labels', () => {
    const row = toCsv([tx({ amount: 18950, fee: 500, counterparty: 'LINE MAN', method: 'cash', bank: 'kbank', ref: 'R1' })], name).split('\r\n')[1];
    expect(row).toBe('2026-10-23 14:32,รายจ่าย,189.50,5.00,อาหาร,LINE MAN,,เงินสด,kbank,R1');
  });

  it('quotes commas, quotes and newlines', () => {
    const row = toCsv([tx({ note: 'ข้าว, น้ำ "เย็น"\nสองแก้ว' })], name).split('\r\n').slice(1).join('\r\n');
    expect(row).toContain('"ข้าว, น้ำ ""เย็น""\nสองแก้ว"');
  });

  it('sorts oldest first', () => {
    const csv = toCsv([tx({ amount: 200, occurredAt: 2000 }), tx({ amount: 100, occurredAt: 1000 })], name);
    const amounts = csv.trim().split('\r\n').slice(1).map((l) => l.split(',')[2]);
    expect(amounts).toEqual(['1.00', '2.00']);
  });
});

describe('fileStamp', () => {
  it('dates the file name', () => {
    expect(fileStamp('jotgun', new Date(2026, 9, 3).getTime())).toBe('jotgun-2026-10-03');
  });
});
