import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../lib/scrollLock';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** pinned to the bottom of the sheet, e.g. a save button */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Bottom sheet: drag the handle down or tap the backdrop to close. Content scrolls freely. */
export function Sheet({ open, onClose, title, footer, children }: Props) {
  const drag = useDragControls();
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="sheet__grip" onPointerDown={(e) => drag.start(e)}>
              <div className="sheet__handle" />
              {title && <h3 className="sheet__title">{title}</h3>}
            </div>
            <div className="sheet__body">{children}</div>
            {footer && <div className="sheet__footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
