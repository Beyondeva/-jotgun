import { animate, AnimatePresence, motion, useDragControls, useMotionValue, type PanInfo } from 'framer-motion';
import { useEffect, useRef } from 'react';
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

/**
 * Ease-out tween rather than a spring: a spring overshoots by fractions of a pixel
 * before settling, and on iOS the text visibly shimmers as it does.
 */
const SLIDE = { duration: 0.28, ease: [0.2, 0, 0, 1] } as const;

/**
 * Always emit a 3D translate, even at rest. By default the transform becomes "none"
 * when the sheet reaches the top, so iOS drops it off its GPU layer (flicker as it
 * opens) and has to promote it again when it starts closing (flicker as it closes).
 */
const keepLayer = ({ y }: { y?: unknown }) => `translate3d(0, ${typeof y === 'number' ? `${y}px` : (y ?? 0)}, 0)`;

/** Bottom sheet: drag the handle down or tap the backdrop to close. Content scrolls freely. */
export function Sheet({ open, onClose, title, footer, children }: Props) {
  const drag = useDragControls();
  const y = useMotionValue(0);
  useScrollLock(open);

  // Callers usually render `{open && <Form />}` inside; keep showing the last content
  // while the sheet slides away, instead of an empty sheet collapsing mid-exit.
  const shown = useRef({ title, footer, children });
  if (open) shown.current = { title, footer, children };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // far or fast enough: let the exit animation carry on from where the finger left it;
    // otherwise spring back up. (No bottom drag constraint, so nothing else snaps it back.)
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
    else animate(y, 0, SLIDE);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={shown.current.title}
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SLIDE}
            transformTemplate={keepLayer}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <div className="sheet__grip" onPointerDown={(e) => drag.start(e)}>
              <div className="sheet__handle" />
              {shown.current.title && <h3 className="sheet__title">{shown.current.title}</h3>}
            </div>
            <div className="sheet__body">{shown.current.children}</div>
            {shown.current.footer && <div className="sheet__footer">{shown.current.footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
