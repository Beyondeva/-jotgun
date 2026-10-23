import { motion, useReducedMotion, type Transition } from 'framer-motion';

/**
 * ข้าวตัง — the app's own tabby, drawn as an ink line sketch.
 * Colour is printed a few px off the line work, like a riso print.
 * The cat stays white with dark lines in both themes (--mascot-* tokens).
 */
export type Mood = 'happy' | 'worried' | 'sleeping' | 'reading' | 'celebrate';

const INK = 'var(--mascot-ink)';
const PAPER = 'var(--mascot-paper)';
const TABBY = 'var(--mascot-tabby)';
const SCARF = 'var(--mascot-accent)';

const MOOD_LABEL: Record<Mood, string> = {
  happy: 'ข้าวตังยิ้ม',
  worried: 'ข้าวตังกังวล',
  sleeping: 'ข้าวตังหลับ',
  reading: 'ข้าวตังใส่แว่นอ่านสลิป',
  celebrate: 'ข้าวตังดีใจ',
};

const stroke = {
  fill: 'none',
  stroke: INK,
  strokeWidth: 4.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

interface Props {
  mood?: Mood;
  size?: number;
  className?: string;
}

export function KhaoTang({ mood = 'happy', size = 120, className }: Props) {
  const reduce = useReducedMotion() ?? false;
  const loop = (duration: number, extra: Transition = {}): Transition =>
    reduce ? { duration: 0 } : { duration, repeat: Infinity, ease: 'easeInOut', ...extra };

  const armsUp = mood === 'celebrate';

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={MOOD_LABEL[mood]} className={className} style={{ overflow: 'visible' }}>
      <motion.g
        animate={armsUp ? { y: reduce ? 0 : [0, -6, 0] } : { scaleY: reduce ? 1 : [1, mood === 'sleeping' ? 1.02 : 1.01, 1] }}
        transition={loop(armsUp ? 0.9 : mood === 'sleeping' ? 3.4 : 2.8)}
        style={{ originX: '50%', originY: '100%' }}
      >
        {/* paper silhouette so the cat isn't see-through */}
        <g fill={PAPER}>
          <path d="M60 74 L57 30 L90 50 Z" />
          <path d="M140 74 L143 30 L110 50 Z" />
          <path d="M68 132 C56 150 56 176 64 190 L136 190 C144 176 144 150 132 132 Z" />
          <path d="M52 96 C52 62 74 46 100 46 C126 46 148 62 148 96 C148 124 128 140 100 140 C72 140 52 124 52 96 Z" />
        </g>

        {/* riso colour layer, printed slightly off-register */}
        <g transform="translate(4 3)" className="riso">
          <path d="M70 58 C82 48 118 48 130 58 C122 70 78 70 70 58 Z" fill={TABBY} opacity={0.85} />
          <path d="M62 68 L60 38 L82 52 Z" fill={TABBY} opacity={0.55} />
          <path d="M138 68 L140 38 L118 52 Z" fill={TABBY} opacity={0.55} />
          <path d="M118 140 C138 146 140 172 134 186 L120 186 C124 170 122 152 112 142 Z" fill={TABBY} opacity={0.7} />
          <path d="M64 134 Q100 152 136 134 L138 146 Q100 166 62 146 Z" fill={SCARF} opacity={0.9} />
          <ellipse cx={70} cy={114} rx={8} ry={5} fill={SCARF} opacity={0.35} />
          <ellipse cx={130} cy={114} rx={8} ry={5} fill={SCARF} opacity={0.35} />
        </g>

        {/* tail: a thick paper stroke under the ink line, so it reads on dark pages too */}
        <motion.g
          animate={{ rotate: reduce || mood === 'sleeping' ? 0 : [0, 5, 0] }}
          transition={loop(2.2)}
          style={{ originX: '0%', originY: '100%' }}
        >
          <path d="M136 184 C168 188 182 162 168 148 C160 140 150 148 156 156" {...stroke} stroke={INK} strokeWidth={15} />
          <path d="M136 184 C168 188 182 162 168 148 C160 140 150 148 156 156" {...stroke} stroke={PAPER} strokeWidth={7} />
        </motion.g>

        {/* line work */}
        <path d="M62 72 L57 30 L88 50" {...stroke} />
        <path d="M138 72 L143 30 L112 50" {...stroke} />
        <path d="M52 96 C52 62 74 46 100 46 C126 46 148 62 148 96 C148 124 128 140 100 140 C72 140 52 124 52 96 Z" {...stroke} />
        <path d="M68 134 C56 152 56 176 64 190 L136 190 C144 176 144 152 132 134" {...stroke} />
        <path d="M100 166 L100 190" {...stroke} strokeWidth={3.5} />
        <path d="M94 54 L95 62 M106 54 L105 62" {...stroke} strokeWidth={3.5} />
        <path d="M38 100 L60 104 M40 112 L60 112 M162 100 L140 104 M160 112 L140 112" {...stroke} strokeWidth={3} />
        <path d="M95 104 L105 104 L100 110 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />

        <Face mood={mood} reduce={reduce} loop={loop} />
      </motion.g>

      {mood === 'sleeping' && <Zzz reduce={reduce} />}
      {mood === 'celebrate' && <Ticks reduce={reduce} />}
    </svg>
  );
}

interface FaceProps {
  mood: Mood;
  reduce: boolean;
  loop: (duration: number, extra?: Transition) => Transition;
}

const Dots = ({ dx = 0, dy = 0 }: { dx?: number; dy?: number }) => (
  <>
    <circle cx={80 + dx} cy={92 + dy} r={5} fill={INK} />
    <circle cx={120 + dx} cy={92 + dy} r={5} fill={INK} />
  </>
);

function Face({ mood, reduce, loop }: FaceProps) {
  switch (mood) {
    case 'happy':
      return (
        <>
          <Dots />
          <path d="M90 116 Q95 122 100 116 Q105 122 110 116" {...stroke} strokeWidth={3.5} />
        </>
      );

    case 'worried':
      return (
        <>
          <Dots dy={3} />
          <path d="M70 82 L88 77 M130 82 L112 77" {...stroke} strokeWidth={3.5} />
          <path d="M90 120 Q95 116 100 120 Q105 124 110 120" {...stroke} strokeWidth={3.5} />
          <motion.path
            d="M152 64 Q145 76 152 80 Q159 76 152 64 Z"
            fill="var(--mascot-sky)"
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
            animate={{ y: reduce ? 0 : [0, 4, 0] }}
            transition={loop(1.8)}
          />
        </>
      );

    case 'sleeping':
      return (
        <>
          <path d="M72 94 Q80 100 88 94 M112 94 Q120 100 128 94" {...stroke} strokeWidth={3.5} />
          <path d="M96 118 Q100 121 104 118" {...stroke} strokeWidth={3.5} />
        </>
      );

    case 'reading':
      return (
        <>
          <motion.g animate={{ x: reduce ? 0 : [-2, 2, -2] }} transition={loop(2.6)}>
            <Dots dy={3} />
          </motion.g>
          <circle cx={80} cy={93} r={13} {...stroke} strokeWidth={3.5} />
          <circle cx={120} cy={93} r={13} {...stroke} strokeWidth={3.5} />
          <path d="M93 91 Q100 87 107 91" {...stroke} strokeWidth={3.5} />
          <path d="M96 120 Q100 122 104 120" {...stroke} strokeWidth={3.5} />
          {/* the slip, with a torn receipt edge */}
          <g transform="rotate(-5 100 168)">
            <path d="M74 148 L126 148 L126 186 L120 182 L114 186 L108 182 L102 186 L96 182 L90 186 L84 182 L78 186 L74 182 Z" fill={PAPER} {...{ stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' as const }} />
            <path d="M82 158 L104 158 M82 166 L116 166 M82 174 L98 174" {...stroke} strokeWidth={2.5} />
          </g>
          <path d="M66 164 Q72 156 78 164 M134 164 Q128 156 122 164" {...stroke} strokeWidth={3.5} />
        </>
      );

    case 'celebrate':
      return (
        <>
          <path d="M72 96 Q80 87 88 96 M112 96 Q120 87 128 96" {...stroke} strokeWidth={3.5} />
          <path d="M90 113 Q100 130 110 113 Z" fill={SCARF} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M66 148 L40 116 M134 148 L160 116" {...stroke} />
          <circle cx={38} cy={112} r={7} fill={PAPER} stroke={INK} strokeWidth={3.5} />
          <circle cx={162} cy={112} r={7} fill={PAPER} stroke={INK} strokeWidth={3.5} />
        </>
      );
  }
}

function Zzz({ reduce }: { reduce: boolean }) {
  return (
    <g fill="var(--ink-2)" fontFamily="var(--font-figure)" fontWeight={600}>
      {[
        { x: 150, y: 50, s: 14 },
        { x: 164, y: 34, s: 18 },
        { x: 180, y: 16, s: 22 },
      ].map((l, i) => (
        <motion.text
          key={i}
          x={l.x}
          y={l.y}
          fontSize={l.s}
          initial={false}
          animate={reduce ? { opacity: 0.8 } : { opacity: [0, 1, 0], y: [6, -4, -10] }}
          transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity, delay: i * 0.6 }}
        >
          z
        </motion.text>
      ))}
    </g>
  );
}

/** Short ink ticks around the head, like a hand-drawn "yay". */
function Ticks({ reduce }: { reduce: boolean }) {
  const ticks = ['M30 70 L18 62', 'M28 50 L22 38', 'M170 70 L182 62', 'M172 50 L178 38', 'M100 30 L100 16'];
  return (
    <g {...stroke} strokeWidth={4}>
      {ticks.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--accent)"
          animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </g>
  );
}
