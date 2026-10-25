import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { CatBubble, CAT_LABEL, useHeroCat } from './heroCat';
import { StillOnError } from './KhaoTang';
import { useMascot3D } from './prefs';

const LiveKhaoTang = lazy(() => import('./LiveKhaoTang'));

/**
 * The decorated themes' ข้าวตัง: a tappable box laid exactly over the cat's still (an
 * <image> in the scene SVG), holding the live 3D model when 3D is allowed; the still is
 * hidden once the model has drawn. The scene SVG scales and crops (preserveAspectRatio
 * slice) and the still may be rotated, so the box comes from the <image>'s screen matrix.
 * Render it next to the scene SVGs, inside .decor-hero.
 */
export function SceneLive({ still, glb }: { still: RefObject<SVGImageElement | null>; glb: string }) {
  const { mood, line, say } = useHeroCat();
  const allowed = useMascot3D();
  const cat = useRef<HTMLButtonElement>(null);
  const [bubble, setBubble] = useState<CSSProperties>();

  useLayoutEffect(() => {
    const img = still.current;
    const el = cat.current;
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
      // the bubble sits left of the cat's (upright) bounding box, about head height
      const b = img.getBoundingClientRect();
      setBubble({ top: b.top - r.top + b.height * 0.22, right: r.right - b.left - b.width * 0.12 });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [still]);

  // put the still back whenever the live view goes away (3D switched off, unmount)
  useEffect(
    () => () => {
      still.current?.style.removeProperty('visibility');
    },
    [still, allowed],
  );

  return (
    <>
      <button ref={cat} type="button" className="decor-scene__cat" onClick={say} aria-label={CAT_LABEL}>
        {allowed && (
          <StillOnError>
            <Suspense fallback={null}>
              {/* swap, never fade (see CLAUDE.md iOS notes) */}
              <LiveKhaoTang mood={mood} url={glb} onReady={() => still.current?.style.setProperty('visibility', 'hidden')} />
            </Suspense>
          </StillOnError>
        )}
      </button>
      <CatBubble text={line} className="kt-bubble--left decor-scene__bubble" style={bubble} />
    </>
  );
}
