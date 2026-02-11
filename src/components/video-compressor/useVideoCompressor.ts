import { computed, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useCompressionSettings } from '@/composables/useCompressionSettings.ts'
import { useVideoFile } from '@/composables/useVideoFile.ts'
import { useI18n } from '@/i18n/vue.ts'
import { downloadBlob } from '@/lib/video.ts'

import { compressFile, getTargetResolution } from './compressFile.ts'
import {
  Quality,
  Resolution,
  type ResolutionItem,
  Status,
} from './types.ts'

export function useVideoCompressor(locale?: string) {
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

  const {
    supportedCodecs,
    codec,
    quality,
    resolution,
    removeAudio,
    availableCodecs,
    availableQuality,
    detectAndSetCodecs,
  } = useCompressionSettings()

  const availableResolutions = computed<ResolutionItem[]>(() => {
    if (!videoMetadata.value) {
      return [{
        value: Resolution.OG,
        label: t('comp.original'),
        disabled: false,
      }]
    }

    const { height, width } = videoMetadata.value

    const resolutions: ResolutionItem[] = [
      {
        value: Resolution.OG,
        label: t('comp.original'),
        description: `${width}x${height}`,
        disabled: false,
        pixels: height,
      },
      {
        value: Resolution.FullHD,
        label: '1080p',
        description: 'Full HD',
        disabled: height < 1080,
        pixels: 1080,
      },
      {
        value: Resolution.HD,
        label: '720p',
        description: 'HD',
        disabled: height < 720,
        pixels: 720,
      },
      {
        value: Resolution.SD,
        label: '480p',
        description: 'SD',
        disabled: height < 480,
        pixels: 480,
      },
    ]

    return resolutions.filter(r => !r.disabled)
  })

  const compressionInfo = computed(() => {
    if (!videoMetadata.value || !inputFile.value) return null

    const duration = trimEnd.value - trimStart.value
    if (duration <= 0) return null

    const trimRatio = duration / videoMetadata.value.duration
    const originalSize = inputFile.value.size

    const qualityFactor = {
      [Quality.High]: 0.45,
      [Quality.Medium]: 0.4,
      [Quality.Low]: 0.25,
    }

    const targetRes = getTargetResolution(videoMetadata.value, resolution.value)
    const originalPixels = videoMetadata.value.width * videoMetadata.value.height
    const targetPixels = targetRes.width * targetRes.height
    const pixelRatio = Math.min(1, Math.sqrt(targetPixels / originalPixels))
    const audioFactor = removeAudio.value ? 0.9 : 1

    const base = originalSize * trimRatio * qualityFactor[quality.value] * pixelRatio * audioFactor
    const min = base
    const max = base * 1.5

    return {
      min: Math.max(0.01, min / 1024 / 1024),
      max: Math.max(0.01, max / 1024 / 1024),
    }
  })

  watch(inputFile, async (file) => {
    if (!file) return

    removeAudio.value = false
    await detectAndSetCodecs()
  })

  async function handleCompress() {
    if (!inputFile.value || !videoMetadata.value) return

    status.value = Status.Processing
    progress.value = 0

    try {
      const blob = await compressFile(
        inputFile.value,
        videoMetadata.value,
        {
          codec: codec.value,
          quality: quality.value,
          resolution: resolution.value,
          removeAudio: removeAudio.value,
        },
        supportedCodecs.value,
        (p) => { progress.value = p },
        {
          start: trimStart.value,
          end: trimEnd.value,
        },
      )

      outputBlob.value = blob
      status.value = Status.Done
    }
    catch (error) {
      console.error('Compression error:', error)
      status.value = Status.Idle
      toast.error(t('error.compression'), { dismissible: true })
    }
  }

  function downloadVideo() {
    if (!outputBlob.value) return
    downloadBlob(outputBlob.value, `compressed_${codec.value}_${quality.value}.mp4`)
  }

  return {
    inputFile,
    outputBlob,
    progress,
    status,
    codec,
    quality,
    resolution,
    availableCodecs,
    availableResolutions,
    availableQuality,
    compressionInfo,
    previewUrl,
    trimStartComputed,
    trimEndComputed,
    videoMetadata,
    videoRef,
    removeAudio,

    handleCompress,
    downloadVideo,
    handleFile,
    updateTrimValues,
  }
}
