import { motion } from 'framer-motion';
import { KhaoTang, type Mood } from '../../mascot/KhaoTang';

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <motion.div className="progress__fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} />
    </div>
  );
}

export function Skeleton({ w = '100%', h = 12, r = 3 }: { w?: number | string; h?: number; r?: number }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

interface EmptyProps {
  mood: Mood;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ mood, title, body, action }: EmptyProps) {
  return (
    <div className="empty">
      <KhaoTang mood={mood} size={140} live />
      <div className="empty__text">
        <h3 className="empty__title">{title}</h3>
        {body && <p className="empty__body">{body}</p>}
      </div>
      {action}
    </div>
  );
}
