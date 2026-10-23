import type { BankCode } from '../db/types';

/**
 * Thai bank slips carry a small "slip verification" QR: EMV-style TLV data
 * (two-digit tag, two-digit length, value). Tag 00 nests the useful bits:
 *   00 → API id, 01 → sending bank code, 02 → transaction reference.
 * Tag 51 is the country ("TH") and 91 the CRC.
 */

export function parseTlv(payload: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || Number.isNaN(len) || i + 4 + len > payload.length) break;
    out.set(tag, payload.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return out;
}

/** Bank of Thailand institution codes. */
const BANK_BY_CODE: Record<string, BankCode> = {
  '002': 'bbl',
  '004': 'kbank',
  '006': 'ktb',
  '011': 'ttb',
  '014': 'scb',
  '025': 'bay',
  '030': 'gsb',
};

export interface SlipQr {
  bank?: BankCode;
  ref?: string;
}

/** Read bank and reference from a slip QR; undefined when the payload isn't one. */
export function parseSlipQr(payload: string): SlipQr | undefined {
  const top = parseTlv(payload.trim());
  const inner = top.get('00');
  if (!inner || top.get('51') !== 'TH') return undefined;
  const sub = parseTlv(inner);
  const code = sub.get('01');
  return {
    bank: code ? (BANK_BY_CODE[code] ?? 'other') : undefined,
    ref: sub.get('02')?.toUpperCase(),
  };
}
