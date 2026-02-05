import { computed, ref, watch } from 'vue'
import {
  ALL_FORMATS,
  BlobSource, BufferTarget, Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  type ConversionOptions,
} from 'mediabunny'
import { type Codec, Quality, type Resolution, type ResolutionItem, Status, type VideoMetaData } from './types.ts'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { toast } from 'vue-sonner'
import { watchDebounced } from '@vueuse/core'

export function useVideoCompressor() {
  const videoMetadata = ref<VideoMetaData | null>(null)

  const availableQuality = [
    { value: Quality.High, label: 'Fast' },
    { value: Quality.Medium, label: 'Balance' },
    { value: Quality.Low, label: 'Strong' },
  ]

  const supportedCodecs = ref<Set<Codec>>(new Set(['h264']))

  let ffmpeg: FFmpeg | null = null
  const inputFile = ref<File | null>(null)
  const outputBlob = ref<Blob | null>(null)
  const progress = ref(0)
  const status = ref<Status>(Status.Idle)

  const codec = ref<Codec>('h264')
  const quality = ref<Quality>(Quality.Medium)
  const resolution = ref<Resolution>('og')
  const previewUrl = ref<string | null>(null)
  const trimStart = ref(0)
  const trimEnd = ref(0)
  const videoRef = ref<HTMLVideoElement>()
  const removeAudio = ref(false)

  const availableCodecs = computed(() => {
    const codecs = [
      { value: 'h264', label: 'H.264', supported: supportedCodecs.value.has('h264') },
      { value: 'vp9', label: 'VP9', supported: supportedCodecs.value.has('vp9') },
      { value: 'av1', label: 'AV1', supported: supportedCodecs.value.has('av1') },
    ]

    return codecs.filter(c => c.supported)
  })

  const availableResolutions = computed(() => {
    if (!videoMetadata.value) {
      return [{ value: 'orig', label: 'Оригинал', disabled: false }]
    }

    const { height } = videoMetadata.value

    const resolutions: ResolutionItem[] = [
      {
        value: 'og',
        label: 'Оригинал',
        disabled: false,
        pixels: height,
      },
      { value: '1080p', label: '1080p', disabled: height < 1080, pixels: 1080 },
      { value: '720p', label: '720p', disabled: height < 720, pixels: 720 },
      { value: '480p', label: '480p', disabled: height < 480, pixels: 480 },
    ]

    return resolutions.filter(r => !r.disabled)
  })

  const compressionInfo = computed(() => {
    if (!videoMetadata.value || !inputFile.value) return null

    // const config = getConversionConfig()
    // const targetRes = getTargetResolution()
    // const videoBitrate = (config.video?.bitrate as number) ?? 0
    // const audioBitrate = (config.audio?.bitrate as number) ?? 0
    //
    // const estimatedSize = (
    //   (videoBitrate + audioBitrate)
    //   * videoMetadata.value.duration / 8
    // ) * 1.25
    //
    // return (estimatedSize / 1024 / 1024).toFixed(2) + ' MB'
    return 0
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

    await Promise.all([
      analyzeVideo(file),
      detectSupportedCodecs(),
    ])

    if (videoMetadata.value) {
      trimEnd.value = videoMetadata.value?.duration
    }
  })

  async function analyzeVideo(file: File) {
    return new Promise<void>((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        videoMetadata.value = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          estimatedBitrate: (file.size * 8) / video.duration,
        }

        URL.revokeObjectURL(video.src)
        resolve()
      }

      video.onerror = () => {
        console.error('Failed to load video metadata')
        URL.revokeObjectURL(video.src)
        resolve()
      }
    })
  }

  async function detectSupportedCodecs() {
    if (!('VideoEncoder' in window)) {
      supportedCodecs.value = new Set(['h264'])
      return
    }

    const codecsToTest: Array<{
      name: Codec
      config: string
    }> = [
      {
        name: 'h264',
        config: 'avc1.42E01E',
      },
      {
        name: 'vp9',
        config: 'vp09.00.10.08',
      },
      {
        name: 'av1',
        config: 'av01.0.04M.08',
      },
    ]

    const supported = new Set<Codec>()

    for (const { name, config } of codecsToTest) {
      try {
        const result = await VideoEncoder.isConfigSupported({
          codec: config,
          width: 1920,
          height: 1080,
          framerate: 30,
        })

        if (result.supported) {
          supported.add(name)
        }
      }
      catch (error) {
        console.warn(`Codec ${name} test failed:`, error)
      }
    }

    supportedCodecs.value = supported

    if (!supported.has(codec.value)) {
      codec.value = Array.from(supported)[0] || 'h264'
    }

    console.log('Supported codecs:', Array.from(supported))
  }

  function getTargetResolution(): { width: number, height: number } {
    if (!videoMetadata.value) {
      return { width: 1920, height: 1080 }
    }

    const { width, height } = videoMetadata.value

    if (resolution.value === 'og') {
      return { width, height }
    }

    const resolutionMap: Record<string, { width: number, height: number }> = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
    }

    const target = resolutionMap[resolution.value]
    const aspectRatio = width / height
    const targetAspectRatio = target.width / target.height

    if (Math.abs(aspectRatio - targetAspectRatio) < 0.01) {
      return target
    }

    if (aspectRatio > targetAspectRatio) {
      return {
        width: target.width,
        height: Math.round(target.width / aspectRatio / 2) * 2,
      }
    }
    else {
      return {
        width: Math.round(target.height * aspectRatio / 2) * 2,
        height: target.height,
      }
    }
  }

  function getTargetBitrate(width: number, height: number): number {
    const pixels = width * height

    const bitsPerPixel = {
      [Quality.High]: 0.15,
      [Quality.Medium]: 0.08,
      [Quality.Low]: 0.05,
    }

    const targetBitrate = pixels * bitsPerPixel[quality.value]

    return Math.floor(Math.max(500_000, Math.min(10_000_000, targetBitrate)))
  }

  function getConversionConfig(): Partial<Pick<ConversionOptions, 'video' | 'audio' | 'trim'>> {
    const targetRes = getTargetResolution()
    const videoBitrate = getTargetBitrate(targetRes.width, targetRes.height)

    const codecMap: Record<Codec, 'avc' | 'vp9' | 'av1'> = {
      h264: 'avc', // H.264
      vp9: 'vp9', // VP9
      av1: 'av1', // AV1
    }

    const audioBitrate = quality.value === Quality.Low
      ? 96_000
      : quality.value === Quality.High
        ? 192_000
        : 128_000

    return {
      video: {
        width: targetRes.width,
        height: targetRes.height,
        fit: 'contain',
        codec: codecMap[codec.value],
        bitrate: videoBitrate,
        frameRate: 30,
        keyFrameInterval: 60,
      },
      audio: {
        bitrate: audioBitrate,
        codec: 'aac',
        sampleRate: 48000,
        discard: removeAudio.value,
      },
      trim: {
        start: trimStart.value,
        end: trimEnd.value,
      },
    }
  }

  function getFFmpegArgs() {
    const targetRes = getTargetResolution()

    const crfMap = {
      [Quality.High]: '23',
      [Quality.Medium]: '28',
      [Quality.Low]: '32',
    }

    const codecArgs = codec.value === 'h264'
      ? ['-c:v', 'libx264', '-preset', 'medium']
      : codec.value === 'vp9'
        ? ['-c:v', 'libvpx-vp9', '-crf', '30']
        : ['-c:v', 'libx264', '-preset', 'medium'] // fallback

    const scaleArgs = resolution.value !== 'og'
      ? ['-vf', `scale=${targetRes.width}:${targetRes.height}:flags=bicubic`]
      : []

    const audioArgs = removeAudio.value
      ? ['-an']
      : [
          '-c:a', 'aac',
          '-b:a', quality.value === Quality.Low
            ? '96k'
            : quality.value === Quality.High
              ? '192k'
              : '128k',
        ]

    return [
      ...codecArgs,
      '-ss', trimStart.value.toString(),
      '-to', trimEnd.value.toString(),
      '-crf', crfMap[quality.value],
      ...scaleArgs,
      ...audioArgs,
      '-movflags', '+faststart',
    ]
  }

  async function compressVideoWebcodecs() {
    if (!inputFile.value) return

    status.value = Status.Processing
    progress.value = 0

    try {
      const config = getConversionConfig()

      const input = new Input({
        source: new BlobSource(inputFile.value),
        formats: ALL_FORMATS,
      })

      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      })

      const conversion = await Conversion.init({
        input,
        output,
        ...config,
      })

      conversion.onProgress = (p: number) => {
        progress.value = Math.round(p * 100)
      }

      await conversion.execute()
      const mp4Buffer = output.target.buffer

      if (!mp4Buffer) {
        throw new Error('No buffer')
      }

      outputBlob.value = new Blob([mp4Buffer], { type: 'video/mp4' })
      status.value = Status.Done
    }
    catch (error) {
      console.error('WebCodecs error:', error)
      console.log('Falling back to FFmpeg...')
      await loadFFmpeg().then(compressVideo)
    }
  }

  async function loadFFmpeg() {
    if (ffmpeg?.loaded) return

    ffmpeg = new FFmpeg()
    status.value = Status.Loading

    try {
      await ffmpeg.load()

      ffmpeg.on('progress', ({ progress: p }) => {
        progress.value = Math.round((p || 0) * 100)
      })
      status.value = Status.Idle
    }
    catch (error) {
      console.error('FFmpeg load error:', error)
      status.value = Status.Idle
    }
  }

  async function compressVideo() {
    if (!inputFile.value || !ffmpeg?.loaded) return

    status.value = Status.Processing
    progress.value = 0

    try {
      const ext = inputFile.value.name.split('.').pop() || 'mp4'
      const inputName = `input.${ext}`
      const outputName = 'output.mp4'

      await ffmpeg.writeFile(inputName, await fetchFile(inputFile.value))
      await ffmpeg.exec(['-i', inputName, ...getFFmpegArgs(), '-y', outputName])

      const data = await ffmpeg.readFile(outputName)
      outputBlob.value = new Blob([data], { type: 'video/mp4' })

      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)

      status.value = Status.Done
      console.log('FFmpeg compression complete, size:', data.length)
    }
    catch (error) {
      console.error('FFmpeg error:', error)
      status.value = Status.Idle
      toast.error('Ошибка при сжатии', { dismissible: true })
    }
  }

  async function handleCompress() {
    if ('VideoEncoder' in window && supportedCodecs.value.has(codec.value)) {
      await compressVideoWebcodecs()
    }
    else {
      await loadFFmpeg().then(compressVideo)
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

    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      toast.error('Файл слишком большой (максимум 1GB)', { dismissible: true })
      return
    }

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      toast.error('Данный тип файла не поддерживается!', { dismissible: true })
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
