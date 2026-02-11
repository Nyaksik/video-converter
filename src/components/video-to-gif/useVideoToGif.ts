import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useVideoFile } from '@/composables/useVideoFile.ts'
import { useI18n } from '@/i18n/vue.ts'
import { downloadBlob } from '@/lib/video.ts'

import { Status } from '../video-compressor/types.ts'

import { convertToGif } from './convertToGif.ts'
import {
  GifColors,
  GifDither,
  GifFps,
  GifWidth,
} from './types.ts'

export function useVideoToGif(locale?: string) {
  const { t } = useI18n(locale)

  const {
    inputFile,
    outputBlob,
    progress,
    status,
    videoMetadata,
    previewUrl,
    videoRef,
    trimStart,
    trimEnd,
    trimStartComputed,
    trimEndComputed,
    handleFile,
    updateTrimValues,
  } = useVideoFile(locale)

  const fps = ref<GifFps>(GifFps.F15)
  const width = ref<GifWidth>(GifWidth.W480)
  const colors = ref<GifColors>(GifColors.C256)
  const dither = ref<GifDither>(GifDither.FloydSteinberg)

  const availableFps = [
    {
      value: GifFps.F10,
      label: '10',
    },
    {
      value: GifFps.F15,
      label: '15',
    },
    {
      value: GifFps.F20,
      label: '20',
    },
    {
      value: GifFps.F24,
      label: '24',
    },
  ]

  const availableWidths = computed(() => {
    const items = [
      {
        value: GifWidth.W320,
        label: '320px',
      },
      {
        value: GifWidth.W480,
        label: '480px',
      },
      {
        value: GifWidth.W640,
        label: '640px',
      },
      {
        value: GifWidth.Original,
        label: t('gif.widthOriginal'),
      },
    ]

    if (!videoMetadata.value) return items

    return items.filter(
      i => i.value === GifWidth.Original || i.value <= videoMetadata.value!.width,
    )
  })

  const availableColors = [
    {
      value: GifColors.C64,
      label: '64',
    },
    {
      value: GifColors.C128,
      label: '128',
    },
    {
      value: GifColors.C256,
      label: '256',
    },
  ]

  const availableDithers = computed(() => [
    {
      value: GifDither.None,
      label: t('gif.ditherNone'),
    },
    {
      value: GifDither.FloydSteinberg,
      label: t('gif.ditherFloyd'),
    },
    {
      value: GifDither.Bayer,
      label: t('gif.ditherBayer'),
    },
  ])

  const estimatedSize = computed(() => {
    if (!videoMetadata.value || !inputFile.value) return null

    const duration = trimEnd.value - trimStart.value
    if (duration <= 0) return null

    const w = width.value === GifWidth.Original
      ? videoMetadata.value.width
      : width.value

    const aspectRatio = videoMetadata.value.height / videoMetadata.value.width
    const h = Math.round(w * aspectRatio)

    const colorsFactor = colors.value / 256
    const bytesPerFrame = w * h * colorsFactor * 0.15
    const totalFrames = duration * fps.value
    const raw = bytesPerFrame * totalFrames

    const min = raw * 0.5
    const max = raw * 1.2

    return {
      min: Math.max(0.01, min / 1024 / 1024),
      max: Math.max(0.01, max / 1024 / 1024),
    }
  })

  async function handleConvert() {
    if (!inputFile.value || !videoMetadata.value) return

    status.value = Status.Processing
    progress.value = 0

    try {
      outputBlob.value = await convertToGif(
        inputFile.value,
        videoMetadata.value,
        {
          fps: fps.value,
          width: width.value,
          colors: colors.value,
          dither: dither.value,
        },
        {
          start: trimStart.value,
          end: trimEnd.value,
        },
        (p) => { progress.value = p },
      )

      status.value = Status.Done
    }
    catch (error) {
      console.error('GIF conversion error:', error)
      status.value = Status.Idle
      toast.error(t('error.compression'), { dismissible: true })
    }
  }

  function downloadGif() {
    if (!outputBlob.value) return
    downloadBlob(outputBlob.value, `${inputFile.value?.name.replace(/\.[^.]+$/, '') ?? 'video'}.gif`)
  }

  return {
    inputFile,
    outputBlob,
    progress,
    status,
    videoMetadata,
    previewUrl,
    videoRef,
    trimStartComputed,
    trimEndComputed,

    fps,
    width,
    colors,
    dither,
    availableFps,
    availableWidths,
    availableColors,
    availableDithers,
    estimatedSize,

    handleConvert,
    downloadGif,
    handleFile,
    updateTrimValues,
  }
}
