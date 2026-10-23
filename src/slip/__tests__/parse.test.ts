import { describe, expect, it } from 'vitest';
import { CONFIDENCE_MIN } from '../../db/types';
import { detectBank } from '../banks';
import { findDateTime, parseMoney } from '../fields';
import { parseSlip } from '../parse';
import { parseSlipQr, parseTlv } from '../qr';
import { BAY, BBL, GSB, KBANK, KBANK_ART_OCR_REAL, KBANK_OCR_REAL, KTB, SCB, SCB_OCR_REAL, TTB, UNKNOWN } from './fixtures';

const at = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m - 1, d, h, min).getTime();

describe('parseMoney', () => {
  it('reads the common formats', () => {
    expect(parseMoney('1,234.00 บาท')).toBe(123400);
    expect(parseMoney('฿1,234.50')).toBe(123450);
    expect(parseMoney('THB 1234.05')).toBe(123405);
    expect(parseMoney('จำนวนเงิน 47.00')).toBe(4700);
    expect(parseMoney('฿ 890.00')).toBe(89000);
  });
  it('ignores numbers without satang', () => {
    expect(parseMoney('xxx-x-x1234-x')).toBeUndefined();
    expect(parseMoney('2569')).toBeUndefined();
  });
});

describe('findDateTime', () => {
  it('reads Thai dates with two- and four-digit Buddhist years', () => {
    expect(findDateTime(['23 ต.ค. 69 14:32 น.'])?.value).toBe(at(2026, 10, 23, 14, 32));
    expect(findDateTime(['23 ต.ค. 2569 - 08:21'])?.value).toBe(at(2026, 10, 23, 8, 21));
    expect(findDateTime(['1 มกราคม 2570 00:05'])?.value).toBe(at(2027, 1, 1, 0, 5));
  });
  it('tolerates OCR dropping the dots in the month', () => {
    expect(findDateTime(['23 ตค 69 14:32'])?.value).toBe(at(2026, 10, 23, 14, 32));
  });
  it('reads English months as Common Era', () => {
    expect(findDateTime(['22 Oct 2026, 10:05'])?.value).toBe(at(2026, 10, 22, 10, 5));
  });
  it('reads numeric dates', () => {
    expect(findDateTime(['21/10/2569 21:12'])?.value).toBe(at(2026, 10, 21, 21, 12));
  });
  it('takes the time from the next line when needed', () => {
    expect(findDateTime(['23 ต.ค. 69', '14:32'])?.value).toBe(at(2026, 10, 23, 14, 32));
  });
});

describe('detectBank', () => {
  it('picks the issuing bank, not the recipient bank further down', () => {
    expect(detectBank(KBANK)?.code).toBe('kbank');
    expect(detectBank(KTB)?.code).toBe('ktb');
    expect(detectBank('SCB\nโอนเงินสำเร็จ\nไปยัง\nธ.กสิกรไทย')?.code).toBe('scb');
  });
});

describe('parseSlip per bank', () => {
  const cases = [
    { name: 'K PLUS', text: KBANK, bank: 'kbank', amount: 18900, fee: 0, when: at(2026, 10, 23, 14, 32), ref: '015296121834BTF07211', sender: 'นาย สมชาย ใ', receiver: 'LINE MAN Wongnai' },
    { name: 'SCB', text: SCB, bank: 'scb', amount: 4700, when: at(2026, 10, 23, 8, 21), ref: '202610230821SCB44918', sender: 'นาย สมชาย ใจดี', receiver: 'BTS สยาม' },
    { name: 'Krungthai', text: KTB, bank: 'ktb', amount: 35000, fee: 0, when: at(2026, 10, 22, 17, 46), ref: 'KTB2610221746009312', sender: 'นาย สมชาย ใจดี', receiver: 'นาย ขวัญ ช่างตัดผม' },
    { name: 'Bangkok Bank', text: BBL, bank: 'bbl', amount: 124900, fee: 0, when: at(2026, 10, 22, 10, 5), ref: 'BBL0221005M118347', sender: 'MR. SOMCHAI JAIDEE', receiver: 'การไฟฟ้านครหลวง' },
    { name: 'Krungsri', text: BAY, bank: 'bay', amount: 89000, when: at(2026, 10, 21, 21, 12), ref: 'BAY20261021211200077', sender: 'น.ส. มะปราง หวานใจ', receiver: 'SHOPEE' },
    { name: 'ttb', text: TTB, bank: 'ttb', amount: 6500, when: at(2026, 10, 20, 12, 0), ref: '20261020120000TTB1', sender: 'นาย สมชาย ใจดี', receiver: 'ร้านกาแฟหน้าออฟฟิศ' },
    { name: 'GSB (Thai digits)', text: GSB, bank: 'gsb', amount: 50000, when: at(2026, 10, 19, 9, 15), ref: 'GSB9912000123', sender: 'นาง สมศรี ใจดี', receiver: 'นาย สมชาย ใจดี' },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const { parsed, confidence } = parseSlip(c.text);
      expect(parsed.bank).toBe(c.bank);
      expect(parsed.amount).toBe(c.amount);
      if (c.fee !== undefined) expect(parsed.fee).toBe(c.fee);
      expect(parsed.occurredAt).toBe(c.when);
      expect(parsed.ref).toBe(c.ref);
      expect(parsed.sender).toBe(c.sender);
      expect(parsed.receiver).toBe(c.receiver);
      // a cleanly laid-out slip should need no highlighting
      for (const k of ['amount', 'occurredAt', 'receiver'] as const) expect(confidence[k]).toBeGreaterThanOrEqual(CONFIDENCE_MIN);
    });
  }

  it('still gets amount and date from an unknown layout, but flags the guessed name', () => {
    const { parsed, confidence } = parseSlip(UNKNOWN);
    expect(parsed.bank).toBe('other');
    expect(parsed.amount).toBe(105000);
    expect(parsed.occurredAt).toBe(at(2026, 10, 18, 19, 40));
    expect(parsed.receiver ?? parsed.sender).toBe('ร้านป้าแดง ข้าวแกง');
    expect(confidence.receiver ?? confidence.sender ?? 0).toBeLessThan(CONFIDENCE_MIN);
  });

  it('returns nothing it cannot find instead of inventing values', () => {
    const { parsed } = parseSlip('รูปแมว\nไม่ใช่สลิป');
    expect(parsed.amount).toBeUndefined();
    expect(parsed.occurredAt).toBeUndefined();
    expect(parsed.ref).toBeUndefined();
  });
});

describe('real OCR output', () => {
  it('K PLUS', () => {
    const { parsed } = parseSlip(KBANK_OCR_REAL);
    expect(parsed).toMatchObject({ bank: 'kbank', amount: 18900, fee: 0, occurredAt: at(2026, 10, 23, 14, 32), sender: 'นาย สมชาย ใ', receiver: 'LINE MAN Wongnai' });
  });

  it('K PLUS with cartoon artwork: names scraped clean but flagged for review', () => {
    const { parsed, confidence } = parseSlip(KBANK_ART_OCR_REAL);
    expect(parsed).toMatchObject({
      bank: 'kbank',
      amount: 2000,
      fee: 0,
      occurredAt: at(2026, 10, 15, 21, 57),
      ref: '012345678901AOR01234',
      sender: 'นาย สมชาย ใ',
      receiver: 'นาย มานะ ใจกว้างบ', // the trailing "บ" is artwork read as a letter
    });
    expect(confidence.receiver).toBeLessThan(CONFIDENCE_MIN);
  });

  it('SCB with a misread logo and a stray vowel in the date', () => {
    const { parsed } = parseSlip(SCB_OCR_REAL);
    expect(parsed).toMatchObject({ bank: 'scb', amount: 4700, occurredAt: at(2026, 10, 23, 8, 21), sender: 'นาย สมชาย ใจดี', receiver: 'BTS สยาม' });
  });
});

describe('slip QR', () => {
  // 00(46: 00 api "000001", 01 bank "004", 02 ref) 51 "TH" 91 crc
  const inner = '0006000001' + '0103004' + '0222015296121834BTF07211XX';
  const payload = `00${String(inner.length).padStart(2, '0')}${inner}5102TH91041A2B`;

  it('parses TLV', () => {
    expect(parseTlv('0102AB0203XYZ')).toEqual(new Map([['01', 'AB'], ['02', 'XYZ']]));
  });

  it('reads bank and reference', () => {
    expect(parseSlipQr(payload)).toEqual({ bank: 'kbank', ref: '015296121834BTF07211XX' });
  });

  it('rejects other QR codes', () => {
    expect(parseSlipQr('https://example.com')).toBeUndefined();
    expect(parseSlipQr('000201010211')).toBeUndefined();
  });

  it('QR data wins over OCR text', () => {
    const { parsed, confidence } = parseSlip(KBANK, { bank: 'kbank', ref: 'FROMQR123456' });
    expect(parsed.ref).toBe('FROMQR123456');
    expect(confidence.ref).toBe(1);
  });
});

describe('cleanName', () => {
  it('starts at the title and drops logo junk', async () => {
    const { cleanName } = await import('../fields');
    expect(cleanName(', นาย สมชาย ใ')).toEqual({ name: 'นาย สมชาย ใ', noisy: true });
    expect(cleanName('@  นาย มานะ ใจกว้าง ” .')).toEqual({ name: 'นาย มานะ ใจกว้าง', noisy: true });
    expect(cleanName('MR. SOMCHAI JAIDEE')).toEqual({ name: 'MR. SOMCHAI JAIDEE', noisy: false });
    expect(cleanName('BTS สยาม')).toEqual({ name: 'BTS สยาม', noisy: false });
  });
  it('rejects junk lines', async () => {
    const { cleanName } = await import('../fields');
    expect(cleanName('p 3  Bo')).toBeUndefined();
    expect(cleanName('Ix')).toBeUndefined();
    expect(cleanName('๑')).toBeUndefined();
  });
});
