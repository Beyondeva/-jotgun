import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../Icon';

interface Props {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  /** plain tap (not fired after a drag) */
  onTap?: () => void;
}

const THRESHOLD = 96;

/** Swipe left to delete, right to edit. */
export function SwipeRow({ children, onDelete, onEdit, onTap }: Props) {
  const x = useMotionValue(0);
  const editOpacity = useTransform(x, [0, 40, THRESHOLD], [0, 0.6, 1]);
  const deleteOpacity = useTransform(x, [-THRESHOLD, -40, 0], [1, 0.6, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -THRESHOLD && onDelete) onDelete();
    else if (info.offset.x > THRESHOLD && onEdit) onEdit();
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
  };

  return (
    <div className="swipe">
      <motion.div className="swipe__bg swipe__bg--edit" style={{ opacity: editOpacity }} aria-hidden>
        <Icon icon={faPen} size={17} />
      </motion.div>
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
        onTap={onTap}
      >
        {children}
      </motion.div>
    </div>
  );
}
