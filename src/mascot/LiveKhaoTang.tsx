import { useEffect, useRef } from 'react';
import type { Mood } from './KhaoTang';
import { mountLive, type Live } from './live';

/** The WebGL view behind <KhaoTang live> and the scene cats. Lazy-loaded with three.js. */
export default function LiveKhaoTang({ mood, onReady, url }: { mood: Mood; onReady: () => void; url?: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const live = useRef<Live | null>(null);
  const first = useRef({ mood, onReady, url });

  useEffect(() => {
    const { url } = first.current;
    const l = mountLive(host.current!, first.current.mood, () => first.current.onReady(), url);
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
