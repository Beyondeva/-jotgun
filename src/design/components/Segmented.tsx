import { motion } from 'framer-motion';
import { useId } from 'react';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Text tabs with an ink underline. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const id = useId();
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={`seg__opt ${o.value === value ? 'is-active' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
          {o.value === value && <motion.span layoutId={`seg-${id}`} className="seg__line" transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }} />}
        </button>
      ))}
    </div>
  );
}
