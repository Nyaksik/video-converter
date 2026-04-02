# ClipCrush

Free online video compressor & GIF converter. All processing happens directly in the browser via WebCodecs — no files are uploaded to any server.

## Features

- **Video compression** — MP4, MOV, WebM, MKV with codec selection (H.264, VP9, AV1)
- **Video to GIF** — customizable FPS, width, color palette, dithering
- **Batch processing** — compress multiple files at once
- **100% client-side** — powered by WebCodecs + FFmpeg.wasm fallback
- **No watermarks, no limits, no sign-up**
- **PWA** — installable, works offline
- **i18n** — Russian and English

## Tech Stack

- [Astro 5](https://astro.build) — static site framework
- [Vue 3](https://vuejs.org) — interactive UI components
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [mediabunny](https://github.com/nicepkg/mediabunny) — WebCodecs video processing
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app) — fallback encoder
- [reka-ui](https://reka-ui.com) — headless UI primitives
- [vite-pwa](https://vite-pwa-org.netlify.app) — PWA support

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

## Scripts

| Command | Description |
|-----------------|-------------------------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |

## Environment Variables

| Variable | Description |
|----------------------|-------------------------------------------|
| `PUBLIC_SITE_URL` | Canonical site URL |
| `PUBLIC_SITE_NAME` | Site name for meta tags |
| `PUBLIC_INFO_EMAIL` | Contact email in footer |
| `PUBLIC_METRIKA` | Enable Yandex.Metrika (`true` / `false`) |
| `BASE_PATH` | Base path for deployment (e.g. `/video-converter`) |

## Deployment

The project auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy-pages.yml`.

For custom domain deployment, leave `BASE_PATH` empty.

## License

MIT
