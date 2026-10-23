import { KhaoTang } from '../../../mascot/KhaoTang';
import type { Decor } from '..';

/**
 * ข้าวตังเที่ยวทะเลยามค่ำ — night beach. Reference: docs/theme-refs/khaotang-beach-reference.html
 * The art keeps its own colours (it's a picture); everything you read sits on the
 * theme tokens. The cat is the real mascot, holding an ice cream.
 */

const LINE = 'var(--mascot-ink)';

function Scene() {
  return (
    // drawn 560 wide (the page's max width); phones crop the open sea on the left, never the cat
    <svg className="decor-scene" viewBox="-170 0 560 250" preserveAspectRatio="xMaxYMax slice" aria-hidden>
      <rect x="-170" width="560" height="250" fill="#14213a" />
      <rect x="-170" width="560" height="70" fill="#101a2f" />
      <circle cx="226" cy="52" r="20" fill="#f6df6b" />
      <circle cx="234" cy="46" r="17" fill="#14213a" />
      <g fill="#fffcf6">
        <circle cx="190" cy="98" r="1.2" />
        <circle cx="262" cy="22" r="1" />
        <circle cx="300" cy="62" r="1.4" />
        <circle cx="352" cy="30" r="1" />
        <circle cx="372" cy="88" r="1.2" />
        <circle cx="200" cy="18" r="1" />
        <circle cx="30" cy="30" r="1.3" />
        <circle cx="120" cy="16" r="1" />
        <circle cx="-60" cy="44" r="1.2" />
        <circle cx="-130" cy="20" r="1" />
        <circle cx="-150" cy="96" r="1.3" />
      </g>

      <path d="M-200 150 Q -175 142 -150 150 T -100 150 T -50 150 T 0 150 T 50 150 T 100 150 T 150 150 T 200 150 T 250 150 T 300 150 T 350 150 T 400 150 V 250 H -200 Z" fill="#1d3b5c" />
      <path d="M-180 165 Q -150 157 -120 165 T -60 165 T 0 165 T 60 165 T 120 165 T 180 165 T 240 165 T 300 165 T 360 165 T 420 165 V 250 H -180 Z" fill="#245074" />
      <g stroke="#7fb3d9" strokeWidth="1.5" fill="none" opacity=".7" strokeLinecap="round">
        <path d="M190 160 Q 202 156 214 160" />
        <path d="M300 170 Q 312 166 324 170" />
        <path d="M40 172 Q 52 168 64 172" />
      </g>

      <path d="M-170 194 Q -60 206 40 198 T 210 196 T 390 188 V 250 H -170 Z" fill="#8a6a46" />
      <path d="M-170 210 Q -60 218 40 212 T 220 210 T 390 204 V 250 H -170 Z" fill="#a07c52" />

      {/* palm */}
      <path d="M368 214 C 362 174 362 144 370 114" stroke="#4a3626" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g fill="#1f4a35">
        <path d="M370 114 C 350 104 332 112 324 126 C 340 116 355 116 370 116 Z" />
        <path d="M370 114 C 388 102 400 108 400 116 C 390 112 382 114 370 117 Z" />
        <path d="M370 114 C 362 96 348 90 336 94 C 352 98 362 106 368 116 Z" />
        <path d="M370 114 C 380 96 396 92 400 96 C 388 100 380 108 372 116 Z" />
      </g>

      {/* beach ball */}
      <g transform="translate(222 218)">
        <circle r="11" fill="#fffcf6" stroke={LINE} strokeWidth="1.5" />
        <path d="M0 -11 A11 11 0 0 1 11 0 L0 0 Z" fill="#c2471f" />
        <path d="M0 11 A11 11 0 0 1 -11 0 L0 0 Z" fill="#3f78a6" />
        <circle r="2.6" fill="#fffcf6" stroke={LINE} strokeWidth="1" />
      </g>
      <path transform="translate(186 232)" fill="#e8693f" d="M0 -8 L 2.2 -2.7 L 8 -2.2 L 3.6 1.8 L 4.9 7.6 L 0 4.5 L -4.9 7.6 L -3.6 1.8 L -8 -2.2 L -2.2 -2.7 Z" />

      {/* ข้าวตัง on the sand, ice cream in paw */}
      <g transform="translate(246 106) scale(0.6)">
        <KhaoTang mood="happy" size={200} />
      </g>
      <g transform="translate(266 190) rotate(-18)">
        <path d="M0 8 L 7 30 L 14 8 Z" fill="#d9a35b" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M3 14 L 11 14 M4.5 20 L 9.5 20" stroke={LINE} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7" cy="4" r="7.5" fill="#f4a6c0" stroke={LINE} strokeWidth="1.8" />
      </g>
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

const beach: Decor = { Scene, tabIcons };
export default beach;
