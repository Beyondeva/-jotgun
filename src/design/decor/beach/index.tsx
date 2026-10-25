import cat from '../../../mascot/renders/khaotang-beach.webp';
import type { Decor } from '..';

/**
 * ข้าวตังเที่ยวทะเลยามค่ำ — night beach. Reference: docs/theme-refs/khaotang-beach-reference.html
 * The art keeps its own colours (it's a picture); the sky behind the header text,
 * the sand's last stop and the content motifs come from theme tokens so the
 * contrast test can check them. The cat is the real mascot, holding an ice cream, lit for night.
 */

const LINE = 'var(--mascot-ink)';

function Scene() {
  return (
    <>
      {/* sky: 560 wide (the page's max width); phones crop from the left, keeping the moon */}
      <svg className="decor-scene__sky" viewBox="0 0 560 300" preserveAspectRatio="xMaxYMin slice" aria-hidden>
        <defs>
          <linearGradient id="beach-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--scene-sky-top)" />
            <stop offset="0.35" stopColor="var(--scene-sky)" />
          </linearGradient>
        </defs>
        <rect width="560" height="300" fill="url(#beach-sky)" />
        <circle cx="468" cy="56" r="18" fill="#f6df6b" />
        <circle cx="476" cy="50" r="15" fill="var(--scene-sky-top)" />
        <g fill="#fffcf6">
          <circle cx="420" cy="26" r="1" />
          <circle cx="530" cy="88" r="1.2" />
          <circle cx="400" cy="84" r="1.3" />
          <circle cx="352" cy="20" r="1" />
          <circle cx="510" cy="30" r="1" />
          <circle cx="250" cy="40" r="1.2" />
          <circle cx="120" cy="22" r="1" />
          <circle cx="60" cy="70" r="1.3" />
        </g>
      </svg>

      {/* sea, sand fading into the page, and the cat; text never reaches below its top 60px */}
      <svg className="decor-scene__floor" viewBox="-170 0 560 170" preserveAspectRatio="xMaxYMax slice" aria-hidden>
        <defs>
          <linearGradient id="beach-sand" gradientUnits="userSpaceOnUse" x1="0" y1="108" x2="0" y2="170">
            <stop offset="0" stopColor="#8a6a46" />
            <stop offset="0.45" stopColor="#5a4430" />
            <stop offset="1" stopColor="var(--paper)" />
          </linearGradient>
        </defs>
        <path d="M-200 80 Q -173 72 -146 80 T -92 80 T -38 80 T 16 80 T 70 80 T 124 80 T 178 80 T 232 80 T 286 80 T 340 80 T 394 80 V 170 H -200 Z" fill="#1d3b5c" />
        <path d="M-180 94 Q -148 86 -116 94 T -52 94 T 12 94 T 76 94 T 140 94 T 204 94 T 268 94 T 332 94 T 396 94 V 170 H -180 Z" fill="#245074" />
        <g stroke="#7fb3d9" strokeWidth="1.5" fill="none" opacity=".7" strokeLinecap="round">
          <path d="M150 90 Q 162 86 174 90" />
          <path d="M-60 98 Q -48 94 -36 98" />
        </g>
        <path d="M-170 118 Q -60 104 40 114 T 220 112 T 390 110 V 170 H -170 Z" fill="url(#beach-sand)" />
        <g fill="#a07c52" opacity=".5">
          <circle cx="-90" cy="124" r="1" />
          <circle cx="60" cy="122" r="1" />
          <circle cx="340" cy="120" r="1" />
        </g>

        {/* palm */}
        <path d="M368 150 C 362 124 362 104 370 84" stroke="#4a3626" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill="#1f4a35">
          <path d="M370 84 C 350 74 332 82 324 96 C 340 86 355 86 370 86 Z" />
          <path d="M370 84 C 388 72 400 78 400 86 C 390 82 382 84 370 87 Z" />
          <path d="M370 84 C 362 66 348 60 336 64 C 352 68 362 76 368 86 Z" />
          <path d="M370 84 C 380 66 396 62 400 66 C 388 70 380 78 372 86 Z" />
        </g>

        <g transform="translate(218 140)">
          <circle r="10" fill="#fffcf6" stroke={LINE} strokeWidth="1.5" />
          <path d="M0 -10 A10 10 0 0 1 10 0 L0 0 Z" fill="#c2471f" />
          <path d="M0 10 A10 10 0 0 1 -10 0 L0 0 Z" fill="#3f78a6" />
          <circle r="2.4" fill="#fffcf6" stroke={LINE} strokeWidth="1" />
        </g>
        <path transform="translate(176 148)" fill="#e8693f" d="M0 -7 L 2 -2.3 L 7 -2 L 3.1 1.6 L 4.3 6.6 L 0 3.9 L -4.3 6.6 L -3.1 1.6 L -7 -2 L -2 -2.3 Z" />

        {/* ข้าวตัง on the sand, ice cream in paw (rendered by tools/blender/khaotang.py) */}
        <image href={cat} x="252" y="60" width="112" height="112" />
      </svg>
    </>
  );
}

/** The same beach at your feet: starfish, shells, paw prints and grains, barely lighter than the sand. */
function Pattern() {
  return (
    <svg aria-hidden>
      <defs>
        <pattern id="beach-pattern" width="320" height="420" patternUnits="userSpaceOnUse">
          <g fill="var(--scene-mark)">
            <path d="M40 60 L 44 70 L 55 71 L 47 78 L 50 89 L 40 83 L 30 89 L 33 78 L 25 71 L 36 70 Z" />
            <path d="M250 40 C 236 40 232 58 238 70 L 262 70 C 268 58 264 40 250 40 Z" />
            <path d="M270 200 L 274 210 L 285 211 L 277 218 L 280 229 L 270 223 L 260 229 L 263 218 L 255 211 L 266 210 Z" />
            <path d="M60 260 C 46 260 42 278 48 290 L 72 290 C 78 278 74 260 60 260 Z" />
            <path d="M200 360 C 190 360 187 373 191 382 L 209 382 C 213 373 210 360 200 360 Z" />
            <ellipse cx="150" cy="140" rx="5" ry="3" />
            <ellipse cx="158" cy="132" rx="4" ry="2.5" />
            <ellipse cx="166" cy="146" rx="5" ry="3" />
            <ellipse cx="174" cy="138" rx="4" ry="2.5" />
          </g>
          <g fill="var(--scene-mark-2)">
            <circle cx="22" cy="20" r="1.2" />
            <circle cx="96" cy="34" r="1" />
            <circle cx="180" cy="22" r="1.3" />
            <circle cx="300" cy="100" r="1" />
            <circle cx="110" cy="190" r="1.2" />
            <circle cx="230" cy="250" r="1" />
            <circle cx="30" cy="330" r="1.3" />
            <circle cx="140" cy="300" r="1" />
            <circle cx="290" cy="320" r="1.2" />
            <circle cx="80" cy="400" r="1" />
            <circle cx="250" cy="400" r="1.2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#beach-pattern)" />
    </svg>
  );
}

const S = { stroke: '#4a3626', strokeLinejoin: 'round' as const };

const tabIcons: Decor['tabIcons'] = {
  home: () => (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden>
      <path d="M3 25 V12 H7 V8 H11 V12 H19 V8 H23 V12 H27 V25 Z" fill="#e8c792" strokeWidth="1.5" {...S} />
      <path d="M13 25 V19 A2 2 0 0 1 17 19 V25" fill="#4a3626" />
      <path d="M15 8 V2 L20 4 L15 6" fill="#e8693f" strokeWidth="1" {...S} />
    </svg>
  ),
  inbox: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M14 3 C 6 3 3 12 4 22 L 24 22 C 25 12 22 3 14 3 Z" fill="#f4c9b5" strokeWidth="1.5" {...S} />
      <path d="M14 4 V22 M9 6 L7 22 M19 6 L21 22" strokeWidth="1.2" {...S} />
    </svg>
  ),
  add: () => (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="22" fill="#fffcf6" strokeWidth="2" {...S} />
      <circle cx="25" cy="25" r="11" fill="#a07c52" strokeWidth="2" {...S} />
      <g fill="#ff7a59">
        <path d="M25 3 A22 22 0 0 1 40.6 9.4 L 32.8 17.2 A11 11 0 0 0 25 14 Z" />
        <path d="M47 25 A22 22 0 0 1 40.6 40.6 L 32.8 32.8 A11 11 0 0 0 36 25 Z" />
        <path d="M25 47 A22 22 0 0 1 9.4 40.6 L 17.2 32.8 A11 11 0 0 0 25 36 Z" />
        <path d="M3 25 A22 22 0 0 1 9.4 9.4 L 17.2 17.2 A11 11 0 0 0 14 25 Z" />
      </g>
      <circle cx="25" cy="25" r="22" fill="none" strokeWidth="2" {...S} />
      <path d="M25 19 V31 M19 25 H31" stroke="#fffcf6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  summary: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <rect x="3" y="14" width="5" height="10" rx="1" fill="#7fb3d9" strokeWidth="1.3" {...S} />
      <rect x="11.5" y="8" width="5" height="16" rx="1" fill="#f6df6b" strokeWidth="1.3" {...S} />
      <rect x="20" y="3" width="5" height="21" rx="1" fill="#ff7a59" strokeWidth="1.3" {...S} />
    </svg>
  ),
  settings: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M14 2 L 17.2 9.4 L 25.4 10.2 L 19.2 15.6 L 21 23.6 L 14 19.4 L 7 23.6 L 8.8 15.6 L 2.6 10.2 L 10.8 9.4 Z" fill="#e8693f" strokeWidth="1.4" {...S} />
      <circle cx="14" cy="13" r="2" fill="#fffcf6" />
    </svg>
  ),
};

const beach: Decor = { Scene, Pattern, tabIcons };
export default beach;
