import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { splitMoney } from '../../lib/money';
import { Icon } from '../Icon';

type Size = 'hero' | 'lg' | 'md' | 'sm';
type Tone = 'default' | 'income' | 'over' | 'muted';

interface Props {
  /** satang */
  value: number;
  size?: Size;
  tone?: Tone;
  /** prefix + / − (uses the value's sign when "auto") */
  sign?: 'none' | 'plus' | 'minus' | 'auto';
  /**
   * Money moving in or out. "in" = + and an in-arrow (and the income colour);
   * "out" = −. Meaning never rests on colour alone, so it reads in every theme.
   */
  flow?: 'in' | 'out';
  /** hide the ฿ sign, e.g. inside a ledger column that already says บาท */
  bare?: boolean;
  /**
   * Animate the number. A string names the spot (e.g. "home-hero"): the last value
   * shown there is remembered, so coming back to a page doesn't re-count from 0.
   */
  countUp?: boolean | string;
  className?: string;
}

/** Last value displayed per count-up spot, for the whole session. */
const lastShown = new Map<string, number>();

export function useCountUp(target: number, enabled: boolean | string) {
  const reduce = useReducedMotion();
  const key = typeof enabled === 'string' ? enabled : undefined;
  const animate_ = !!enabled && !reduce;
  const start = animate_ ? (key !== undefined ? (lastShown.get(key) ?? 0) : 0) : target;
  const [shown, setShown] = useState(start);
  const from = useRef(start);

  useEffect(() => {
    const done = (v: number) => key !== undefined && lastShown.set(key, v);
    if (!animate_ || from.current === target) {
      setShown(target);
      from.current = target;
      done(target);
      return;
    }
    const controls = animate(from.current, target, {
      duration: 0.7,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => done(target),
    });
    from.current = target;
    return () => {
      controls.stop();
      done(target);
    };
  }, [target, animate_, key]);

  return shown;
}

export function Money({ value, size = 'md', tone = 'default', sign = 'none', flow, bare, countUp = false, className }: Props) {
  const shown = useCountUp(value, countUp);
  const { negative, int, dec } = splitMoney(shown);
  // a negative value always shows its minus; "auto" also marks positives with +
  const plus = flow === 'in' || sign === 'plus' || (sign === 'auto' && value > 0 && !negative);
  const prefix = flow === 'out' || sign === 'minus' || negative ? '−' : plus ? '+' : '';
  const shownTone = flow === 'in' && tone === 'default' ? 'income' : tone;
  const label = `${flow === 'in' ? 'รับ ' : flow === 'out' ? 'จ่าย ' : ''}${prefix}${int}.${dec} บาท`;

  return (
    <span className={`money money--${size} money--${shownTone} num ${className ?? ''}`} aria-label={label}>
      {flow === 'in' && <Icon icon={faArrowDown} className="money__in" style={{ fontSize: '0.62em' }} />}
      {prefix && <span className="money__sign">{prefix}</span>}
      {!bare && <span className="money__cur">฿</span>}
      <span className="money__int">{int}</span>
      <span className="money__dec">.{dec}</span>
    </span>
  );
}
