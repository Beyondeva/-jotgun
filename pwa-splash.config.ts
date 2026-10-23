import { createAppleSplashScreens, defineConfig } from '@vite-pwa/assets-generator/config';

// iOS launch screens: the cat's face on paper (light) or espresso (dark).
// Run with `npm run splash`; paste the printed <link> tags into index.html when devices change.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [], favicons: [] },
    maskable: { sizes: [] },
    apple: { sizes: [] },
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.62,
        resizeOptions: { background: '#F4EFE6', fit: 'contain' },
        darkResizeOptions: { background: '#191612', fit: 'contain' },
        linkMediaOptions: { log: true, addMediaScreen: true, basePath: './', xhtml: false },
        png: { compressionLevel: 9, quality: 70 },
        name: (landscape, size, dark) => `splash/${landscape ? 'l' : 'p'}-${size.width}x${size.height}${dark ? '-dark' : ''}.png`,
      },
      ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16e', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 13 mini', 'iPhone 11', 'iPhone 11 Pro Max', 'iPhone 8 Plus', 'iPhone 8'],
    ),
  },
  images: ['public/splash-mark.svg'],
});
