import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { splitMoney } from '../../lib/money';

type Size = 'hero' | 'lg' | 'md' | 'sm';
type Tone = 'default' | 'income' | 'over' | 'muted';

interface Props {
  /** satang */
  value: number;
  size?: Size;
  tone?: Tone;
  /** prefix + / − (uses the value's sign when "auto") */
  sign?: 'none' | 'plus' | 'minus' | 'auto';
  /** hide the ฿ sign, e.g. inside a ledger column that already says บาท */
  bare?: boolean;
  countUp?: boolean;
  className?: string;
}

export function useCountUp(target: number, enabled: boolean) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(enabled && !reduce ? 0 : target);
  const from = useRef(enabled && !reduce ? 0 : target);

  useEffect(() => {
    if (!enabled || reduce) {
      setShown(target);
      return;
    }
    const controls = animate(from.current, target, {
      duration: 0.7,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    from.current = target;
    return () => controls.stop();
  }, [target, enabled, reduce]);

  return shown;
}

export function Money({ value, size = 'md', tone = 'default', sign = 'none', bare, countUp = false, className }: Props) {
  const shown = useCountUp(value, countUp);
  const { negative, int, dec } = splitMoney(shown);
  // a negative value always shows its minus; "auto" also marks positives with +
  const prefix = sign === 'plus' ? '+' : sign === 'minus' || negative ? '−' : sign === 'auto' && value > 0 ? '+' : '';

  return (
    <span className={`money money--${size} money--${tone} num ${className ?? ''}`} aria-label={`${prefix}${int}.${dec} บาท`}>
      {prefix && <span className="money__sign">{prefix}</span>}
      {!bare && <span className="money__cur">฿</span>}
      <span className="money__int">{int}</span>
      <span className="money__dec">.{dec}</span>
    </span>
  );
}
