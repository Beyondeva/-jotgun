import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ingestSlip } from '../../db/slips';

export interface ReaderState {
  total: number;
  done: number;
  failed: number;
  /** true while the OCR engine and Thai language data download (first run only) */
  preparing: boolean;
  /** why the last failed slip couldn't be read; kept until the next batch */
  lastError?: string;
}

interface Reader extends ReaderState {
  running: boolean;
  readFiles: (files: File[]) => void;
}

const Ctx = createContext<Reader | null>(null);
const IDLE: ReaderState = { total: 0, done: 0, failed: 0, preparing: false };

/** Reads picked slip images one by one in the background and drops them into "รอจด". */
export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReaderState>(IDLE);
  const queue = useRef<File[]>([]);
  const busy = useRef(false);

  const pump = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    while (queue.current.length) {
      const file = queue.current.shift()!;
      try {
        // loaded inside the try so a failed download marks the slip failed instead of stalling the queue
        const { readSlip } = await import('../../slip/read');
        const slip = await readSlip(file, (status) => {
          const preparing = /loading|initializ/i.test(status) && !/recogniz/i.test(status);
          setState((s) => (s.preparing === preparing ? s : { ...s, preparing }));
        });
        await ingestSlip(slip);
        setState((s) => ({ ...s, done: s.done + 1, preparing: false }));
      } catch (err) {
        console.error('[จดกัน] slip read failed', err);
        const message = err instanceof Error ? err.message : String(err);
        // keep the picture in the queue so it can be filled in by hand
        await ingestSlip({ image: file, thumb: file, parsed: {}, confidence: {}, ocrText: `อ่านไม่สำเร็จ: ${message}` }).catch(() => {});
        setState((s) => ({ ...s, done: s.done + 1, failed: s.failed + 1, preparing: false, lastError: message }));
      }
    }
    busy.current = false;
    // keep the finished count visible briefly, then reset (but remember the last error)
    setTimeout(() => !busy.current && setState((s) => ({ ...IDLE, lastError: s.lastError })), 1500);
  }, []);

  const readFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      queue.current.push(...files);
      setState((s) => (busy.current ? { ...s, total: s.total + files.length } : { ...IDLE, total: files.length }));
      void pump();
    },
    [pump],
  );

  const value = useMemo<Reader>(() => ({ ...state, running: state.total > 0 && state.done < state.total, readFiles }), [state, readFiles]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReader() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReader must be used inside <ReaderProvider>');
  return ctx;
}
