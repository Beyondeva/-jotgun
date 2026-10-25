import { Component, lazy, Suspense, useState, type CSSProperties, type ReactNode } from 'react';
import { useMascot3D } from './prefs';
import celebrate from './renders/khaotang-celebrate.webp';
import happy from './renders/khaotang-happy.webp';
import reading from './renders/khaotang-reading.webp';
import sleeping from './renders/khaotang-sleeping.webp';
import worried from './renders/khaotang-worried.webp';

/**
 * ข้าวตัง — a chubby kitten the colour of toasted rice cracker, with browned ear tips,
 * tail tip and forehead marks and a pencil behind the ear. Modelled in Blender by
 * tools/blender/khaotang.py, which also renders these stills.
 *
 * Shows the still for the mood. With `live`, and 3D allowed (Settings, reduced motion,
 * WebGL), the animated model replaces it once its first frame is drawn.
 */
export type Mood = 'happy' | 'worried' | 'sleeping' | 'reading' | 'celebrate';

const STILLS: Record<Mood, string> = { happy, worried, sleeping, reading, celebrate };

const MOOD_LABEL: Record<Mood, string> = {
  happy: 'ข้าวตังยิ้ม',
  worried: 'ข้าวตังกังวล',
  sleeping: 'ข้าวตังหลับ',
  reading: 'ข้าวตังใส่แว่นอ่านสลิป',
  celebrate: 'ข้าวตังดีใจ',
};

const LiveKhaoTang = lazy(() => import('./LiveKhaoTang'));

interface Props {
  mood?: Mood;
  size?: number;
  className?: string;
  /** Animate in 3D when allowed. Keep to one or two on a screen: each is a WebGL canvas. */
  live?: boolean;
}

export function KhaoTang({ mood = 'happy', size = 120, className, live = false }: Props) {
  const allowed = useMascot3D();
  const [ready, setReady] = useState(false);
  const showLive = live && allowed;

  return (
    <span
      className={`khaotang ${className ?? ''}`}
      role="img"
      aria-label={MOOD_LABEL[mood]}
      style={{ width: size, height: size, '--kt': `${size}px` } as CSSProperties}
    >
      <img
        className={`khaotang__still ${showLive && ready ? 'is-hidden' : ''}`}
        src={STILLS[mood]}
        width={size}
        height={size}
        alt=""
        draggable={false}
      />
      {showLive && (
        <StillOnError>
          <Suspense fallback={null}>
            <LiveKhaoTang mood={mood} onReady={() => setReady(true)} />
          </Suspense>
        </StillOnError>
      )}
      {mood === 'sleeping' && <Zzz />}
      {mood === 'celebrate' && <Sparkles />}
    </span>
  );
}

/** If three.js or the model can't load (offline, old phone), drop the live view and keep the still. */
export class StillOnError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Zzz() {
  return (
    <span className="khaotang__fx" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`khaotang__z khaotang__z--${i}`}>
          z
        </span>
      ))}
    </span>
  );
}

/** Four-point sparkles around the head. */
function Sparkles() {
  return (
    <span className="khaotang__fx" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <svg key={i} className={`khaotang__spark khaotang__spark--${i}`} viewBox="-10 -10 20 20">
          <path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}
