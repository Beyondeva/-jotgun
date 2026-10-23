import type { CategoryIconKey } from '../design/icons';
import type { CatColor } from '../design/palette';

export type TxType = 'expense' | 'income';
export type PayMethod = 'transfer' | 'cash' | 'credit';
export type BankCode = 'kbank' | 'scb' | 'ktb' | 'bbl' | 'bay' | 'ttb' | 'gsb' | 'other';

export interface Transaction {
  id: string;
  type: TxType;
  /** satang */
  amount: number;
  /** satang */
  fee: number;
  categoryId: string;
  occurredAt: number;
  counterparty?: string;
  note?: string;
  method: PayMethod;
  source: 'slip' | 'manual';
  bank?: BankCode;
  ref?: string;
  slipId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SlipFields {
  amount?: number;
  fee?: number;
  occurredAt?: number;
  sender?: string;
  receiver?: string;
  bank?: BankCode;
  ref?: string;
}

export interface Slip {
  id: string;
  status: 'queued' | 'reading' | 'pending' | 'confirmed' | 'error';
  image: Blob;
  thumb: Blob;
  qrPayload?: string;
  ocrText?: string;
  parsed: SlipFields;
  /** 0–1 per field; below CONFIDENCE_MIN the field is highlighted for review */
  confidence: Partial<Record<keyof SlipFields, number>>;
  suggestedType: TxType;
  suggestedCategoryId?: string;
  /** the user chose suggestedCategoryId themselves; edits to the slip won't re-guess it */
  categoryPicked?: boolean;
  dedupeKey?: string;
  /** id of an earlier slip or transaction with the same reference */
  duplicateOf?: string;
  /** the transaction this slip became */
  confirmedTxId?: string;
  createdAt: number;
}

export const CONFIDENCE_MIN = 0.7;

export interface Category {
  id: string;
  name: string;
  icon: CategoryIconKey;
  color: CatColor;
  kind: TxType | 'both';
  order: number;
  archived?: boolean;
}

export interface Rule {
  id: string;
  keyword: string;
  categoryId: string;
  builtin: boolean;
}

export interface PayeeMemory {
  /** normalized counterparty name */
  key: string;
  categoryId: string;
  count: number;
  updatedAt: number;
}

export interface Budget {
  categoryId: string;
  /** satang per month */
  monthlyLimit: number;
}

export interface Setting<T = unknown> {
  key: string;
  value: T;
}
