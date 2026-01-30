<script setup lang="ts">
import { computed, ref } from 'vue'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { Download, Upload, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion, type ConversionAudioOptions,
  type ConversionVideoOptions,
  Input,
  Mp4OutputFormat,
  Output, QUALITY_HIGH, QUALITY_LOW, QUALITY_MEDIUM,
} from 'mediabunny'

let ffmpeg: FFmpeg | null = null
const inputFile = ref<File | null>(null)
const outputBlob = ref<Blob | null>(null)
const progress = ref(0)
const status = ref<'idle' | 'loading' | 'processing' | 'done'>('idle')

const codec = ref<'h264' | 'vp8'>('h264')
const quality = ref<'fast' | 'normal' | 'strong'>('normal')
const resolution = ref<'orig' | '1080p' | '720p' | '480p'>('orig')

const getArgs = computed(() => {
  const scaleMap = {
    '1080p': '1920:1080',
    '720p': '1280:720',
    '480p': '854:480',
    'orig': '-1:-1',
  }

  const crfMap = {
    fast: '25',
    normal: '28',
    strong: '35',
  }

  const baseArgs = codec.value === 'h264'
    ? ['-c:v', 'libx264', '-preset', 'ultrafast']
    : ['-c:v', 'libvpx', '-crf', '30', '-cpu-used', '5']

  return [
    ...baseArgs,
    '-crf', crfMap[quality.value],
    ...(resolution.value !== 'orig' ? ['-vf', `scale=${scaleMap[resolution.value]}`] : []),
    '-c:a', 'aac', '-b:a', '128k',
  ]
})

const getConversionConfig = computed(() => {
  const scaleMap = {
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 },
    '480p': { width: 854, height: 480 },
    'orig': undefined,
  }
  const qualityMap = {
    fast: QUALITY_HIGH,
    normal: QUALITY_MEDIUM,
    strong: QUALITY_LOW,
  }

  return {
    video: {
      ...(scaleMap[resolution.value] || {}),
      fit: 'contain',
      codec: codec.value === 'h264' ? 'avc' : 'vp09',
      bitrate: qualityMap[quality.value],
      keyFrameInterval: 30,
    },
    audio: {
      bitrate: 128000,
      codec: 'aac',
    },
  } as { video: ConversionVideoOptions, audio: ConversionAudioOptions }
})

async function compressVideoWebcodecs() {
  if (!inputFile.value) return

  status.value = 'processing'

  try {
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
      ...getConversionConfig.value,
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
    status.value = 'done'
    console.log('Size:', mp4Buffer?.byteLength)
  }
  catch (error) {
    console.error('Mediabunny error:', error)
    status.value = 'idle'
    progress.value = 0
  }
}

async function loadFFmpeg() {
  if (ffmpeg?.loaded) return

  ffmpeg = new FFmpeg()
  status.value = 'loading'

  try {
    await ffmpeg.load()

    ffmpeg.on('progress', ({ progress: p }) => {
      progress.value = Math.round((p || 0) * 100)
    })
    status.value = 'idle'
  }
  catch (error) {
    console.error('FFmpeg load error:', error)
    status.value = 'idle'
  }
}

async function compressVideo() {
  if (!inputFile.value || !ffmpeg?.loaded) return

  status.value = 'processing'
  progress.value = 0

  try {
    const ext = inputFile.value.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = 'output.mp4'

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile.value))
    console.log('File written')

    await ffmpeg.exec(['-i', inputName, ...getArgs.value, '-y', outputName])
    console.log('Compress finished')

    const data = await ffmpeg.readFile(outputName)
    outputBlob.value = new Blob([data], { type: 'video/mp4' })
    status.value = 'done'
    console.log('PRESET SUCCESS! Size:', data.length)
  }
  catch (error) {
    console.error('Error:', error)
    status.value = 'idle'
  }
}

async function handleCompress() {
  if ('VideoDecoder' in window) {
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
  a.download = `compressed_${codec.value.replace(/ /g, '_')}.mp4`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFile(e: Event) {
  const target = e.target as HTMLInputElement
  inputFile.value = target.files?.[0] || null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <p class="text-lg text-slate-600">
          Сожми видео до нужного размера за секунды
        </p>
      </div>

      <!-- Upload Card -->
      <Card class="relative">
        <CardHeader>
          <CardTitle>1. Загрузи видео</CardTitle>
          <CardDescription>Поддержка MP4, MOV, WebM, MKV</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload class="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <input
              type="file"
              accept="video/*"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handleFile"
            >
            <p class="font-medium text-slate-700 mb-1">
              {{ inputFile ? inputFile.name : 'Кликни или перетащи видео' }}
            </p>
            <p
              v-if="inputFile"
              class="text-sm text-slate-500"
            >
              {{ Math.round(inputFile.size / 1024 / 1024 * 100) / 100 }} MB
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Settings Card -->
      <Card v-if="inputFile">
        <CardHeader>
          <CardTitle>⚙️ Настройки сжатия</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Кодек -->
          <div>
            <label class="text-sm font-medium mb-1 block">Кодек</label>
            <Select v-model="codec">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h264">
                  H.264
                </SelectItem>
                <SelectItem value="vp8">
                  VP8
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Сжатие -->
          <div>
            <label class="text-sm font-medium mb-1 block">Сжатие</label>
            <Select v-model="quality">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">
                  Быстрое (CRF 25)
                </SelectItem>
                <SelectItem value="normal">
                  Обычное (CRF 28)
                </SelectItem>
                <SelectItem value="strong">
                  Сильное (CRF 35)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Разрешение -->
          <div>
            <label class="text-sm font-medium mb-1 block">Разрешение</label>
            <Select v-model="resolution">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orig">
                  Оригинал
                </SelectItem>
                <SelectItem value="1080p">
                  1080p (1920x1080)
                </SelectItem>
                <SelectItem value="720p">
                  720p (1280x720)
                </SelectItem>
                <SelectItem value="480p">
                  480p (854x480)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card v-if="inputFile && status !== 'processing'">
        <CardContent class="pt-6">
          <Button
            class="w-full h-14 text-lg"
            size="lg"
            @click="handleCompress"
          >
            <Loader2
              v-if="status === 'loading'"
              class="w-5 h-5 mr-2 animate-spin"
            />
            {{ status === 'loading' ? '' : 'Сжать видео' }}
          </Button>
        </CardContent>
      </Card>

      <Card v-if="status === 'processing'">
        <CardHeader>
          <CardTitle>Сжимаю видео...</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <Progress
            :model-value="progress"
            class="h-3"
          />
          <p class="text-sm text-slate-600">
            {{ progress }}%
          </p>
        </CardContent>
      </Card>

      <Card v-if="outputBlob && status === 'done'">
        <CardHeader>
          <CardTitle>✅ Готово!</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 pt-6">
          <Button
            variant="outline"
            class="w-full"
            @click="downloadVideo"
          >
            <Download class="w-4 h-4 mr-2" />
            Скачать сжатое видео
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
