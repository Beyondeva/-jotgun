import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

export interface ToastData {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

/** One short message above the tab bar, with an optional action such as undo. */
export function Toast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  return createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              className="toast__action"
              onClick={() => {
                toast.action!.run();
                onDone();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
