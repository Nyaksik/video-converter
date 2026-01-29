// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  vite: {
    optimizeDeps: {
      exclude: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/core',
        '@ffmpeg/util',
        '@ffmpeg/core-mt'
      ]
    },

    worker: {
      format: 'es'
    },

    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    },

    plugins: [tailwindcss()]
  },
});