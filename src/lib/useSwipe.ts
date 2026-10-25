import { useRef, type PointerEvent } from 'react';

/** How far, how straight and how quick a flick has to be to count. */
const MIN_DX = 56;
const STRAIGHTNESS = 1.5;
const MAX_MS = 700;

/**
 * Horizontal flicks on touch screens, for an element with `touch-action: pan-y`
 * (vertical drags keep scrolling the page and cancel the gesture). Gestures that start
 * on something matching `ignore` (a chart that drags, a button) are left alone.
 * The element moves nowhere while dragging: the content just changes after the flick.
 */
export function useSwipe({ onLeft, onRight, ignore }: { onLeft?: () => void; onRight?: () => void; ignore?: string }) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  return {
    onPointerDown(e: PointerEvent) {
      const skip = e.pointerType === 'mouse' || (ignore && (e.target as Element).closest(ignore));
      start.current = skip ? null : { x: e.clientX, y: e.clientY, t: e.timeStamp };
    },
    onPointerUp(e: PointerEvent) {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * STRAIGHTNESS || e.timeStamp - s.t > MAX_MS) return;
      if (dx < 0) onLeft?.();
      else onRight?.();
    },
    onPointerCancel() {
      start.current = null;
    },
  };
}
