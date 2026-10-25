import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

const MOVE_PX = 10;

/**
 * Press and hold (or right-click). Spread `handlers` on the element and start its
 * onClick with `if (consumed()) return;` so the click that ends a long press is skipped.
 * Pair with `-webkit-touch-callout: none; user-select: none` so iOS doesn't pop its menu.
 */
export function useLongPress(onLong: () => void, ms = 450) {
  const timer = useRef(0);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const cb = useRef(onLong);
  cb.current = onLong;

  const clear = () => {
    window.clearTimeout(timer.current);
    start.current = null;
  };
  const fire = () => {
    clear();
    fired.current = true;
    cb.current();
  };
  useEffect(() => clear, []);

  return {
    handlers: {
      onPointerDown(e: PointerEvent) {
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(fire, ms);
      },
      onPointerMove(e: PointerEvent) {
        const s = start.current;
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_PX) clear(); // a scroll, not a press
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onContextMenu(e: MouseEvent) {
        e.preventDefault();
        if (!fired.current) fire();
      },
    },
    /** true once, right after a long press: the click that follows should do nothing */
    consumed() {
      const f = fired.current;
      fired.current = false;
      return f;
    },
  };
}
