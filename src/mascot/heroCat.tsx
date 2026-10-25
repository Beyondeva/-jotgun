import { createContext, useContext, type CSSProperties } from 'react';
import type { Mood } from './KhaoTang';

/**
 * The home header's ข้าวตัง: its mood (from the month's numbers) and what it is saying.
 * The home page provides it; the plain hero and the decorated scenes both read it.
 */
export interface HeroCat {
  mood: Mood;
  /** the line on show in the speech bubble, or null */
  line: string | null;
  /** tap: say the next line */
  say: () => void;
}

const Ctx = createContext<HeroCat>({ mood: 'happy', line: null, say: () => {} });
export const HeroCatProvider = Ctx.Provider;
export const useHeroCat = () => useContext(Ctx);

export const CAT_LABEL = 'ข้าวตัง แตะเพื่อฟังสรุปเดือนนี้';

/** A small speech bubble to the cat's left, with its tail pointing at the cat. */
export function CatBubble({ text, className, style }: { text: string | null; className?: string; style?: CSSProperties }) {
  return (
    <span className={`kt-bubble ${className ?? ''}`} role="status" style={text ? style : { ...style, display: 'none' }}>
      {text}
    </span>
  );
}
