/** Field extractors shared by every bank's parser. All money values are satang. */

// ---------- amounts ----------

const MONEY = /(?:฿|THB|B)?\s*(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(?!\d)/;

/** "1,234.00 บาท", "฿1,234.00", "THB 1234.00" → 123400 */
export function parseMoney(s: string): number | undefined {
  const m = s.replace(/\s+(?=[\d,]*\.\d{2})/g, '').match(MONEY) ?? s.match(MONEY);
  if (!m) return undefined;
  return Number(m[1].replace(/,/g, '')) * 100 + Number(m[2]);
}

// ---------- labels ----------

/**
 * Value for a label: the rest of the label's line if it holds something,
 * otherwise the next line. Labels match at the start of a line, case-insensitively.
 */
export function valueAfter(lines: string[], labels: string[], accept: (v: string) => boolean = (v) => v.length > 0): { value: string; index: number } | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();
    for (const label of labels) {
      if (!upper.startsWith(label.toUpperCase())) continue;
      const rest = line.slice(label.length).replace(/^[\s:：.\-]+/, '').trim();
      if (rest && accept(rest)) return { value: rest, index: i };
      for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
        if (accept(lines[j])) return { value: lines[j], index: j };
      }
    }
  }
  return undefined;
}

// ---------- dates ----------

const TH_MONTHS: Record<string, number> = {
  มค: 1, มกราคม: 1, กพ: 2, กุมภาพันธ์: 2, มีค: 3, มีนาคม: 3, เมย: 4, เมษายน: 4, พค: 5, พฤษภาคม: 5, มิย: 6, มิถุนายน: 6,
  กค: 7, กรกฎาคม: 7, สค: 8, สิงหาคม: 8, กย: 9, กันยายน: 9, ตค: 10, ตุลาคม: 10, พย: 11, พฤศจิกายน: 11, ธค: 12, ธันวาคม: 12,
};
const EN_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const DATE_TEXT = /(\d{1,2})\s*([ก-๙A-Za-z][ก-๙A-Za-z.\s]{1,12}?)\s*(\d{4}|\d{2})(?!\d)/;
const DATE_NUM = /(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})(?!\d)/;
const TIME = /(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*(\d{2}))?/;

/** Thai vowel and tone marks that sit above or below a consonant. */
const THAI_MARK = /[ัิ-ฺ็-๎]/g;

function monthOf(token: string): { month: number; thai: boolean } | undefined {
  const t = token.replace(/[.\s]/g, '');
  if (TH_MONTHS[t]) return { month: TH_MONTHS[t], thai: true };
  // OCR sometimes adds a stray vowel mark ("ต.ุค."): retry without one mark at a time
  for (const m of t.matchAll(THAI_MARK)) {
    const k = t.slice(0, m.index) + t.slice(m.index! + 1);
    if (TH_MONTHS[k]) return { month: TH_MONTHS[k], thai: true };
  }
  const en = EN_MONTHS.indexOf(t.slice(0, 3).toUpperCase());
  if (en >= 0) return { month: en + 1, thai: false };
  return undefined;
}

/** Thai slips print Buddhist-era years, often as two digits ("69" = 2569 = 2026). */
function toCE(year: string, thai: boolean): number {
  const y = Number(year);
  if (year.length === 4) return y > 2400 ? y - 543 : y;
  return thai ? 2500 + y - 543 : 2000 + y;
}

export interface FoundDate {
  /** epoch ms, local time */
  value: number;
  index: number;
  hasTime: boolean;
}

/** First date (and the time on the same or next line) in the text. */
export function findDateTime(lines: string[]): FoundDate | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let day: number | undefined;
    let month: number | undefined;
    let year: number | undefined;
    let rest = line;

    const t = line.match(DATE_TEXT);
    const mo = t && monthOf(t[2]);
    if (t && mo) {
      day = Number(t[1]);
      month = mo.month;
      year = toCE(t[3], mo.thai);
      rest = line.slice((t.index ?? 0) + t[0].length);
    } else {
      const n = line.match(DATE_NUM);
      if (n) {
        day = Number(n[1]);
        month = Number(n[2]);
        year = toCE(n[3], Number(n[3]) > 2400 || (n[3].length === 2 && Number(n[3]) > 40));
        rest = line.slice((n.index ?? 0) + n[0].length);
      }
    }
    if (!day || !month || !year || month > 12 || day > 31) continue;

    const tm = rest.match(TIME) ?? lines[i + 1]?.match(new RegExp(`^${TIME.source}`));
    const h = tm ? Number(tm[1]) : 0;
    const min = tm ? Number(tm[2]) : 0;
    const s = tm?.[3] ? Number(tm[3]) : 0;
    if (h > 23 || min > 59) continue;
    return { value: new Date(year, month - 1, day, h, min, s).getTime(), index: i, hasTime: !!tm };
  }
  return undefined;
}

// ---------- references ----------

/** Transaction references are long runs of letters and digits. */
export const REF = /[A-Z0-9]{10,}/i;

export function findRef(lines: string[], labels: string[]): string | undefined {
  const hit = valueAfter(lines, labels, (v) => REF.test(v.replace(/\s/g, '')));
  return hit?.value.replace(/\s/g, '').match(REF)?.[0].toUpperCase();
}

// ---------- names ----------

const TITLE = /^(นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|MR\.?|MRS\.?|MS\.?|MISS)\s*/i;
const ACCOUNT = /^[\dxX*•\-\s]{6,}$/;

/** Lines that are clearly not a person or shop name. */
export function isNoise(line: string, extra: RegExp[] = []): boolean {
  if (ACCOUNT.test(line)) return true; // xxx-x-x1234-x
  if (/\d{1,3}(,\d{3})*\.\d{2}/.test(line)) return true; // money
  if (DATE_NUM.test(line)) return true;
  const t = line.match(DATE_TEXT);
  if (t && monthOf(t[2])) return true; // "23 ต.ค. 69 14:32 น."
  if (/^\d{1,2}\s*[:.]\s*\d{2}/.test(line)) return true; // a bare time
  if (/^(ธ\.|ธนาคาร|BANK\b|PROMPTPAY|พร้อมเพย์)/i.test(line)) return true;
  if (/สำเร็จ|SUCCESSFUL|COMPLETED|บันทึก|สแกน|SCAN|ตรวจสอบ|VERIFY/i.test(line)) return true;
  return extra.some((r) => r.test(line));
}

export const looksLikePerson = (line: string) => TITLE.test(line);

/** A title anywhere in the line, not glued to a preceding Thai letter. */
const TITLE_IN = /(?:^|[^ก-๙])(นางสาว|นาย|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*|\b(MRS|MR|MS|MISS)\.?\s/i;
const LETTERS = /[ก-๙A-Za-z]/g;
const letterCount = (s: string) => s.match(LETTERS)?.length ?? 0;

/**
 * Pull a name out of a noisy OCR line: pick the column that holds a title (or the
 * most letters), start at the title, and drop logo/artwork junk around it.
 * `noisy` means junk had to be removed, so the result deserves a second look.
 */
export function cleanName(line: string): { name: string; noisy: boolean } | undefined {
  const segments = line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
  if (!segments.length) return undefined;
  let seg = segments.find((s) => TITLE_IN.test(s)) ?? [...segments].sort((a, b) => letterCount(b) - letterCount(a))[0];
  let noisy = segments.length > 1;

  const title = seg.match(TITLE_IN);
  if (title) {
    // the match may include the character before the title; find the title word itself
    const start = seg.indexOf(title[1] ?? title[2], title.index);
    if (start > 0) {
      seg = seg.slice(start);
      noisy = true;
    }
  }

  const before = seg;
  seg = seg.replace(/^[^ก-๙A-Za-z]+/, '');
  // a person's name never ends in digits or symbols; a shop's name may end in digits
  seg = title ? seg.replace(/[^ก-๙A-Za-z]+$/, '') : seg.replace(/[^ก-๙A-Za-z0-9)]+$/, '');
  seg = seg.replace(/\s+/g, ' ').trim();
  if (seg !== before.trim()) noisy = true;

  if (letterCount(seg) < 3 || !seg.split(' ').some((t) => letterCount(t) >= 3)) return undefined;
  return { name: seg, noisy };
}
