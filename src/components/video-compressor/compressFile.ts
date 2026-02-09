import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  type ConversionOptions,
  Input,
  Mp4OutputFormat,
  Output,
} from 'mediabunny'

import {
  type Codec,
  type CompressionSettings,
  Quality,
  Resolution,
  type VideoMetaData,
} from './types.ts'

const resolutionMap: Record<string, {
  width: number
  height: number
}> = {
  [Resolution.FullHD]: {
    width: 1920,
    height: 1080,
  },
  [Resolution.HD]: {
    width: 1280,
    height: 720,
  },
  [Resolution.SD]: {
    width: 854,
    height: 480,
  },
}

const bitsPerPixel = {
  [Quality.High]: 0.15,
  [Quality.Medium]: 0.08,
  [Quality.Low]: 0.05,
}

let ffmpeg: FFmpeg | null = null

export async function analyzeVideoFile(file: File): Promise<VideoMetaData> {
  return new Promise<VideoMetaData>((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const metadata: VideoMetaData = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        estimatedBitrate: (file.size * 8) / video.duration,
      }

      URL.revokeObjectURL(video.src)
      resolve(metadata)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }
  })
}

export async function detectBrowserCodecs(): Promise<Set<Codec>> {
  if (!('VideoEncoder' in window)) {
    return new Set(['h264'])
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

  return supported
}

export function getTargetResolution(
  metadata: VideoMetaData,
  resolution: Resolution,
): { width: number
  height: number } {
  if (resolution === Resolution.OG) {
    return {
      width: metadata.width,
      height: metadata.height,
    }
  }

  const target = resolutionMap[resolution]
  if (!target) {
    return {
      width: metadata.width,
      height: metadata.height,
    }
  }

  if (metadata.height < target.height) {
    return {
      width: metadata.width,
      height: metadata.height,
    }
  }

  const aspectRatio = metadata.width / metadata.height
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

  return {
    width: Math.round(target.height * aspectRatio / 2) * 2,
    height: target.height,
  }
}

export function getTargetBitrate(
  width: number,
  height: number,
  quality: Quality,
): number {
  const pixels = width * height
  const frameRate = 30
  const targetBitrate = pixels * bitsPerPixel[quality] * frameRate

  return Math.floor(Math.max(500_000, Math.min(10_000_000, targetBitrate)))
}

export function buildConversionConfig(
  metadata: VideoMetaData,
  settings: CompressionSettings,
  trim?: { start: number
    end: number },
): Partial<Pick<ConversionOptions, 'video' | 'audio' | 'trim'>> {
  const targetRes = getTargetResolution(metadata, settings.resolution)
  const videoBitrate = getTargetBitrate(targetRes.width, targetRes.height, settings.quality)

  const codecMap: Record<Codec, 'avc' | 'vp9' | 'av1'> = {
    h264: 'avc',
    vp9: 'vp9',
    av1: 'av1',
  }

  const audioBitrate = settings.quality === Quality.Low
    ? 96_000
    : settings.quality === Quality.High
      ? 192_000
      : 128_000

  return {
    video: {
      width: targetRes.width,
      height: targetRes.height,
      fit: 'contain',
      codec: codecMap[settings.codec],
      bitrate: videoBitrate,
      frameRate: 30,
      keyFrameInterval: 60,
    },
    audio: {
      bitrate: audioBitrate,
      codec: 'aac',
      sampleRate: 48000,
      discard: settings.removeAudio,
    },
    trim: trim ?? {
      start: 0,
      end: metadata.duration,
    },
  }
}

export function buildFFmpegArgs(
  metadata: VideoMetaData,
  settings: CompressionSettings,
  trim?: { start: number
    end: number },
): string[] {
  const targetRes = getTargetResolution(metadata, settings.resolution)
  const trimValues = trim ?? {
    start: 0,
    end: metadata.duration,
  }

  const crfMap = {
    [Quality.High]: '23',
    [Quality.Medium]: '28',
    [Quality.Low]: '32',
  }

  const codecArgs = settings.codec === 'h264'
    ? ['-c:v', 'libx264', '-preset', 'medium']
    : settings.codec === 'vp9'
      ? ['-c:v', 'libvpx-vp9', '-crf', '30']
      : ['-c:v', 'libx264', '-preset', 'medium']

  const scaleArgs = settings.resolution !== Resolution.OG
    && metadata.height >= (resolutionMap[settings.resolution]?.height ?? Infinity)
    ? ['-vf', `scale=${targetRes.width}:${targetRes.height}:flags=bicubic`]
    : []

  const audioArgs = settings.removeAudio
    ? ['-an']
    : [
        '-c:a', 'aac',
        '-b:a', settings.quality === Quality.Low
          ? '96k'
          : settings.quality === Quality.High
            ? '192k'
            : '128k',
      ]

  return [
    ...codecArgs,
    '-ss', trimValues.start.toString(),
    '-to', trimValues.end.toString(),
    '-crf', crfMap[settings.quality],
    ...scaleArgs,
    ...audioArgs,
    '-movflags', '+faststart',
  ]
}

export async function compressWithWebCodecs(
  file: File,
  config: Partial<Pick<ConversionOptions, 'video' | 'audio' | 'trim'>>,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const input = new Input({
    source: new BlobSource(file),
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
    onProgress(Math.round(p * 100))
  }

  await conversion.execute()
  const mp4Buffer = output.target.buffer

  if (!mp4Buffer) {
    throw new Error('No buffer')
  }

  return new Blob([mp4Buffer], { type: 'video/mp4' })
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg

  ffmpeg = new FFmpeg()
  await ffmpeg.load()
  return ffmpeg
}

export async function compressWithFFmpeg(
  file: File,
  args: string[],
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const instance = await loadFFmpeg()

  instance.on('progress', ({ progress: p }) => {
    onProgress(Math.round((p || 0) * 100))
  })

  const ext = file.name.split('.').pop() || 'mp4'
  const inputName = `input.${ext}`
  const outputName = 'output.mp4'

  await instance.writeFile(inputName, await fetchFile(file))
  await instance.exec(['-i', inputName, ...args, '-y', outputName])

  const data = await instance.readFile(outputName)
  const blob = new Blob([data], { type: 'video/mp4' })

  await instance.deleteFile(inputName)
  await instance.deleteFile(outputName)

  return blob
}

export async function compressFile(
  file: File,
  metadata: VideoMetaData,
  settings: CompressionSettings,
  supportedCodecs: Set<Codec>,
  onProgress: (percent: number) => void,
  trim?: { start: number
    end: number },
): Promise<Blob> {
  if ('VideoEncoder' in window && supportedCodecs.has(settings.codec)) {
    try {
      const config = buildConversionConfig(metadata, settings, trim)
      return await compressWithWebCodecs(file, config, onProgress)
    }
    catch (error) {
      console.error('WebCodecs error:', error)
      console.log('Falling back to FFmpeg...')
    }
  }

  const args = buildFFmpegArgs(metadata, settings, trim)
  return await compressWithFFmpeg(file, args, onProgress)
}
