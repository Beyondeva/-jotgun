import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRef } from 'react';
import { Icon, type IconDefinition } from '../Icon';

interface Props {
  children: React.ReactNode;
  onDelete?: () => void;
  /** swipe right: what it does, shown under the row as it slides */
  right?: { icon: IconDefinition; label: string; run: () => void };
  /** plain tap (not fired after a drag) */
  onTap?: () => void;
}

const THRESHOLD = 96;
const TAP_SLOP = 10;

/** Swipe left to delete, right for the `right` action. */
export function SwipeRow({ children, onDelete, right, onTap }: Props) {
  const x = useMotionValue(0);
  // framer can report a tap at the end of a quick drag: a "tap" that travelled isn't one
  const pressedAt = useRef({ x: 0, y: 0 });
  const rightOpacity = useTransform(x, [0, 40, THRESHOLD], [0, 0.6, 1]);
  const deleteOpacity = useTransform(x, [-THRESHOLD, -40, 0], [1, 0.6, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -THRESHOLD && onDelete) onDelete();
    else if (info.offset.x > THRESHOLD && right) right.run();
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
  };

  return (
    <div className="swipe">
      {right && (
        <motion.div className="swipe__bg swipe__bg--right" style={{ opacity: rightOpacity }} aria-hidden>
          <Icon icon={right.icon} size={17} />
          <span className="swipe__label">{right.label}</span>
        </motion.div>
      )}
      <motion.div className="swipe__bg swipe__bg--delete" style={{ opacity: deleteOpacity }} aria-hidden>
        <Icon icon={faTrash} size={17} />
      </motion.div>
      <motion.div
        className="swipe__fg"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={onDragEnd}
        onTapStart={(_, info) => (pressedAt.current = info.point)}
        onTap={(_, info) => {
          const { x: px, y: py } = pressedAt.current;
          if (Math.hypot(info.point.x - px, info.point.y - py) < TAP_SLOP) onTap?.();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
