import { zipSync } from 'fflate'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useCompressionSettings } from '@/composables/useCompressionSettings.ts'
import { useI18n } from '@/i18n/vue.ts'
import { downloadBlob, VALID_VIDEO_TYPES } from '@/lib/video.ts'

import { analyzeVideoFile, compressFile } from './compressFile.ts'
import {
  type BatchFileItem,
  BatchFileStatus,
  BatchStatus,
  Resolution,
} from './types.ts'

const MAX_BATCH_FILES = 10

export function useBatchCompressor(locale?: string) {
  const { t } = useI18n(locale)

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

  const files = ref<BatchFileItem[]>([])
  const batchStatus = ref<BatchStatus>(BatchStatus.Idle)
  const currentFileId = ref<string | null>(null)

  let codecsDetected = false
  let cancelled = false

  const totalCount = computed(() => files.value.length)
  const completedCount = computed(() => files.value.filter(f => f.status === BatchFileStatus.Done).length)
  const errorCount = computed(() => files.value.filter(f => f.status === BatchFileStatus.Error).length)

  const overallProgress = computed(() => {
    if (totalCount.value === 0) return 0
    const current = files.value.find(f => f.id === currentFileId.value)
    return Math.round(
      ((completedCount.value * 100) + (current?.progress ?? 0)) / totalCount.value,
    )
  })

  const totalOutputSize = computed(() =>
    files.value.reduce((sum, f) => sum + (f.outputBlob?.size ?? 0), 0),
  )

  const availableResolutions = computed(() => {
    const maxHeight = Math.max(...files.value.map(f => f.metadata?.height ?? 0), 0)

    const resolutions = [
      {
        value: Resolution.OG,
        label: t('comp.original'),
        disabled: false,
      },
      {
        value: Resolution.FullHD,
        label: '1080p',
        description: 'Full HD',
        disabled: maxHeight < 1080,
      },
      {
        value: Resolution.HD,
        label: '720p',
        description: 'HD',
        disabled: maxHeight < 720,
      },
      {
        value: Resolution.SD,
        label: '480p',
        description: 'SD',
        disabled: maxHeight < 480,
      },
    ]

    return resolutions.filter(r => !r.disabled)
  })

  async function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const remaining = MAX_BATCH_FILES - files.value.length
    const validFiles = incoming.filter(f => VALID_VIDEO_TYPES.includes(f.type))

    if (validFiles.length === 0) {
      toast.error(t('error.unsupported'), { dismissible: true })
      return
    }

    if (incoming.length > validFiles.length) {
      toast.warning(t('error.unsupported'), { dismissible: true })
    }

    if (validFiles.length > remaining) {
      toast.warning(t('batch.maxFiles', { max: MAX_BATCH_FILES }), { dismissible: true })
    }

    const toAdd = validFiles.slice(0, Math.max(0, remaining))
    if (toAdd.length === 0) return

    const newItems: BatchFileItem[] = toAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: BatchFileStatus.Pending,
      progress: 0,
      metadata: null,
      outputBlob: null,
      error: null,
    }))

    files.value.push(...newItems)

    if (!codecsDetected) {
      await detectAndSetCodecs()
      codecsDetected = true
    }

    for (const item of newItems) {
      const fileRef = files.value.find(f => f.id === item.id)
      if (!fileRef) continue

      fileRef.status = BatchFileStatus.Analyzing
      try {
        fileRef.metadata = await analyzeVideoFile(item.file)
      }
      catch {
        fileRef.status = BatchFileStatus.Error
        fileRef.error = 'Failed to analyze'
      }

      if (fileRef.status === BatchFileStatus.Analyzing) {
        fileRef.status = BatchFileStatus.Pending
      }
    }
  }

  function removeFile(id: string) {
    const index = files.value.findIndex(f => f.id === id)
    if (index === -1) return

    const item = files.value[index]
    if (item.outputBlob) {
      item.outputBlob = null
    }

    files.value.splice(index, 1)

    if (files.value.length === 0) {
      resetBatch()
    }
  }

  async function startBatch() {
    batchStatus.value = BatchStatus.Processing
    cancelled = false

    const pending = files.value.filter(
      f => f.status === BatchFileStatus.Pending && f.metadata,
    )

    for (const item of pending) {
      if (cancelled) break

      const fileRef = files.value.find(f => f.id === item.id)
      if (!fileRef || !fileRef.metadata) continue

      fileRef.status = BatchFileStatus.Processing
      fileRef.progress = 0
      currentFileId.value = fileRef.id

      try {
        fileRef.outputBlob = await compressFile(
          fileRef.file,
          fileRef.metadata,
          {
            codec: codec.value,
            quality: quality.value,
            resolution: resolution.value,
            removeAudio: removeAudio.value,
          },
          supportedCodecs.value,
          (p) => { fileRef.progress = p },
        )
        fileRef.status = BatchFileStatus.Done
        fileRef.progress = 100
      }
      catch (error) {
        console.error(`Error compressing ${fileRef.file.name}:`, error)
        fileRef.status = BatchFileStatus.Error
        fileRef.error = String(error instanceof Error ? error.message : error)
      }
    }

    currentFileId.value = null
    if (!cancelled) {
      batchStatus.value = BatchStatus.Done
    }
  }

  function cancelBatch() {
    cancelled = true
    batchStatus.value = BatchStatus.Idle
    currentFileId.value = null

    for (const file of files.value) {
      if (file.status === BatchFileStatus.Processing) {
        file.status = BatchFileStatus.Pending
        file.progress = 0
      }
    }
  }

  function downloadFile(id: string) {
    const item = files.value.find(f => f.id === id)
    if (!item?.outputBlob) return

    downloadBlob(
      item.outputBlob,
      `compressed_${item.file.name.replace(/\.[^.]+$/, '')}_${codec.value}_${quality.value}.mp4`,
    )
  }

  function downloadAll() {
    const zipData: Record<string, Uint8Array> = {}
    const completed = files.value.filter(f => f.status === BatchFileStatus.Done && f.outputBlob)

    if (completed.length === 0) return

    const promises = completed.map(async (item) => {
      const buffer = new Uint8Array(await item.outputBlob!.arrayBuffer())
      const name = `compressed_${item.file.name.replace(/\.[^.]+$/, '')}_${codec.value}_${quality.value}.mp4`
      zipData[name] = buffer
    })

    Promise.all(promises).then(() => {
      const zipped = zipSync(zipData)
      const blob = new Blob([zipped], { type: 'application/zip' })
      downloadBlob(blob, 'clipcrush_batch.zip')
    })
  }

  function resetBatch() {
    for (const file of files.value) {
      file.outputBlob = null
    }

    files.value = []
    batchStatus.value = BatchStatus.Idle
    currentFileId.value = null
    cancelled = false
    codecsDetected = false
  }

  return {
    files,
    batchStatus,
    currentFileId,
    codec,
    quality,
    resolution,
    removeAudio,
    supportedCodecs,
    availableCodecs,
    availableQuality,
    availableResolutions,
    totalCount,
    completedCount,
    errorCount,
    overallProgress,
    totalOutputSize,

    addFiles,
    removeFile,
    startBatch,
    cancelBatch,
    downloadFile,
    downloadAll,
    resetBatch,
  }
}
