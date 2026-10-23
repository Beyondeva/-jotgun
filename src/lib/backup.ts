import type { Budget, Category, PayeeMemory, Rule, Setting, Transaction } from '../db/types';

/** A full backup of everything except slip images (those stay on the device). */
export interface Backup {
  app: 'jotgun';
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  rules: Rule[];
  payeeMemory: PayeeMemory[];
  budgets: Budget[];
  settings: Setting[];
}

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Check a parsed JSON file before restoring it. Returns a Thai reason when it isn't usable. */
export function validateBackup(data: unknown): { ok: true; backup: Backup } | { ok: false; reason: string } {
  if (!isObj(data) || data.app !== 'jotgun') return { ok: false, reason: 'ไม่ใช่ไฟล์สำรองของจดกัน' };
  if (data.version !== 1) return { ok: false, reason: `ไฟล์เวอร์ชัน ${String(data.version)} ยังไม่รองรับ` };
  for (const key of ['transactions', 'categories', 'rules', 'payeeMemory', 'budgets', 'settings'] as const) {
    if (!isArr(data[key])) return { ok: false, reason: `ไฟล์ไม่ครบ (ไม่มี ${key})` };
  }
  const txs = data.transactions as unknown[];
  const bad = txs.findIndex(
    (t) => !isObj(t) || typeof t.id !== 'string' || typeof t.amount !== 'number' || typeof t.occurredAt !== 'number' || (t.type !== 'expense' && t.type !== 'income'),
  );
  if (bad >= 0) return { ok: false, reason: `รายการที่ ${bad + 1} ข้อมูลไม่ถูกต้อง` };
  if (!(data.categories as unknown[]).length) return { ok: false, reason: 'ไฟล์ไม่มีหมวดหมู่' };
  return { ok: true, backup: data as unknown as Backup };
}

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const cell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const baht = (satang: number) => (satang / 100).toFixed(2);

const METHOD: Record<Transaction['method'], string> = { transfer: 'โอน', cash: 'เงินสด', credit: 'บัตรเครดิต' };

/**
 * Transactions as CSV for Excel / Google Sheets. Starts with a BOM so Excel
 * reads the Thai text as UTF-8; dates are local time in ISO-like form so they sort.
 */
export function toCsv(txs: Transaction[], categoryName: (id: string) => string): string {
  const header = ['วันที่', 'ประเภท', 'จำนวนเงิน', 'ค่าธรรมเนียม', 'หมวดหมู่', 'ผู้รับ/ผู้โอน', 'โน้ต', 'ช่องทาง', 'ธนาคาร', 'เลขที่รายการ'];
  const rows = [...txs]
    .sort((a, b) => a.occurredAt - b.occurredAt)
    .map((t) =>
      [
        stamp(t.occurredAt),
        t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        baht(t.amount),
        baht(t.fee),
        categoryName(t.categoryId),
        t.counterparty,
        t.note,
        METHOD[t.method],
        t.bank,
        t.ref,
      ]
        .map(cell)
        .join(','),
    );
  return '﻿' + [header.join(','), ...rows].join('\r\n') + '\r\n';
}

/** "jotgun-2026-10-23" */
export const fileStamp = (prefix: string, ts = Date.now()) => {
  const d = new Date(ts);
  return `${prefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
