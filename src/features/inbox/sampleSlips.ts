import { getOwnerNames } from '../../db/settings';
import { ingestSlip } from '../../db/slips';
import type { BankCode, SlipFields } from '../../db/types';

/**
 * Development helper: fills the queue with made-up slips so the inbox can be
 * tried before OCR exists. The images are simple drawings, not real bank slips.
 */

const TINT: Record<BankCode, string> = {
  kbank: '#4c7a45',
  scb: '#844e86',
  ktb: '#3f78a6',
  bbl: '#4f55a0',
  bay: '#b8861b',
  ttb: '#2d7672',
  gsb: '#b4526e',
  other: '#9c7a4c',
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

function drawSlip(f: SlipFields): Blob {
  const amount = f.amount ? `${(f.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
  <rect width="360" height="520" fill="#ffffff"/>
  <rect width="360" height="72" fill="${TINT[f.bank ?? 'other']}"/>
  <circle cx="180" cy="128" r="22" fill="${TINT[f.bank ?? 'other']}" opacity=".25"/>
  <text x="180" y="190" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#6b6157">ตัวอย่างสลิป</text>
  <text x="180" y="250" font-family="sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="#1f1b17">${amount}</text>
  <text x="32" y="320" font-family="sans-serif" font-size="16" fill="#6b6157">ไปยัง</text>
  <text x="32" y="346" font-family="sans-serif" font-size="18" fill="#1f1b17">${esc(f.receiver ?? '')}</text>
  <text x="32" y="400" font-family="monospace" font-size="13" fill="#a1968a">${esc(f.ref ?? '')}</text>
  <rect x="270" y="420" width="64" height="64" fill="none" stroke="#c4b8a3" stroke-width="6" stroke-dasharray="8 6"/>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

const minutesAgo = (m: number) => Date.now() - m * 60_000;

export async function addSampleSlips(): Promise<void> {
  const owner = (await getOwnerNames())[0] ?? 'นาย เจ้าของ บัญชี';
  const salt = Date.now().toString(36).slice(-4).toUpperCase();
  const samples: { parsed: SlipFields; confidence?: Partial<Record<keyof SlipFields, number>> }[] = [
    { parsed: { bank: 'kbank', amount: 18900, receiver: 'LINE MAN ข้าวมันไก่', sender: owner, occurredAt: minutesAgo(35), ref: `015296121834${salt}` } },
    { parsed: { bank: 'scb', amount: 4700, receiver: 'BTS สยาม', sender: owner, occurredAt: minutesAgo(200), ref: `2026102308${salt}` } },
    {
      parsed: { bank: 'ktb', amount: 35000, receiver: 'นาย ขวัญ ร้านตัดผม', sender: owner, occurredAt: minutesAgo(60 * 20), ref: `KTB26102217${salt}` },
      confidence: { receiver: 0.52 },
    },
    {
      parsed: { bank: 'bbl', amount: 124900, receiver: 'การไฟฟ้านครหลวง', sender: owner, occurredAt: minutesAgo(60 * 26), ref: `BBL0221005M${salt}` },
      confidence: { amount: 0.6 },
    },
    { parsed: { bank: 'gsb', amount: 50000, receiver: owner, sender: 'นางสาว มะปราง หวานใจ', occurredAt: minutesAgo(60 * 30), ref: `GSB99120${salt}` } },
  ];
  // the first one again, as if the same slip was picked twice
  samples.push({ parsed: { ...samples[0].parsed } });

  for (const s of samples) {
    const image = drawSlip(s.parsed);
    await ingestSlip({ image, thumb: image, parsed: s.parsed, confidence: s.confidence });
  }
}
