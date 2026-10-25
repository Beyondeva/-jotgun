import { createContext, useContext } from 'react';

/**
 * Where a decorated theme's scene goes on wide screens: a full-width band behind the top bar,
 * owned by WideLayout. The overview draws its scene into it (a portal), so the cat there
 * shares the page's data. Null when there's no band (plain theme, other pages).
 */
export const SceneSlot = createContext<HTMLElement | null>(null);
export const useSceneSlot = () => useContext(SceneSlot);
