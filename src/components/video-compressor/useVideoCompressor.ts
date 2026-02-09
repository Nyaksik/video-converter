import { watchDebounced } from '@vueuse/core'
import {
  computed,
  ref,
  watch,
} from 'vue'
import { toast } from 'vue-sonner'

import { useI18n } from '@/i18n/vue.ts'

import {
  analyzeVideoFile,
  compressFile,
  detectBrowserCodecs,
  getTargetResolution,
} from './compressFile.ts'
import {
  type Codec,
  Quality,
  Resolution,
  type ResolutionItem,
  Status,
  type VideoMetaData,
} from './types.ts'

const availableQuality = [
  {
    value: Quality.High,
    label: 'Fast',
  },
  {
    value: Quality.Medium,
    label: 'Balance',
  },
  {
    value: Quality.Low,
    label: 'Strong',
  },
]

export function useVideoCompressor(locale?: string) {
  const { t } = useI18n(locale)

  const supportedCodecs = ref<Set<Codec>>(new Set(['h264']))
  const videoMetadata = ref<VideoMetaData | null>(null)
  const inputFile = ref<File | null>(null)
  const outputBlob = ref<Blob | null>(null)
  const progress = ref(0)
  const status = ref<Status>(Status.Idle)
  const codec = ref<Codec>('h264')
  const quality = ref<Quality>(Quality.Medium)
  const resolution = ref<Resolution>(Resolution.OG)
  const previewUrl = ref<string | null>(null)
  const trimStart = ref(0)
  const trimEnd = ref(0)
  const videoRef = ref<HTMLVideoElement>()
  const removeAudio = ref(false)

  const availableCodecs = computed(() => {
    const codecs = [
      {
        value: 'h264',
        label: 'H.264',
        supported: supportedCodecs.value.has('h264'),
      },
      {
        value: 'vp9',
        label: 'VP9',
        supported: supportedCodecs.value.has('vp9'),
      },
      {
        value: 'av1',
        label: 'AV1',
        supported: supportedCodecs.value.has('av1'),
      },
    ]

    return codecs.filter(c => c.supported)
  })

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

  const trimStartComputed = computed({
    get() {
      return trimStart.value
    },
    set(value) {
      trimStart.value = Math.max(0, Math.min(value, videoMetadata.value?.duration ?? 0))
    },
  })
  const trimEndComputed = computed({
    get() {
      return trimEnd.value
    },
    set(value) {
      trimEnd.value = Math.max(0, Math.min(value, videoMetadata.value?.duration ?? 0))
    },
  })

  watchDebounced(trimStartComputed, (v) => {
    if (videoRef.value) {
      videoRef.value.currentTime = v
    }
  }, { debounce: 200 })

  watchDebounced(trimEndComputed, (v) => {
    if (videoRef.value) {
      videoRef.value.currentTime = v
    }
  }, { debounce: 200 })

  watch(inputFile, async (file, oldFile) => {
    if (oldFile && previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }

    if (!file)
      return

    trimStart.value = 0
    trimEnd.value = 0
    removeAudio.value = false
    previewUrl.value = URL.createObjectURL(file)

    const [metadata, codecs] = await Promise.all([
      analyzeVideoFile(file).catch(() => null),
      detectBrowserCodecs(),
    ])

    if (metadata) {
      videoMetadata.value = metadata
      trimEnd.value = metadata.duration
    }

    supportedCodecs.value = codecs
    if (!codecs.has(codec.value)) {
      codec.value = Array.from(codecs)[0] || 'h264'
    }
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
    const url = URL.createObjectURL(outputBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${codec.value}_${quality.value}.mp4`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    if ('memory' in performance) {
      const { jsHeapSizeLimit = 0, usedJSHeapSize = 0 } = performance.memory as {
        jsHeapSizeLimit?: number
        usedJSHeapSize?: number
      }
      const availableMemory = jsHeapSizeLimit - usedJSHeapSize

      if (file.size >= availableMemory) {
        toast.warning(t('error.memory'), { dismissible: true })
      }
    }
    else if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.warning(t('error.largeFile'), { dismissible: true })
    }

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      toast.error(t('error.unsupported'), { dismissible: true })
      return
    }

    inputFile.value = file
    outputBlob.value = null
    status.value = Status.Idle
  }

  function updateTrimValues(values?: number[]) {
    trimStartComputed.value = values?.[0] ?? 0
    trimEndComputed.value = values?.[1] ?? videoMetadata.value?.duration ?? 1
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
