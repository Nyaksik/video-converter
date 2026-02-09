export const languages = {
  ru: 'Русский',
  en: 'English',
} as const

export const defaultLang = 'ru' as const

export type Locale = keyof typeof languages

export const ui = {
  ru: {
    // meta
    'meta.homeDescription': 'Бесплатный онлайн-компрессор видео. Сжимайте MP4, MOV, WebM и MKV прямо в браузере без загрузки на сервер. Без водяных знаков, до 90% экономии размера.',
    'meta.compDescription': 'Сжатие видео онлайн — выберите кодек (H.264, VP9, AV1), качество и разрешение. Обработка прямо в браузере через WebCodecs, быстро и бесплатно.',
    'meta.homeKeywords': 'сжатие видео, сжать видео онлайн, компрессор видео, уменьшить размер видео, конвертер видео, webcodecs, сжать mp4, сжать видео бесплатно, видео компрессор онлайн, video compressor',
    'meta.compKeywords': 'сжать видео, компрессор видео онлайн, сжатие mp4, сжатие webm, h264, vp9, av1, уменьшить видео без потери качества, webcodecs, обрезать видео онлайн',

    // home
    'home.pageTitle': 'Главная',
    'home.title': 'Сжимай видео в\u00a0браузере за\u00a0секунды!',
    'home.badge.noWatermarks': 'Без водяных знаков',
    'home.badge.noUpload': 'Без загрузки видео на\u00a0сервер',
    'home.badge.free': 'Бесплатно',
    'home.badge.savings': 'До\u00a090% экономии размера',
    'home.cta': 'Сжать видео сейчас!',

    // compressor
    'comp.pageTitle': 'Компрессор',
    'comp.tagline': 'Сожми видео за секунды!',
    'comp.addVideo': 'Добавь видео или несколько',
    'comp.formats': 'Поддержка MP4, MOV, WebM, MKV',
    'comp.dropHint': 'Нажми или перетащи видео',
    'comp.newVideo': 'Новое видео',
    'comp.settings': 'Настройки сжатия',
    'comp.codec': 'Кодек',
    'comp.compression': 'Сжатие',
    'comp.resolution': 'Разрешение',
    'comp.removeAudio': 'Удалить аудио',
    'comp.estimatedSize': 'Ожидаемый размер: ~{min} — {max} MB',
    'comp.download': 'Скачать {size} MB',
    'comp.processing': 'Обработка {progress}%',
    'comp.compress': 'Сжать видео',
    'comp.done': 'Готово',
    'comp.regenerate': 'Перегенерировать',
    'comp.original': 'Оригинал',

    // batch
    'batch.files': 'Файлы ({count})',
    'batch.completed': '{done}/{total} завершено',
    'batch.compressAll': 'Сжать все',
    'batch.processing': 'Сжатие {done}/{total}...',
    'batch.downloadAll': 'Скачать все ({size} MB)',
    'batch.addMore': 'Добавить ещё',
    'batch.newBatch': 'Новая партия',
    'batch.cancel': 'Отменить',
    'batch.allDone': 'Все файлы сжаты!',
    'batch.maxFiles': 'Максимум {max} файлов',

    // errors / warnings
    'error.compression': 'Ошибка при сжатии',
    'error.memory': 'Недостаточно памяти для обработки видео',
    'error.largeFile': 'Большой файл может вызвать проблемы с производительностью',
    'error.unsupported': 'Данный тип файла не поддерживается!',
  },
  en: {
    'meta.homeDescription': 'Free online video compressor. Compress MP4, MOV, WebM and MKV right in your browser with no server uploads. No watermarks, up to 90% size savings.',
    'meta.compDescription': 'Compress video online — choose codec (H.264, VP9, AV1), quality and resolution. Processed in your browser via WebCodecs, fast and free.',
    'meta.homeKeywords': 'video compression, compress video online, video compressor, reduce video size, video converter, webcodecs, compress mp4, free video compressor, online video compressor, shrink video file',
    'meta.compKeywords': 'compress video, online video compressor, mp4 compression, webm compression, h264, vp9, av1, reduce video size without quality loss, webcodecs, trim video online',

    'home.pageTitle': 'Home',
    'home.title': 'Compress videos in\u00a0your browser in\u00a0seconds!',
    'home.badge.noWatermarks': 'No watermarks',
    'home.badge.noUpload': 'No server uploads',
    'home.badge.free': 'Free',
    'home.badge.savings': 'Up\u00a0to 90% size savings',
    'home.cta': 'Compress video now!',

    'comp.pageTitle': 'Compressor',
    'comp.tagline': 'Compress your video in seconds!',
    'comp.addVideo': 'Add one or more videos',
    'comp.formats': 'Supports MP4, MOV, WebM, MKV',
    'comp.dropHint': 'Click or drag video here',
    'comp.newVideo': 'New video',
    'comp.settings': 'Compression settings',
    'comp.codec': 'Codec',
    'comp.compression': 'Compression',
    'comp.resolution': 'Resolution',
    'comp.removeAudio': 'Remove audio',
    'comp.estimatedSize': 'Estimated size: ~{min} — {max} MB',
    'comp.download': 'Download {size} MB',
    'comp.processing': 'Processing {progress}%',
    'comp.compress': 'Compress video',
    'comp.done': 'Done',
    'comp.regenerate': 'Regenerate',
    'comp.original': 'Original',

    'batch.files': 'Files ({count})',
    'batch.completed': '{done}/{total} completed',
    'batch.compressAll': 'Compress all',
    'batch.processing': 'Compressing {done}/{total}...',
    'batch.downloadAll': 'Download all ({size} MB)',
    'batch.addMore': 'Add more files',
    'batch.newBatch': 'New batch',
    'batch.cancel': 'Cancel',
    'batch.allDone': 'All files compressed!',
    'batch.maxFiles': 'Maximum {max} files',

    'error.compression': 'Compression error',
    'error.memory': 'Not enough memory to process this video',
    'error.largeFile': 'Large file may cause performance issues',
    'error.unsupported': 'This file type is not supported!',
  },
} as const

export type TranslationKey = keyof typeof ui[typeof defaultLang]
