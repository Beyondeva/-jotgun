import { useRef } from 'react';
import cat from '../../../mascot/renders/khaotang-monsoon.webp';
import glb from '../../../mascot/renders/scene-monsoon.glb?url';
import { SceneLive } from '../../../mascot/SceneLive';
import { scatter, WIDE_LEFT, type Decor } from '..';

/**
 * ข้าวตังหน้าฝน — rainy season. Reference: docs/theme-refs/khaotang-rain-reference.html
 * Overcast sky, rain, a wet road fading into the page, and the real mascot under a
 * yellow umbrella in yellow boots.
 */

const RAIN = '#7fa3b3';
// wide screens only: the sky, rain and road carried on to the left (see WIDE_LEFT)
const FAR_RAIN = scatter(90, WIDE_LEFT, 220, 40, 190, 5);
const FAR_PUDDLES = scatter(10, WIDE_LEFT, -200, 138, 160, 9);

function Scene() {
  const still = useRef<SVGImageElement>(null);
  return (
    <>
      <svg className="decor-scene__sky" viewBox="0 0 560 300" preserveAspectRatio="xMaxYMin slice" aria-hidden>
        <defs>
          <linearGradient id="monsoon-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--scene-sky-top)" />
            <stop offset="0.3" stopColor="var(--scene-sky)" />
          </linearGradient>
        </defs>
        <rect x={WIDE_LEFT} width={560 - WIDE_LEFT} height="300" fill="url(#monsoon-sky)" />
        <g fill="#2a3a42">
          <ellipse cx="490" cy="34" rx="46" ry="18" />
          <ellipse cx="540" cy="44" rx="34" ry="16" />
          <ellipse cx="440" cy="44" rx="30" ry="13" />
        </g>
        <g fill="var(--scene-cloud)">
          <ellipse cx="502" cy="46" rx="40" ry="14" />
          <ellipse cx="400" cy="22" rx="26" ry="10" />
        </g>
        <g stroke={RAIN} strokeWidth="1.4" strokeLinecap="round" opacity=".35">
          {[
            [390, 60], [430, 70], [466, 66], [512, 72], [546, 66], [410, 104], [450, 112], [540, 110],
            [380, 140], [426, 150], [350, 92], [320, 150], [270, 170], [360, 176], [500, 160], [230, 120],
          ].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y} l-6 14`} />
          ))}
          {FAR_RAIN.map(([x, y], i) => (
            <path key={`far${i}`} d={`M${x} ${y} l-6 14`} />
          ))}
        </g>
      </svg>

      <svg className="decor-scene__floor" viewBox="-170 0 560 170" preserveAspectRatio="xMaxYMax slice" aria-hidden>
        <defs>
          <linearGradient id="monsoon-road" gradientUnits="userSpaceOnUse" x1="0" y1="106" x2="0" y2="170">
            <stop offset="0" stopColor="#2a3a40" />
            <stop offset="1" stopColor="var(--paper)" />
          </linearGradient>
        </defs>
        <g stroke={RAIN} strokeWidth="1.4" strokeLinecap="round" opacity=".35">
          <path d="M120 70 l-6 14" />
          <path d="M200 80 l-6 14" />
          <path d="M-40 84 l-6 14" />
          <path d="M60 90 l-6 14" />
        </g>
        <path d={`M${WIDE_LEFT} 116 H -170 Q -60 106 40 112 T 220 110 T 390 108 V 170 H ${WIDE_LEFT} Z`} fill="url(#monsoon-road)" />
        {FAR_PUDDLES.map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={22 + (i % 3) * 8} ry="4" fill="#2d4652" opacity=".7" />
        ))}
        <ellipse cx="300" cy="158" rx="54" ry="8" fill="#2d4652" />
        <g fill="none" stroke="#5d8191" strokeWidth="1.2" opacity=".8">
          <ellipse cx="270" cy="158" rx="9" ry="2.5" />
          <ellipse cx="270" cy="158" rx="16" ry="4.5" opacity=".5" />
          <ellipse cx="330" cy="160" rx="7" ry="2" />
        </g>
        <ellipse cx="130" cy="146" rx="26" ry="4" fill="#2d4652" opacity=".7" />

        {/* ข้าวตัง under a yellow umbrella, in yellow boots (rendered by tools/blender/khaotang.py) */}
        <image ref={still} href={cat} x="234" y="39" width="116" height="136" />
      </svg>
      <SceneLive still={still} glb={glb} />
    </>
  );
}

/** The wet road carried on: puddles, ripples, rain and drops, barely lighter than the page. */
function Pattern() {
  return (
    <svg aria-hidden>
      <defs>
        <pattern id="monsoon-pattern" width="320" height="420" patternUnits="userSpaceOnUse">
          <g fill="var(--scene-mark)">
            <ellipse cx="60" cy="40" rx="40" ry="7" />
            <ellipse cx="250" cy="120" rx="52" ry="8" />
            <ellipse cx="90" cy="230" rx="46" ry="7" />
            <ellipse cx="240" cy="330" rx="44" ry="7" />
            <ellipse cx="60" cy="400" rx="36" ry="6" />
          </g>
          <g fill="none" stroke="var(--scene-mark-2)" strokeWidth="1.2">
            <ellipse cx="48" cy="40" rx="8" ry="2" />
            <ellipse cx="48" cy="40" rx="15" ry="3.6" />
            <ellipse cx="262" cy="120" rx="9" ry="2.2" />
            <ellipse cx="262" cy="120" rx="17" ry="4" />
            <ellipse cx="100" cy="230" rx="8" ry="2" />
            <ellipse cx="228" cy="330" rx="10" ry="2.4" />
          </g>
          <g stroke="var(--scene-mark-2)" strokeWidth="1.4" strokeLinecap="round">
            <path d="M150 20 l-5 12" />
            <path d="M300 30 l-5 12" />
            <path d="M180 180 l-5 12" />
            <path d="M20 140 l-5 12" />
            <path d="M300 240 l-5 12" />
            <path d="M150 290 l-5 12" />
            <path d="M170 390 l-5 12" />
          </g>
          <g fill="var(--scene-mark-2)">
            <path d="M200 60 q 6 9 0 13 q -6 -4 0 -13 Z" />
            <path d="M40 300 q 6 9 0 13 q -6 -4 0 -13 Z" />
            <path d="M290 400 q 6 9 0 13 q -6 -4 0 -13 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#monsoon-pattern)" />
    </svg>
  );
}

const tabIcons: Decor['tabIcons'] = {
  home: () => (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden>
      <path d="M4 13 L15 4 L26 13 V24 H4 Z" fill="#33454e" stroke="#eef3f4" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 24 V17 H18 V24" stroke="#eef3f4" strokeWidth="1.5" fill="#ffb347" />
      <path d="M8 2 q2 3 0 4 q-2 -1 0 -4 Z M24 0 q2 3 0 4 q-2 -1 0 -4 Z" fill={RAIN} />
    </svg>
  ),
  inbox: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M8 3 H16 V16 L23 18 A3 3 0 0 1 23 24 H8 Z" fill="#ffb347" stroke="#4a3626" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 8 H16" stroke="#4a3626" strokeWidth="1.2" />
    </svg>
  ),
  add: () => (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="23" fill="#ffb347" stroke="#1f1b17" strokeWidth="2" />
      <path d="M11 26 Q 13 12 25 11 Q 37 12 39 26 Q 36 23 32 26 Q 28 23 25 26 Q 22 23 18 26 Q 14 23 11 26 Z" fill="#1a2428" />
      <path d="M25 26 V35 q 0 3 -3 3" stroke="#1a2428" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  summary: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M5 24 V16 q 0 -3 2.5 -3 q 2.5 0 2.5 3 V24 Z" fill="#5f9fd6" stroke="#eef3f4" strokeWidth="1.3" />
      <path d="M11.5 24 V10 q 0 -3 2.5 -3 q 2.5 0 2.5 3 V24 Z" fill={RAIN} stroke="#eef3f4" strokeWidth="1.3" />
      <path d="M18 24 V5 q 0 -3 2.5 -3 q 2.5 0 2.5 3 V24 Z" fill="#ffb347" stroke="#eef3f4" strokeWidth="1.3" />
    </svg>
  ),
  settings: () => (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden>
      <path d="M7 20 a6 6 0 0 1 1 -12 a7 7 0 0 1 13 1 a5.5 5.5 0 0 1 0 11 Z" fill="#33454e" stroke="#eef3f4" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="14" cy="14" r="2.4" fill="#ffb347" />
    </svg>
  ),
};

const monsoon: Decor = { Scene, Pattern, tabIcons };
export default monsoon;
