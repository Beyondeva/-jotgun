import type { BankCode } from '../db/types';

/**
 * Per-bank knowledge: how to recognise the bank's slip and which labels it prints.
 * Layouts change with app updates, so these are lists to extend as real slips turn up.
 */
export interface BankProfile {
  code: BankCode;
  /** text that identifies the issuing bank; the earliest match in the slip wins */
  detect: RegExp;
  labels?: Partial<Labels>;
  /** the slip lists sender and receiver without "จาก/ไปยัง" labels (K PLUS style) */
  unlabeledNames?: boolean;
}

export interface Labels {
  amount: string[];
  fee: string[];
  ref: string[];
  from: string[];
  to: string[];
}

export const DEFAULT_LABELS: Labels = {
  amount: ['จำนวนเงิน', 'ยอดเงิน', 'ยอดโอน', 'จำนวน', 'Amount'],
  fee: ['ค่าธรรมเนียม', 'Fee'],
  ref: ['เลขที่รายการ', 'รหัสอ้างอิง', 'เลขที่อ้างอิง', 'หมายเลขอ้างอิง', 'รหัสรายการ', 'Ref. No', 'Ref No', 'Reference No', 'Reference', 'Transaction ID', 'Transaction No', 'Ref'],
  from: ['จาก', 'ผู้โอน', 'From'],
  to: ['ไปยัง', 'ไปที่', 'ผู้รับ', 'ถึง', 'To'],
};

export const BANKS: BankProfile[] = [
  {
    code: 'kbank',
    detect: /K\s?\+|K\s?PLUS|กสิกร|KASIKORN|KBANK/i,
    unlabeledNames: true,
    labels: { amount: ['จำนวน', 'Amount'], ref: ['เลขที่รายการ', 'Transaction ID'] },
  },
  {
    code: 'scb',
    // OCR often reads the SCB logo as "5C8" / "568" on a line of its own
    detect: /\bSCB\b|^[S5][C6][B8]$|ไทยพาณิชย์|SIAM COMMERCIAL|SCB EASY/im,
    labels: { ref: ['รหัสอ้างอิง', 'Ref. ID', 'Ref ID', 'Reference ID'] },
  },
  {
    code: 'ktb',
    detect: /กรุงไทย|KRUNG\s?THAI|KTB/i,
    labels: { ref: ['รหัสอ้างอิง', 'เลขที่รายการ', 'Reference No'] },
  },
  {
    code: 'bbl',
    detect: /BANGKOK BANK|บัวหลวง|BUALUANG|ธนาคารกรุงเทพ|\bBBL\b/i,
    labels: { ref: ['หมายเลขอ้างอิง', 'เลขที่อ้างอิง', 'Reference No'], to: ['ไปที่', 'ไปยัง', 'ผู้รับ', 'To'] },
  },
  {
    code: 'bay',
    detect: /กรุงศรี|KRUNGSRI|\bKMA\b/i,
    labels: { ref: ['เลขที่อ้างอิง', 'รหัสอ้างอิง', 'Reference No'] },
  },
  {
    code: 'ttb',
    detect: /\bttb\b|ทีทีบี|ทหารไทยธนชาต|TMBTHANACHART/i,
    labels: { ref: ['รหัสอ้างอิง', 'เลขที่รายการ', 'Ref No'] },
  },
  {
    code: 'gsb',
    detect: /ออมสิน|\bMyMo\b|\bGSB\b/i,
    labels: { ref: ['เลขที่อ้างอิง', 'รหัสอ้างอิง', 'Ref No'] },
  },
];

/** The issuing bank is the one named first (the recipient's bank appears further down). */
export function detectBank(text: string): BankProfile | undefined {
  let best: { profile: BankProfile; at: number } | undefined;
  for (const profile of BANKS) {
    const m = profile.detect.exec(text);
    if (m && (!best || m.index < best.at)) best = { profile, at: m.index };
  }
  return best?.profile;
}

export const profileOf = (code: BankCode | undefined) => BANKS.find((b) => b.code === code);
