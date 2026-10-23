import type { BankCode } from '../db/types';

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
