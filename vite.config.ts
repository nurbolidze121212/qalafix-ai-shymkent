import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sites } from '@openai/sites-vite-plugin'
import { cloudflare } from '@cloudflare/vite-plugin'

const publicBase = process.env.GITHUB_PAGES === 'true' ? '/qalafix-ai-shymkent/' : '/'

export default defineConfig({
  base: publicBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['qalafix.svg', 'icons/qalafix-192-v2.png', 'icons/qalafix-512-v2.png'],
      manifest: {
        name: 'QalaFix AI — городской помощник',
        short_name: 'QalaFix AI',
        description: 'Сообщайте о городских проблемах по фотографии.',
        lang: 'ru',
        start_url: publicBase,
        scope: publicBase,
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#059669',
        orientation: 'portrait-primary',
        icons: [
          { src: `${publicBase}icons/qalafix-192-v2.png`, sizes: '192x192', type: 'image/png' },
          { src: `${publicBase}icons/qalafix-512-v2.png`, sizes: '512x512', type: 'image/png' },
          { src: `${publicBase}icons/qalafix-512-v2.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json}'],
        maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
        navigateFallback: `${publicBase}index.html`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/tfjs-models\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qalafix-ai-model-v2',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    sites(),
    cloudflare({ viteEnvironment: { name: 'server' } }),
  ],
})
