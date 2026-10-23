import { DEFAULT_CATEGORIES } from '../../db/seed';
import type { BankCode, Category, Transaction } from '../../db/types';
import { startOfDay } from '../../lib/date';

export const catById = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, c])) as Record<string, Category>;
export const expenseCats = DEFAULT_CATEGORIES.filter((c) => c.kind !== 'income');

const now = Date.now();
const today = startOfDay(now);
const at = (daysAgo: number, h: number, m: number) => today - daysAgo * 86_400_000 + (h * 60 + m) * 60_000;

let seq = 0;
const tx = (p: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'categoryId' | 'occurredAt'>): Transaction => ({
  id: `mock-${seq++}`,
  fee: 0,
  method: 'transfer',
  source: 'slip',
  createdAt: p.occurredAt,
  updatedAt: p.occurredAt,
  ...p,
});

export const MOCK_TX: Transaction[] = [
  tx({ type: 'expense', amount: 18900, categoryId: 'food', occurredAt: at(0, 12, 18), counterparty: 'LINE MAN ข้าวมันไก่' }),
  tx({ type: 'expense', amount: 6500, categoryId: 'cafe', occurredAt: at(0, 9, 2), counterparty: 'ร้านกาแฟหน้าออฟฟิศ', method: 'cash', source: 'manual' }),
  tx({ type: 'expense', amount: 4700, categoryId: 'travel', occurredAt: at(0, 8, 21), counterparty: 'BTS สยาม' }),
  tx({ type: 'income', amount: 50000, categoryId: 'transfer-in', occurredAt: at(1, 19, 40), counterparty: 'มะปราง คืนค่าหนัง' }),
  tx({ type: 'expense', amount: 124900, categoryId: 'bills', occurredAt: at(1, 10, 5), counterparty: 'การไฟฟ้านครหลวง' }),
  tx({ type: 'expense', amount: 89000, categoryId: 'shopping', occurredAt: at(2, 21, 12), counterparty: 'SHOPEE', method: 'credit' }),
  tx({ type: 'income', amount: 3250000, categoryId: 'salary', occurredAt: at(3, 9, 0), counterparty: 'บริษัท ตัวอย่าง จำกัด' }),
];

export const MONTH = {
  income: 3300000,
  expense: 1462550,
  byCategory: [
    { id: 'food', value: 485000 },
    { id: 'home', value: 450000 },
    { id: 'bills', value: 184900 },
    { id: 'shopping', value: 162300 },
    { id: 'travel', value: 98250 },
    { id: 'cafe', value: 52100 },
    { id: 'fun', value: 30000 },
  ].map((s) => ({ ...s, name: catById[s.id].name, color: catById[s.id].color })),
};

export const BUDGETS: Record<string, number> = { food: 600000, shopping: 150000, cafe: 80000 };

export const WEEK_BARS = [
  { label: 'ศ.', value: 42000 },
  { label: 'ส.', value: 128000 },
  { label: 'อา.', value: 86000 },
  { label: 'จ.', value: 31000 },
  { label: 'อ.', value: 89000 },
  { label: 'พ.', value: 137600 },
  { label: 'พฤ.', value: 30100, highlight: true },
];

export interface MockSlip {
  id: string;
  bank: BankCode;
  amount: number;
  receiver: string;
  occurredAt: number;
  suggestedCategoryId: string;
  refNo: string;
  lowConfidence?: ('amount' | 'receiver' | 'occurredAt')[];
  duplicate?: boolean;
}

export const MOCK_SLIPS: MockSlip[] = [
  { id: 's1', bank: 'kbank', amount: 18900, receiver: 'LINE MAN ข้าวมันไก่', occurredAt: at(0, 12, 18), suggestedCategoryId: 'food', refNo: '015296121834BTF07211' },
  { id: 's2', bank: 'scb', amount: 4700, receiver: 'BTS สยาม', occurredAt: at(0, 8, 21), suggestedCategoryId: 'travel', refNo: '202610230821SCB44918' },
  { id: 's3', bank: 'ktb', amount: 35000, receiver: 'นาย ข ร้านตัดผม', occurredAt: at(1, 17, 46), suggestedCategoryId: 'other', refNo: 'KTB2610221746009312', lowConfidence: ['receiver'] },
  { id: 's4', bank: 'bbl', amount: 124900, receiver: 'การไฟฟ้านครหลวง', occurredAt: at(1, 10, 5), suggestedCategoryId: 'bills', refNo: 'BBL0221005M118347', lowConfidence: ['amount'] },
];

export const BANK_NAME: Record<BankCode, string> = {
  kbank: 'กสิกรไทย',
  scb: 'ไทยพาณิชย์',
  ktb: 'กรุงไทย',
  bbl: 'กรุงเทพ',
  bay: 'กรุงศรี',
  ttb: 'ทีทีบี',
  gsb: 'ออมสิน',
  other: 'ธนาคารอื่น',
};

/** Neutral tints for slip thumbnails; not the banks' brand marks. */
export const BANK_TINT: Record<BankCode, string> = {
  kbank: 'var(--cat-moss)',
  scb: 'var(--cat-plum)',
  ktb: 'var(--cat-sky)',
  bbl: 'var(--cat-indigo)',
  bay: 'var(--cat-ochre)',
  ttb: 'var(--cat-teal)',
  gsb: 'var(--cat-rose)',
  other: 'var(--cat-sand)',
};
