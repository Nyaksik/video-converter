import { watchDebounced } from '@vueuse/core'
import {
  computed,
  ref,
  watch,
} from 'vue'
import { toast } from 'vue-sonner'

import { analyzeVideoFile } from '@/components/video-compressor/compressFile.ts'
import { Status, type VideoMetaData } from '@/components/video-compressor/types.ts'
import { useI18n } from '@/i18n/vue.ts'
import { VALID_VIDEO_TYPES } from '@/lib/video.ts'

export function useVideoFile(locale?: string) {
  const { t } = useI18n(locale)

  const inputFile = ref<File | null>(null)
  const outputBlob = ref<Blob | null>(null)
  const progress = ref(0)
  const status = ref<Status>(Status.Idle)
  const videoMetadata = ref<VideoMetaData | null>(null)
  const previewUrl = ref<string | null>(null)
  const videoRef = ref<HTMLVideoElement>()
  const trimStart = ref(0)
  const trimEnd = ref(0)

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

    if (!file) return

    trimStart.value = 0
    trimEnd.value = 0
    previewUrl.value = URL.createObjectURL(file)

    const metadata = await analyzeVideoFile(file).catch(() => null)

    if (metadata) {
      videoMetadata.value = metadata
      trimEnd.value = metadata.duration
    }
  })

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

    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      toast.error(t('error.unsupported'), { dismissible: true })
      return
    }

    inputFile.value = file
    outputBlob.value = null
    status.value = Status.Idle
    target.value = ''
    progress.value = 0
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
    videoMetadata,
    previewUrl,
    videoRef,
    trimStart,
    trimEnd,
    trimStartComputed,
    trimEndComputed,

    handleFile,
    updateTrimValues,
  }
}
