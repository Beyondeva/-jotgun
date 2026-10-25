import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatDay } from '../../lib/date';
import type { Pace } from '../../lib/pace';
import { useBahtText } from '../../lib/privacy';

const W = 300;
const H = 72;

/**
 * This month's running total in ink against the plan as a pencilled dashed line,
 * with a flag at today saying how far under or over plan it is. Against a budget,
 * the ink line is only the budgeted categories (the caller filters them).
 *
 * Touch and drag along it (or focus it and use the arrow keys) to read any day:
 * a guide line follows the finger and the flag shows that day's total and plan.
 */
export function PaceChart({ pace }: { pace: Pace }) {
  const baht = useBahtText();
  const [scrub, setScrub] = useState<number | null>(null);
  const max = Math.max(...pace.plan, ...pace.actual, 1) * 1.1;
  const x = (i: number) => (pace.days > 1 ? (i / (pace.days - 1)) * W : 0);
  const y = (v: number) => H - (v / max) * H;
  const line = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const pct = (i: number, v: number) => ({ left: `${(x(i) / W) * 100}%`, top: `${(y(v) / H) * 100}%` });

  const last = pace.elapsed - 1;
  const under = pace.diff <= 0;
  const budget = pace.planKind === 'budget';
  const status = budget ? (under ? 'ต่ำกว่าแผน' : 'เร็วกว่าแผน') : under ? 'น้อยกว่าเดือนก่อน' : 'มากกว่าเดือนก่อน';
  const amount = baht(Math.abs(pace.diff));

  // the scrubbed day: days after today only have a plan
  const day = scrub ?? last;
  const value = day <= last ? pace.actual[day] : pace.plan[day];
  const flagLeft = (x(day) / W) * 100 > 55;
  const planWord = budget ? 'แผน' : 'เดือนก่อน';
  const dayText = `${formatDay(pace.dates[day])} ${day <= last ? `ใช้ ${baht(pace.actual[day])} · ` : ''}${planWord} ${baht(pace.plan[day])}`;

  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    return Math.round(f * (pace.days - 1));
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setScrub(Math.min(pace.days - 1, Math.max(0, day + step)));
  };

  return (
    <figure className="pace" aria-label={`${status} ${amount}`}>
      <div
        className={`pace__plot ${scrub !== null ? 'is-scrubbing' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label="ยอดสะสมรายวัน"
        aria-valuemin={1}
        aria-valuemax={pace.days}
        aria-valuenow={day + 1}
        aria-valuetext={dayText}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId); // keep the drag when the finger leaves the chart
          } catch {
            /* no capture for this pointer: still works while over the chart */
          }
          setScrub(dayAt(e));
        }}
        onPointerMove={(e) => scrub !== null && setScrub(dayAt(e))}
        onPointerUp={() => setScrub(null)}
        onPointerCancel={() => setScrub(null)}
        onKeyDown={onKey}
        onBlur={() => setScrub(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <path d={`M0 ${H} H${W}`} className="pace__base" />
          <path d={line(pace.plan)} className="pace__plan" />
          <path d={line(pace.actual)} className="pace__actual" />
        </svg>
        {scrub !== null && <span className="pace__guide" style={{ left: pct(day, 0).left }} aria-hidden />}
        <span className={`pace__dot ${day > last ? 'is-plan' : ''}`} style={pct(day, value)} aria-hidden />
        {scrub === null ? (
          <span className={`pace__tag ${under ? 'is-under' : 'is-over'} ${flagLeft ? 'is-left' : ''}`} style={pct(day, value)} aria-hidden>
            {status} <b className="num">{amount}</b>
          </span>
        ) : (
          <span className={`pace__tag is-day ${flagLeft ? 'is-left' : ''}`} style={pct(day, value)} aria-hidden>
            {dayText}
          </span>
        )}
      </div>
      <figcaption className="pace__legend">
        <span className="pace__key" aria-hidden />
        {budget ? 'หมวดที่มีงบ' : 'เดือนนี้'}
        <span className="pace__key pace__key--plan" aria-hidden />
        {budget ? 'ตามงบ' : 'เดือนก่อน'}
      </figcaption>
    </figure>
  );
}
