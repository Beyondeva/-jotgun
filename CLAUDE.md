# จดกัน (Jotgun)

Thai personal-expense PWA for iPhone (Safari, added to the home screen) that reads Thai bank-transfer slips.
Live at https://jotgun.vercel.app · repo github.com/Beyondeva/-jotgun · branch `main` (Vercel deploys every push).

## Working with the user
- The user writes in Thai: **reply in Thai**. Code, comments and commit bodies are in English; commit titles may be Thai.
- Large requests come in phases. Finish the phase, report, and **wait for an OK before the next one**.
- The user tests on a real iPhone. For bugs that only show on the device (e.g. flicker), ship A/B toggles for them to try rather than guessing twice.
- Never type the user's passwords. They log in to GitHub and Vercel themselves.
- Never commit real slip images or personal data. Test fixtures are anonymised.
- Don't copy the real app เหมียวจด (its code, images or mascot). The mascot ข้าวตัง is our own design.

## Every change
1. `npx tsc -b`, then `npx vitest run`, then `npm run build`. All must pass.
2. Check the change in Chrome at http://localhost:5173 (`npm run dev`; the phone uses LAN 192.168.x.x:5173). Add test data via `await import('/src/db/db.ts')` in the console, then delete it and `localStorage.removeItem('jotgun:theme')`.
3. Commit with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't commit `tsconfig.tsbuildinfo`.
4. `git push origin main`, then poll until https://jotgun.vercel.app serves the new `assets/index-*.js` hash.

## Stack
Vite 8, React 19, TS 7, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB) + dexie-react-hooks, react-router 8 (HashRouter), framer-motion, Font Awesome Solid (the only icon set), recharts, tesseract.js (tha+eng), jsQR, three.js (mascot only). Tests: Vitest with fake-indexeddb (node env, `src/**/*.test.ts`).

## Map
- `src/app/`: AppLayout (tab bar, add sheet, decor pattern layer), shell context, `app.css` (page and home styles)
- `src/app/responsive.css`: everything that depends on screen size. Phones are the default everywhere else.
  - ≤360px tightens `--gutter` and the figures.
  - ≥720px turns the tab bar into a 96px left rail in page paper (`--rail-w`, and `--nav-bottom` replaces the tab-bar height). A theme's header art becomes a rounded card.
  - ≥1100px makes the rail a 232px sidebar with the wordmark and "จดรายการ". It lays out `.two-col` (home and summary) as a full-width `.two-col__top` row over overview | detail columns. Home moves its top bar there with `useMediaQuery(WIDE)`.
- `src/db/`: Dexie schema (`types.ts`); slips (ingest/confirm/discard), budgets, settings
- `src/slip/`: OCR and QR reading plus a per-bank parser. Fixtures are in `__tests__`
- `src/features/`: home, inbox (รอจด slip cards), manual entry, summary, search, settings, categories, transactions; design-preview (DEV only)
- `src/design/`: `tokens.css` (all colours), `components.css`, `components/` (Money, Sheet, TabBar…), `themes.ts`, `decor/`
- `src/mascot/`: ข้าวตัง, a 3D chubby kitten in toasted-rice gold with browned ear tips, tail tip and forehead marks, and an indigo pencil behind the ear. Its moods are happy, worried, sleeping, reading and celebrate.
  - `KhaoTang.tsx` shows a WebP still. With `live`, it swaps in the three.js model (`live.ts`, lazy-loaded) once that has drawn a frame.
  - Settings has a 3D switch. It follows reduce-motion until the user touches it.
  - Keep `live` to one or two per screen, because each one is a WebGL canvas.
- `tools/blender/khaotang.py`: the source of the mascot. It models the cat, renders the stills, renders the decorated-theme poses and exports `khaotang.glb`. Run it with Blender 5 from `C:\Program Files\Blender Foundation\Blender 5.0` (see the docstring), then run `npx @gltf-transform/cli meshopt` on the GLB. Mood props and poses travel in the GLB as node extras.
- Amounts are stored in satang (integer).

## Design rules (receipt / ledger look)
- Warm paper, ink text, one accent used only for pressable things. Torn-edge receipt paper is for grouping only. No shadows, no gradient heroes, no identical card grids. The user rejected "AI-looking" UI.
- Fonts: IBM Plex Sans Thai Looped (body), Plex Sans Condensed (figures), Plex Mono (reference numbers).
- Prefer an icon alone when its meaning is obvious, and keep `aria-label`. Tap targets are at least 44px.
- Money: `<Money flow="in">` shows ↙ + in the income colour; `flow="out"` shows −. The home hero "ใช้ไปเดือนนี้" has no sign.

## Themes
- Picked in Settings (`ThemePicker`, one radio group). Saved in localStorage `jotgun:theme`. Legacy values light→paper, dark→rain.
- Theme ids:
  - plain: `system` (paper/rain by device), `paper` "สว่าง", `rain` "มืด", `navy` "กรมท่า", `plum` "พลัม"
  - decorated (group ข้าวตัง, never follow the system): `beach` "ทะเลยามค่ำ", `monsoon` "หน้าฝน", `stars` "นอนดูดาว"
- Colours exist only as `[data-theme]` blocks in `tokens.css`. Never hard-code colours in components. Every theme defines every variable.
- An inline `<head>` script, generated from `themes.ts` by the Vite plugin in `vite.config.ts`, applies the theme before first paint and sets `theme-color`.
- `src/design/__tests__/contrast.test.ts` enforces WCAG AA for every theme, checks that the swatches match `tokens.css`, and tests the boot script. Keep it green when changing colours.
- To add a decorated theme:
  - a folder `src/design/decor/<name>/index.tsx` default-exporting `{ Scene, Pattern, tabIcons }` (lazy-loaded via `import.meta.glob`)
  - a tokens block with the extra `--scene-*` and `--bar*` tokens
  - a `THEMES` entry with `decor: '<name>'`
- Rules for decorated themes:
  - The Scene sits behind the plain header text and its ground must fade to `var(--paper)`.
  - The Pattern is tone-on-tone (`--scene-mark*`): fixed, `pointer-events: none`, and stops at the tab bar.
  - Decorate only the header and tab bar. Drawn tab icons keep their labels.
- Reference art lives in `docs/theme-refs/`.

## iOS Safari pitfalls (caused real flicker)
- Avoid framer-motion `whileTap` scale. Use the CSS `:active` tint (`--press`).
- Never fade a full-screen translucent backdrop. The sheet dim appears and disappears instantly.
- Avoid `position: fixed` / `overflow: hidden` body scroll locks, and CSS masks or blend modes on the page behind a sheet.
- A sheet keeps its last children while it closes and pins its layer with `translate3d`.
- The status bar may only pick up `theme-color` at launch. That is still untested on the device.
