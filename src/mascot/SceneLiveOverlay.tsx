import { useLayoutEffect, useRef, type RefObject } from 'react';
import { mountLive } from './live';

/**
 * Positions a canvas over the still's box on screen. The scene SVG scales and crops
 * (preserveAspectRatio slice) and the still may be rotated, so the box comes from the
 * <image>'s screen matrix: same size and angle, in .decor-hero's coordinates.
 */
export default function SceneLiveOverlay({ still, glb }: { still: RefObject<SVGImageElement | null>; glb: string }) {
  const host = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const img = still.current;
    const el = host.current;
    const box = el?.offsetParent;
    if (!img || !el || !box) return;

    const place = () => {
      const m = img.getScreenCTM();
      if (!m) return;
      const at = new DOMPoint(img.x.baseVal.value, img.y.baseVal.value).matrixTransform(m);
      const r = box.getBoundingClientRect();
      const scale = Math.hypot(m.a, m.b);
      el.style.width = `${img.width.baseVal.value * scale}px`;
      el.style.height = `${img.height.baseVal.value * scale}px`;
      el.style.transform = `translate(${at.x - r.left}px, ${at.y - r.top}px) rotate(${Math.atan2(m.b, m.a)}rad)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);

    // swap, never fade (see CLAUDE.md iOS notes)
    const live = mountLive(el, 'happy', () => img.style.setProperty('visibility', 'hidden'), glb);
    return () => {
      ro.disconnect();
      live.dispose();
      img.style.removeProperty('visibility');
    };
  }, [still, glb]);

  return <span ref={host} className="decor-scene__live" aria-hidden />;
}
