import { lazy, Suspense, type RefObject } from 'react';
import { StillOnError } from './KhaoTang';
import { useMascot3D } from './prefs';

const LiveOverlay = lazy(() => import('./SceneLiveOverlay'));

/**
 * The decorated themes' ข้าวตัง, alive: lays the scene's 3D model exactly over its still
 * (an <image> in the scene SVG) and hides the still once the model has drawn.
 * Render it next to the scene SVGs, inside .decor-hero.
 */
export function SceneLive({ still, glb }: { still: RefObject<SVGImageElement | null>; glb: string }) {
  if (!useMascot3D()) return null;
  return (
    <StillOnError>
      <Suspense fallback={null}>
        <LiveOverlay still={still} glb={glb} />
      </Suspense>
    </StillOnError>
  );
}
