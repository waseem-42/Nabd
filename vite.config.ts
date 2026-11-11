import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'brand/*.svg', 'icons/*.png'],
      manifest: {
        name: 'نبض — على إيقاعك',
        short_name: 'نبض',
        description: 'تمارينك في البيت والنادي، بخطة واضحة وتقدّم تشوفه.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#111310',
        theme_color: '#111310',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + catalogue are precached; exercise art is fetched on demand and kept.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['art/**'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/art/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'nabd-art',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived chunks: libraries and the exercise catalogue change far less often than
        // app code, so an update doesn't make phones re-download them.
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|dexie|dexie-react-hooks|zustand|use-sync-external-store)[\\/]/ },
            { name: 'catalog-ar', test: /src[\\/]data[\\/]exercises\.ar\.json/ },
            { name: 'catalog', test: /src[\\/]data[\\/].*\.json/ },
          ],
        },
      },
    },
  },
  server: { port: 5173, strictPort: false },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
