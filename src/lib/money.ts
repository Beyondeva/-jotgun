/** All amounts in the app are integer satang (1 บาท = 100 สตางค์). */

export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

export interface MoneyParts {
  negative: boolean;
  int: string;
  dec: string;
}

export function splitMoney(satang: number): MoneyParts {
  const abs = Math.abs(Math.round(satang));
  return {
    negative: satang < 0,
    int: Math.floor(abs / 100).toLocaleString('en-US'),
    dec: String(abs % 100).padStart(2, '0'),
  };
}

export function formatMoney(satang: number, withSymbol = true): string {
  const { negative, int, dec } = splitMoney(satang);
  return `${negative ? '-' : ''}${withSymbol ? '฿' : ''}${int}.${dec}`;
}
