import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { themeBootScript } from './src/design/themes';

export default defineConfig({
  base: './',
  server: { host: true },
  preview: { host: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'], css: { include: [/tokens\.css/] } },
  plugins: [
    react(),
    {
      // apply the saved theme in <head> before the page paints (no flash of the default theme)
      name: 'jotgun-theme-boot',
      transformIndexHtml: (html) => html.replace(/<!-- theme-boot:[^>]*-->/, `<script>${themeBootScript()}</script>`),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'จดกัน',
        short_name: 'จดกัน',
        description: 'จดรายรับรายจ่าย อ่านสลิปให้อัตโนมัติ กับแมวข้าวตัง',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#F4EFE6',
        background_color: '#F4EFE6',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,glb,ico,woff2}'],
        runtimeCaching: [
          {
            // tesseract.js worker, wasm core and language data (the language data is also cached by tesseract itself)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/(tesseract\.js|tesseract\.js-core|@tesseract\.js-data)@?.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-engine',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
