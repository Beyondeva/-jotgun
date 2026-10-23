/** Clean up raw OCR text before parsing. */

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

export function normalizeOcr(raw: string): string {
  return (
    raw
      .normalize('NFC')
      // Thai digits → Arabic
      .replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)))
      // OCR often splits the Thai sara am (ำ) into nikhahit + sara aa
      .replace(/ํา/g, 'ำ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/\t/g, '   ')
      // a wide gap separates columns (name … logo junk): keep it as exactly two spaces
      .replace(/ {3,}/g, '  ')
  );
}

export function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
