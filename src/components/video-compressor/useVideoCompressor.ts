import { computed, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useCompressionSettings } from '@/composables/useCompressionSettings.ts'
import { useVideoFile } from '@/composables/useVideoFile.ts'
import { useI18n } from '@/i18n/vue.ts'
import { downloadBlob } from '@/lib/video.ts'

import {
  compressFile,
  getTargetBitrate,
  getTargetResolution,
} from './compressFile.ts'
import {
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
        disabled: height <= 1080,
        pixels: 1080,
      },
      {
        value: Resolution.HD,
        label: '720p',
        description: 'HD',
        disabled: height <= 720,
        pixels: 720,
      },
      {
        value: Resolution.SD,
        label: '480p',
        description: 'SD',
        disabled: height <= 480,
        pixels: 480,
      },
    ]

    return resolutions.filter(r => !r.disabled)
  })

  const compressionInfo = computed(() => {
    if (!videoMetadata.value || !inputFile.value) return null

    const duration = trimEnd.value - trimStart.value
    if (duration <= 0) return null

    const targetRes = getTargetResolution(videoMetadata.value, resolution.value)
    const originalBitrate = (inputFile.value.size * 8) / videoMetadata.value.duration

    const isHighBitrateSource = originalBitrate > 50_000_000

    const videoBitrate = getTargetBitrate(
      targetRes.width,
      targetRes.height,
      quality.value,
      isHighBitrateSource ? undefined : originalBitrate,
    )

    const audioBitrate = removeAudio.value ? 0 : 128_000
    const totalBitrate = videoBitrate + audioBitrate
    const estimatedBytes = (totalBitrate * duration) / 8
    const withOverhead = estimatedBytes * 1.02

    const [minFactor, maxFactor] = isHighBitrateSource ? [0.4, 0.85] : [0.6, 1.0]

    return {
      min: Math.max(0.01, (withOverhead * minFactor) / 1024 / 1024),
      max: Math.max(0.01, (withOverhead * maxFactor) / 1024 / 1024),
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
      outputBlob.value = await compressFile(
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
