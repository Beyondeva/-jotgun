const dayFmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
const monthFmt = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat('th-TH', { weekday: 'short' });

/** "23 ต.ค. 69" (พ.ศ.) */
export const formatDay = (ts: number) => dayFmt.format(ts);
/** "14:32" */
export const formatTime = (ts: number) => timeFmt.format(ts);
/** "ตุลาคม 2569" */
export const formatMonth = (ts: number) => monthFmt.format(ts);
/** "จันทร์" */
export const formatWeekday = (ts: number) => weekdayFmt.format(ts);

const WEEKDAY_ABBR = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
/** "จ." — Intl has no Thai abbreviation between "จันทร์" and "จ" */
export const formatWeekdayAbbr = (ts: number) => WEEKDAY_ABBR[new Date(ts).getDay()];

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number) {
  return startOfDay(a) === startOfDay(b);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** epoch ms → "2026-10-23T14:32" in local time, for <input type="datetime-local"> */
export function toLocalInput(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-10-23T14:32" (local) → epoch ms; NaN if empty */
export const fromLocalInput = (value: string) => (value ? new Date(value).getTime() : NaN);

/** "วันนี้" / "เมื่อวาน" / "23 ต.ค. 69" */
export function relativeDay(ts: number, now = Date.now()) {
  const diff = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (diff === 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return formatDay(ts);
}
