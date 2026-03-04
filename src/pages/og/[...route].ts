import { OGImageRoute } from 'astro-og-canvas'

const pages = {
  'index': {
    title: 'ClipCrush',
    description: 'Бесплатный онлайн-компрессор видео. Сжимайте MP4, MOV, WebM и MKV прямо в браузере без загрузки на сервер.',
  },
  'en/index': {
    title: 'ClipCrush',
    description: 'Free online video compressor. Compress MP4, MOV, WebM and MKV right in your browser with no server uploads.',
  },
  'compressor': {
    title: 'ClipCrush — Компрессор',
    description: 'Сжатие видео онлайн — выберите кодек, качество и разрешение. Обработка прямо в браузере.',
  },
  'en/compressor': {
    title: 'ClipCrush — Compressor',
    description: 'Compress video online — choose codec, quality and resolution. Processed in your browser.',
  },
  'gif': {
    title: 'ClipCrush — Видео в GIF',
    description: 'Конвертация видео в GIF онлайн. Превращайте MP4, MOV, WebM в анимированные GIF прямо в браузере.',
  },
  'en/gif': {
    title: 'ClipCrush — Video to GIF',
    description: 'Convert video to GIF online. Turn MP4, MOV, WebM into animated GIFs right in your browser.',
  },
}

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    logo: {
      path: './src/assets/images/logo-inverted.png',
      size: [80],
    },
    bgGradient: [[24, 24, 27]],
    fonts: ['./src/assets/fonts/NotoSans-Regular.ttf'],
    font: {
      title: {
        color: [255, 255, 255],
        size: 64,
      },
      description: {
        color: [161, 161, 170],
        size: 32,
      },
    },
    border: {
      color: [99, 102, 241],
      width: 10,
      side: 'block-end',
    },
  }),
})
