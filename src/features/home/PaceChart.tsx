import type { Pace } from '../../lib/pace';
import { useBahtText } from '../../lib/privacy';

const W = 300;
const H = 72;

/**
 * This month's running total in ink against the plan as a pencilled dashed line,
 * with a flag at today saying how far under or over plan it is.
 */
export function PaceChart({ pace }: { pace: Pace }) {
  const baht = useBahtText();
  const max = Math.max(...pace.plan, ...pace.actual, 1) * 1.1;
  const x = (i: number) => (pace.days > 1 ? (i / (pace.days - 1)) * W : 0);
  const y = (v: number) => H - (v / max) * H;
  const line = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const last = pace.elapsed - 1;
  const left = (x(last) / W) * 100;
  const top = (y(pace.actual[last]) / H) * 100;
  const under = pace.diff <= 0;
  const budget = pace.planKind === 'budget';
  const status = budget ? (under ? 'ต่ำกว่าแผน' : 'เร็วกว่าแผน') : under ? 'น้อยกว่าเดือนก่อน' : 'มากกว่าเดือนก่อน';
  const amount = baht(Math.abs(pace.diff));

  return (
    <figure className="pace" aria-label={`${status} ${amount}`}>
      <div className="pace__plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <path d={`M0 ${H} H${W}`} className="pace__base" />
          <path d={line(pace.plan)} className="pace__plan" />
          <path d={line(pace.actual)} className="pace__actual" />
        </svg>
        <span className="pace__dot" style={{ left: `${left}%`, top: `${top}%` }} aria-hidden />
        <span className={`pace__tag ${under ? 'is-under' : 'is-over'} ${left > 55 ? 'is-left' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} aria-hidden>
          {status} <b className="num">{amount}</b>
        </span>
      </div>
      <figcaption className="pace__legend">
        <span className="pace__key" aria-hidden />
        เดือนนี้
        <span className="pace__key pace__key--plan" aria-hidden />
        {budget ? 'ตามงบ' : 'เดือนก่อน'}
      </figcaption>
    </figure>
  );
}
