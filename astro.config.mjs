import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'
import compressor from 'astro-compressor'
import robotsTxt from 'astro-robots-txt'
// @ts-check
import { defineConfig, envField } from 'astro/config'
import { loadEnv } from 'vite'

const {
  PUBLIC_SITE_URL, PUBLIC_SITE_NAME, PUBLIC_INFO_EMAIL, PUBLIC_METRIKA, BASE_PATH,
} = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL,
  base: BASE_PATH,
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  env: {
    schema: {
      PUBLIC_SITE_NAME: envField.string({
        context: 'server',
        access: 'public',
        default: PUBLIC_SITE_NAME ?? '',
      }),
      PUBLIC_INFO_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: PUBLIC_INFO_EMAIL ?? '',
      }),
      PUBLIC_METRIKA: envField.boolean({
        context: 'server',
        access: 'public',
        default: PUBLIC_METRIKA === 'true',
      }),
    },
  },
  integrations: [
    vue(),
    robotsTxt(),
    sitemap(),
    compressor(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: PUBLIC_SITE_NAME,
        short_name: 'CCrush',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/core',
        '@ffmpeg/util',
        '@ffmpeg/core-mt',
      ],
    },

    worker: { format: 'es' },

    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },

    plugins: [tailwindcss()],
  },
})
