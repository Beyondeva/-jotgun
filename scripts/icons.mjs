// App icons from src/assets/logo/app-icon.svg → public/. Run: npm run icons
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { sharpsToIco } from 'sharp-ico';

const src = readFileSync('src/assets/logo/app-icon.svg', 'utf8');
const out = (name) => `public/${name}`;

// iOS and maskable icons get cut by the system, so they need a full square tile (no rounded corners)
const square = src.replace(/ rx="\d+"/, '');
// maskable: the system may crop to a circle of 80% width, so shrink the glyph toward the centre
const maskable = square.replace(/<g transform="([^"]*)">/, '<g transform="translate(256 256) scale(.8) translate(-256 -256) $1">');

const png = (svg, size, name) =>
  sharp(Buffer.from(svg), { density: (72 * size) / 512 })
    .resize(size, size)
    .png()
    .toFile(out(name));

await png(src, 192, 'pwa-192x192.png');
await png(src, 512, 'pwa-512x512.png');
await png(maskable, 512, 'maskable-icon-512x512.png');
await png(square, 180, 'apple-touch-icon-180x180.png');
writeFileSync(out('favicon.svg'), src);
await sharpsToIco([sharp(Buffer.from(src), { density: 72 * 32 / 512 }).resize(32, 32)], out('favicon.ico'));
console.log('icons written to public/');
