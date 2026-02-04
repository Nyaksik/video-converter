// @ts-check
import { defineConfig, envField } from 'astro/config'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'
import robotsTxt from 'astro-robots-txt'
import sitemap from '@astrojs/sitemap'
import { loadEnv } from 'vite'

import compressor from 'astro-compressor';

const { PUBLIC_SITE_URL, PUBLIC_SITE_NAME } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL,
  env: {
    schema: {
      PUBLIC_SITE_NAME: envField.string({ context: 'server', access: 'public', default: PUBLIC_SITE_NAME })
    }
  },
  integrations: [vue(), robotsTxt(), sitemap(), compressor()],
  vite: {
    optimizeDeps: {
      exclude: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/core',
        '@ffmpeg/util',
        '@ffmpeg/core-mt',
      ],
    },

    worker: {
      format: 'es',
    },

    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },

    plugins: [tailwindcss()],
  },
});