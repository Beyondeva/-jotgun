/** Keypad editing for a baht amount typed as text, e.g. "1250.5". */

export type AmountKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

const MAX_INT_DIGITS = 9; // up to ฿999,999,999

export function pressKey(current: string, key: AmountKey): string {
  if (key === 'back') return current.slice(0, -1);
  if (key === '.') {
    if (current.includes('.')) return current;
    return (current || '0') + '.';
  }
  const [int, dec] = current.split('.');
  if (dec !== undefined) return dec.length >= 2 ? current : current + key;
  if (int === '0') return key; // replace a lone leading zero
  if (int.length >= MAX_INT_DIGITS) return current;
  return current + key;
}

/** "1250.5" → 125050 satang. Empty or "." → 0. */
export function amountToSatang(text: string): number {
  if (!text || text === '.') return 0;
  const [int, dec = ''] = text.split('.');
  return Number(int || '0') * 100 + Number((dec + '00').slice(0, 2));
}

/** 125050 → "1250.5" (no trailing zeros) for editing an existing amount. */
export function satangToAmountText(satang: number): string {
  if (!satang) return '';
  const int = Math.floor(satang / 100);
  const dec = satang % 100;
  if (dec === 0) return String(int);
  return `${int}.${String(dec).padStart(2, '0').replace(/0$/, '')}`;
}

/** Group thousands for display while keeping what the user typed after the dot. */
export function displayAmount(text: string): string {
  if (!text) return '0';
  const [int, dec] = text.split('.');
  const grouped = Number(int || '0').toLocaleString('en-US');
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}
