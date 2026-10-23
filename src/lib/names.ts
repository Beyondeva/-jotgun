/** Name handling for people and shops as they appear on Thai bank slips. */

// longest first so "นางสาว" wins over "นาง"
const TITLES = ['นางสาว', 'น.ส.', 'นาง', 'นาย', 'ด.ช.', 'ด.ญ.', 'คุณ', 'MRS.', 'MRS', 'MISS', 'MR.', 'MR', 'MS.', 'MS'];

/** Uppercase, single spaces, no honorific in front. */
export function normalizeName(raw: string): string {
  let s = raw.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleUpperCase('th');
  for (const t of TITLES) {
    if (s.startsWith(t + ' ') || (t.endsWith('.') && s.startsWith(t))) {
      s = s.slice(t.length).trim();
      break;
    }
  }
  return s;
}

/** Key for remembering a payee: the normalized name without masked account fragments. */
export function payeeKey(raw: string): string {
  return normalizeName(raw)
    .replace(/[X*•]{2,}[-\dX*•]*/g, '') // xxx-x-x1234-x style masks
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip mask characters slips use to hide part of a surname: "ใ***" → "ใ", "J." → "J". */
const unmask = (token: string) => token.replace(/[*x•.]+$/gi, '');

/**
 * Does a name from a slip refer to the account owner?
 * Slips often mask the surname ("สมชาย ใ***", "SOMCHAI J"), so the first name must
 * match exactly and any visible part of the surname must agree.
 */
export function isOwnerName(candidate: string, owners: string[]): boolean {
  const [first, last] = normalizeName(candidate).split(' ');
  if (!first) return false;
  return owners.some((owner) => {
    const [oFirst, oLast] = normalizeName(owner).split(' ');
    if (!oFirst || oFirst !== first) return false;
    if (!last || !oLast) return true;
    const a = unmask(last);
    const b = unmask(oLast);
    return a.length === 0 || b.length === 0 || a.startsWith(b) || b.startsWith(a);
  });
}
