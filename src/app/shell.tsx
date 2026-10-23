import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, type ToastData } from '../design/components/Toast';
import { deleteTransaction, restoreTransaction } from '../db/repo';
import type { Transaction } from '../db/types';
import { ManualEntrySheet } from '../features/manual/ManualEntrySheet';

interface Shell {
  /** open the manual entry sheet; pass a transaction to edit it */
  openManual: (tx?: Transaction) => void;
  toast: (message: string, action?: ToastData['action']) => void;
  /** delete with an undo toast */
  removeTx: (tx: Transaction) => Promise<void>;
}

const Ctx = createContext<Shell | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [manual, setManual] = useState<{ open: boolean; tx?: Transaction }>({ open: false });
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!toastData) return;
    const t = setTimeout(() => setToastData(null), 4000);
    return () => clearTimeout(t);
  }, [toastData]);

  const toast = useCallback<Shell['toast']>((message, action) => setToastData({ id: ++seq.current, message, action }), []);

  const removeTx = useCallback<Shell['removeTx']>(
    async (tx) => {
      await deleteTransaction(tx.id);
      toast('ลบแล้ว', { label: 'เลิกทำ', run: () => void restoreTransaction(tx) });
    },
    [toast],
  );

  const value = useMemo<Shell>(() => ({ openManual: (tx) => setManual({ open: true, tx }), toast, removeTx }), [toast, removeTx]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ManualEntrySheet
        open={manual.open}
        tx={manual.tx}
        onClose={() => setManual((m) => ({ ...m, open: false }))}
        onSaved={(edited) => toast(edited ? 'แก้แล้ว' : 'จดแล้ว')}
        onDelete={(tx) => {
          setManual((m) => ({ ...m, open: false }));
          void removeTx(tx);
        }}
      />
      <Toast toast={toastData} onDone={() => setToastData(null)} />
    </Ctx.Provider>
  );
}

export function useShell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useShell must be used inside <ShellProvider>');
  return ctx;
}
