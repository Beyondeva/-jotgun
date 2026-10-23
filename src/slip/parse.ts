import type { Slip, SlipFields } from '../db/types';
import { BANKS, DEFAULT_LABELS, detectBank, profileOf, type Labels } from './banks';
import { cleanName, findDateTime, findRef, isNoise, looksLikePerson, parseMoney, REF, valueAfter } from './fields';
import type { SlipQr } from './qr';
import { normalizeOcr, toLines } from './text';

export interface ParsedSlip {
  parsed: SlipFields;
  confidence: Slip['confidence'];
}

/** How sure we are, per way of finding a value. Below 0.7 the field is highlighted. */
const SURE = 0.92;
const LAYOUT = 0.78;
const GUESS = 0.55;
/** a name we had to scrape junk off */
const NOISY = 0.62;

const merge = (base: Labels, extra?: Partial<Labels>): Labels => ({
  amount: [...(extra?.amount ?? []), ...base.amount],
  fee: [...(extra?.fee ?? []), ...base.fee],
  ref: [...(extra?.ref ?? []), ...base.ref],
  from: [...(extra?.from ?? []), ...base.from],
  to: [...(extra?.to ?? []), ...base.to],
});

/** A short line naming a bank ("K+", "SCB") is a logo or header, not a person. */
const isBankLabel = (v: string) => v.length < 24 && BANKS.some((b) => b.detect.test(v));

/** Usable as a name once the OCR junk around it is removed. */
const isName = (v: string) => {
  const n = cleanName(v);
  return !!n && !isNoise(n.name) && !isBankLabel(n.name) && !(REF.test(n.name) && !/[ก-๙ ]/.test(n.name));
};

/** Turn OCR text (plus the slip QR, if read) into slip fields with a confidence for each. */
export function parseSlip(rawText: string, qr?: SlipQr): ParsedSlip {
  const text = normalizeOcr(rawText);
  const lines = toLines(text);
  const profile = (qr?.bank && profileOf(qr.bank)) || detectBank(text);
  const labels = merge(DEFAULT_LABELS, profile?.labels);
  const parsed: SlipFields = { bank: qr?.bank ?? profile?.code ?? 'other' };
  const confidence: Slip['confidence'] = {};

  // amount: labelled value, then a "บาท" line, then the largest money figure
  const labelled = valueAfter(lines, labels.amount, (v) => parseMoney(v) !== undefined);
  if (labelled) {
    parsed.amount = parseMoney(labelled.value);
    confidence.amount = SURE;
  } else {
    const bahtLine = lines.find((l) => /บาท|THB|฿/.test(l) && parseMoney(l) !== undefined && !/ค่าธรรมเนียม|fee/i.test(l));
    if (bahtLine) {
      parsed.amount = parseMoney(bahtLine);
      confidence.amount = LAYOUT;
    } else {
      const all = lines.map(parseMoney).filter((v): v is number => v !== undefined && v > 0);
      if (all.length) {
        parsed.amount = Math.max(...all);
        confidence.amount = GUESS;
      }
    }
  }

  const fee = valueAfter(lines, labels.fee, (v) => parseMoney(v) !== undefined);
  if (fee) {
    parsed.fee = parseMoney(fee.value);
    confidence.fee = SURE;
  }

  const date = findDateTime(lines);
  if (date) {
    parsed.occurredAt = date.value;
    confidence.occurredAt = date.hasTime ? SURE : GUESS;
  }

  if (qr?.ref) {
    parsed.ref = qr.ref;
    confidence.ref = 1;
  } else {
    const ref = findRef(lines, labels.ref);
    if (ref) {
      parsed.ref = ref;
      confidence.ref = SURE;
    }
  }

  // names: labelled first; K PLUS style lists them in order after the date
  const from = valueAfter(lines, labels.from, isName);
  const to = valueAfter(lines, labels.to, isName);
  const setName = (field: 'sender' | 'receiver', line: string, conf: number) => {
    const n = cleanName(line)!;
    parsed[field] = n.name;
    confidence[field] = n.noisy ? Math.min(conf, NOISY) : conf;
  };
  if (from) setName('sender', from.value, SURE);
  if (to) setName('receiver', to.value, SURE);

  if (!from || !to) {
    const stop = lines.findIndex((l) => [...labels.amount, ...labels.ref, ...labels.fee].some((lab) => l.toUpperCase().startsWith(lab.toUpperCase())));
    const start = date ? date.index + 1 : 0;
    const candidates = lines.slice(start, stop > start ? stop : undefined).filter(isName);
    const conf = profile?.unlabeledNames ? LAYOUT : GUESS;
    const titled = (l: string) => looksLikePerson(cleanName(l)!.name);
    // the sender is the first name, preferably one with a title; the receiver comes after it
    const senderAt = from ? -1 : Math.max(0, candidates.findIndex(titled));
    if (!from && candidates.length) setName('sender', candidates[senderAt], conf);
    if (!to) {
      const rest = candidates.slice(senderAt + 1);
      const receiverLine = rest.find(titled) ?? rest[0];
      if (receiverLine) setName('receiver', receiverLine, conf);
    }
  }

  return { parsed, confidence };
}
