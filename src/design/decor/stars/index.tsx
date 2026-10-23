import type { CSSProperties } from 'react';
import type { Decor } from '..';

/**
 * ข้าวตังนอนดูดาว — lying on the roof ridge under a starry sky.
 * Reference: docs/theme-refs/khaotang-stargazing-reference.html
 * The sky is a CSS wash ending exactly on var(--paper); the roof fades into it too.
 */

const INK = 'var(--mascot-ink)';
const PAPER = 'var(--mascot-paper)';
const TABBY = 'var(--mascot-tabby)';
const SCARF = 'var(--mascot-accent)';
const GOLD = '#ffd166';

const line = { fill: 'none', stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/**
 * ข้าวตัง lying on its tummy, looking up: a long loaf body, the head at the front,
 * the tail curled high. Head, ears, tabby cap and scarf follow src/mascot/KhaoTang.tsx
 * (its 200-unit grid); body and tail are drawn the same way, ink line over a paper fill.
 */
function LyingKhaoTang() {
  const body = 'M118 128 C 150 106 292 102 320 128 C 340 146 334 184 302 188 L 122 188 C 104 178 102 142 118 128 Z';
  const head = 'M52 96 C52 62 74 46 100 46 C126 46 148 62 148 96 C148 124 128 140 100 140 C72 140 52 124 52 96 Z';
  const tail = 'M316 150 C 352 140 358 92 346 62 C 340 46 326 40 316 50';
  return (
    <g>
      {/* tail: thick ink under a paper stroke, as in KhaoTang, with tabby bands */}
      <path d={tail} {...line} strokeWidth={16} />
      <path d={tail} {...line} stroke={PAPER} strokeWidth={8} />
      <path d="M342 118 L 356 112 M348 92 L 362 90 M342 64 L 354 58" stroke={TABBY} strokeWidth={5} strokeLinecap="round" />

      <path d={body} fill={PAPER} />
      <path d="M186 126 Q 226 110 262 120" stroke={TABBY} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d={body} {...line} />
      {/* paws: one under the chin, one under the tummy */}
      <ellipse cx={92} cy={188} rx={19} ry={9} {...line} fill={PAPER} strokeWidth={4} />
      <ellipse cx={214} cy={190} rx={19} ry={9} {...line} fill={PAPER} strokeWidth={4} />

      {/* scarf round the neck: drawn before the head so the chin covers its top edge,
          only as wide as the neck, and outlined so it sits on the cat instead of floating */}
      <path d="M72 124 Q 104 144 140 120 L 146 136 Q 106 162 68 140 Z" fill={SCARF} {...{ stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' as const }} />

      {/* head */}
      <g fill={PAPER}>
        <path d="M60 74 L57 30 L90 50 Z" />
        <path d="M140 74 L143 30 L110 50 Z" />
        <path d={head} />
      </g>
      <path d="M70 58 C82 48 118 48 130 58 C122 70 78 70 70 58 Z" fill={TABBY} opacity={0.9} />
      <path d="M62 68 L60 38 L82 52 Z" fill={TABBY} opacity={0.55} />
      <path d="M138 68 L140 38 L118 52 Z" fill={TABBY} opacity={0.55} />
      <ellipse cx={70} cy={112} rx={9} ry={6} fill={SCARF} opacity={0.35} />
      <ellipse cx={130} cy={112} rx={9} ry={6} fill={SCARF} opacity={0.35} />
      <path d="M62 72 L57 30 L88 50" {...line} />
      <path d="M138 72 L143 30 L112 50" {...line} />
      <path d={head} {...line} />

      {/* eyes turned up, with a highlight */}
      <circle cx={80} cy={88} r={7} fill={INK} />
      <circle cx={120} cy={88} r={7} fill={INK} />
      <circle cx={82.5} cy={85.5} r={2.4} fill={PAPER} />
      <circle cx={122.5} cy={85.5} r={2.4} fill={PAPER} />
      <path d="M96 106 L104 106 L100 111 Z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

/** A four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r} l${r / 3} ${(r * 2) / 3} l${(r * 2) / 3} ${r / 3} l${(-r * 2) / 3} ${r / 3} l${-r / 3} ${(r * 2) / 3} l${-r / 3} ${(-r * 2) / 3} l${(-r * 2) / 3} ${-r / 3} l${(r * 2) / 3} ${-r / 3} Z`;

const twinkle = (delay: number): CSSProperties => ({ animationDelay: `${delay}s` });

const STARS: [number, number, number][] = [
  [408, 18, 1.2], [438, 40, 1], [462, 16, 1.4], [490, 34, 1], [522, 18, 1.2], [546, 44, 1], [426, 76, 1],
  [478, 70, 1.3], [540, 86, 1.1], [400, 104, 1], [450, 112, 1.2], [380, 140, 1], [360, 20, 1], [336, 10, 0.9],
  [390, 58, 0.9], [300, 30, 1.1], [250, 12, 0.9], [200, 44, 1], [150, 18, 1], [90, 36, 0.9], [40, 14, 1.1], [20, 60, 0.9],
];

function Scene() {
  return (
    <>
      <div className="decor-scene__sky" style={{ background: 'linear-gradient(var(--scene-sky-top), var(--paper))' }} />

      <svg className="decor-scene__sky" viewBox="0 0 560 300" preserveAspectRatio="xMaxYMin slice" aria-hidden>
        <defs>
          <linearGradient id="stars-meteor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GOLD} stopOpacity="0" />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>
        {/* the milky way: --scene-cloud is what it adds up to where both bands overlap */}
        <path d="M390 0 C 450 60 490 70 560 60 V 0 Z" fill="#3a3b7a" opacity=".35" />
        <path d="M440 0 C 480 40 520 44 560 40 V 0 Z" fill="#4a4b8f" opacity=".25" />
        <g fill="#fffcf6">
          {STARS.map(([x, y, r], i) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className={i % 4 === 0 ? 'decor-twinkle' : undefined} style={i % 4 === 0 ? twinkle(i * 0.37) : undefined} />
          ))}
        </g>
        <g fill={GOLD}>
          <path d={sparkle(502, 58, 8)} className="decor-twinkle" style={twinkle(0.4)} />
          <path d={sparkle(540, 122, 4.8)} className="decor-twinkle" style={twinkle(1.6)} />
          <path d={sparkle(332, 96, 4)} className="decor-twinkle" style={twinkle(2.4)} />
        </g>
        <path d="M430 22 L 476 40" stroke="url(#stars-meteor)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="476" cy="40" r="1.8" fill={GOLD} />
      </svg>

      {/* the roof on the right, fading into the page; header text never reaches below y 62 */}
      <svg className="decor-scene__floor" viewBox="-170 0 560 170" preserveAspectRatio="xMaxYMax slice" aria-hidden>
        <defs>
          <linearGradient id="stars-roof-fade" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="170">
            <stop offset="0" stopColor="var(--paper)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--paper)" />
          </linearGradient>
        </defs>
        <circle cx="-110" cy="150" r="1" fill="#fffcf6" />
        <circle cx="20" cy="132" r="0.9" fill="#fffcf6" />
        <path d={sparkle(110, 128, 4.5)} fill={GOLD} className="decor-twinkle" style={twinkle(1.1)} />

        <path d="M236 170 L 284 106 L 400 88 V 170 Z" fill="#3a2f5c" />
        <g stroke="#2b2347" strokeWidth="1.4">
          <path d="M260 170 L 296 116" />
          <path d="M286 170 L 316 112" />
          <path d="M314 170 L 338 108" />
          <path d="M342 170 L 360 104" />
          <path d="M370 170 L 382 100" />
          <path d="M266 136 L 400 117" />
          <path d="M252 156 L 400 140" />
        </g>
        <path d="M284 106 L 400 88" stroke="#4b3d73" strokeWidth="5" strokeLinecap="round" />
        <rect x="226" y="120" width="180" height="50" fill="url(#stars-roof-fade)" />

        <g transform="translate(240 48) rotate(-8) scale(0.38)">
          <LyingKhaoTang />
        </g>
      </svg>
    </>
  );
}

/** The same night sky carried on: dots, sparkles, a ringed planet and two constellations, a shade lighter than the page. */
function Pattern() {
  const dots: [number, number, number][] = [
    [30, 30, 1.6], [140, 16, 1.2], [290, 60, 1.6], [210, 98, 1.2], [60, 140, 1.4], [300, 170, 1.2], [170, 200, 1.6],
    [24, 250, 1.2], [250, 270, 1.4], [110, 320, 1.6], [300, 350, 1.2], [190, 400, 1.4], [40, 390, 1.2],
  ];
  const lines = [
    [[180, 300], [210, 286], [236, 296], [252, 276], [280, 282]],
    [[140, 100], [160, 130], [196, 122]],
  ];
  return (
    <svg aria-hidden>
      <defs>
        <pattern id="stars-pattern" width="320" height="420" patternUnits="userSpaceOnUse">
          <g fill="var(--scene-mark)">
            {dots.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g stroke="var(--scene-mark)" strokeWidth="1.2" fill="none">
            {lines.map((pts) => (
              <path key={pts[0].join()} d={`M${pts.map((p) => p.join(' ')).join(' L ')}`} />
            ))}
          </g>
          <g fill="var(--scene-mark-2)">
            <path d={sparkle(250, 34, 10)} />
            <path d={sparkle(80, 218, 8)} />
            <path d={sparkle(280, 310, 10)} />
            <circle cx="60" cy="80" r="11" />
            {lines.flat().map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
            ))}
          </g>
          <ellipse cx="60" cy="80" rx="20" ry="5" fill="none" stroke="var(--scene-mark-2)" strokeWidth="2.2" transform="rotate(-18 60 80)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#stars-pattern)" />
    </svg>
  );
}

const tabIcons: Decor['tabIcons'] = {
  home: () => (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden>
      <path d="M4 13 L15 4 L26 13 V24 H4 Z" fill="#3a2f5c" stroke="#f0eefa" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="12" y="14" width="6" height="6" rx="1" fill={GOLD} />
    </svg>
  ),
  inbox: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M18 3 A10 10 0 1 0 25 18 A8 8 0 0 1 18 3 Z" fill="#c9c6e4" stroke="#f0eefa" strokeWidth="1.3" />
    </svg>
  ),
  add: () => (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="23" fill={GOLD} stroke="#121331" strokeWidth="2" />
      <path d="M25 9 l4 10 l10 1.5 l-7.5 7 l2 10.5 l-8.5 -5 l-8.5 5 l2 -10.5 l-7.5 -7 l10 -1.5 Z" fill="#121331" />
      <path d="M25 21 V31 M20 26 H30" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  summary: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M4 21 L 11 13 L 17 17 L 24 5" stroke="#a6a3c8" strokeWidth="1.4" fill="none" />
      <circle cx="4" cy="21" r="2.4" fill="#f0eefa" />
      <circle cx="11" cy="13" r="2.4" fill="#f0eefa" />
      <circle cx="17" cy="17" r="2.4" fill="#f0eefa" />
      <circle cx="24" cy="5" r="2.8" fill={GOLD} />
    </svg>
  ),
  settings: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <circle cx="14" cy="13" r="7" fill="#7b6fd0" stroke="#f0eefa" strokeWidth="1.3" />
      <ellipse cx="14" cy="13" rx="13" ry="4" fill="none" stroke={GOLD} strokeWidth="1.6" transform="rotate(-18 14 13)" />
    </svg>
  ),
};

const stars: Decor = { Scene, Pattern, tabIcons };
export default stars;
