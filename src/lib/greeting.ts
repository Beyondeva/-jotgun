export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'อรุณสวัสดิ์';
  if (h >= 12 && h < 17) return 'สวัสดีตอนบ่าย';
  if (h >= 17 && h < 21) return 'สวัสดีตอนเย็น';
  return 'ดึกแล้วนะ';
}
