import { useEffect, useRef } from 'react';
import type { Mood } from './KhaoTang';
import { mountLive, type Live } from './live';

/** The WebGL view behind <KhaoTang live>. Lazy-loaded with three.js. */
export default function LiveKhaoTang({ mood, onReady }: { mood: Mood; onReady: () => void }) {
  const host = useRef<HTMLSpanElement>(null);
  const live = useRef<Live | null>(null);
  const first = useRef({ mood, onReady });

  useEffect(() => {
    const l = mountLive(host.current!, first.current.mood, () => first.current.onReady());
    live.current = l;
    return () => {
      l.dispose();
      live.current = null;
    };
  }, []);

  useEffect(() => {
    live.current?.setMood(mood);
  }, [mood]);

  return <span ref={host} className="khaotang__live" aria-hidden />;
}
