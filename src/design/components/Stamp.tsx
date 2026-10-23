import { faPaw } from '@fortawesome/free-solid-svg-icons';
import { motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon';

const PAWS = [
  { x: '18%', y: '30%', r: -18, d: 0.25 },
  { x: '74%', y: '24%', r: 14, d: 0.35 },
  { x: '26%', y: '66%', r: 10, d: 0.45 },
  { x: '70%', y: '70%', r: -12, d: 0.55 },
];

/** "จดครบ" rubber stamp thumped onto the screen, with a few paw prints. Mount, then unmount after ~1.8s. */
export function DoneStamp({ label = 'จดครบ' }: { label?: string }) {
  const reduce = useReducedMotion();
  const thump = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: [0, 1, 1, 0] } }
    : { initial: { opacity: 0, scale: 1.8, rotate: -14 }, animate: { opacity: [0, 1, 1, 0], scale: [1.8, 1, 1, 1], rotate: -10 } };

  return createPortal(
    <div className="stamp-layer" aria-hidden>
      <motion.div className="stamp" {...thump} transition={{ duration: 1.7, times: [0, 0.12, 0.8, 1], ease: 'easeOut' }}>
        <Icon icon={faPaw} size={22} />
        <span>{label}</span>
      </motion.div>
      {PAWS.map((p, i) => (
        <motion.span
          key={i}
          className="stamp-paw"
          style={{ left: p.x, top: p.y, rotate: p.r }}
          initial={{ opacity: 0, scale: reduce ? 1 : 1.5 }}
          animate={{ opacity: [0, 0.8, 0.8, 0], scale: 1 }}
          transition={{ duration: 1.5, delay: reduce ? 0 : p.d, times: [0, 0.1, 0.75, 1] }}
        >
          <Icon icon={faPaw} size={30} />
        </motion.span>
      ))}
    </div>,
    document.body,
  );
}
