import { fetchFile } from '@ffmpeg/util'

import { loadFFmpeg } from '@/lib/ffmpeg.ts'

import {
  GifDither,
  type GifSettings,
  GifWidth,
} from './types.ts'

import type { VideoMetaData } from '../video-compressor/types.ts'

export async function convertToGif(
  file: File,
  metadata: VideoMetaData,
  settings: GifSettings,
  trim: {
    start: number
    end: number
  },
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg()

  const duration = trim.end - trim.start

  const ext = file.name.split('.').pop() || 'mp4'
  const inputName = `input.${ext}`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const width = settings.width === GifWidth.Original
    ? metadata.width
    : settings.width

  const scaleFilter = `fps=${settings.fps},scale=${width}:-1:flags=lanczos`

  // Pass 1: generate palette
  await ffmpeg.exec([
    '-ss', trim.start.toString(),
    '-t', duration.toString(),
    '-i', inputName,
    '-vf', `${scaleFilter},palettegen=max_colors=${settings.colors}`,
    '-y', 'palette.png',
  ])

  // Pass 2: convert using palette
  const ditherOpt = settings.dither === GifDither.None
    ? 'paletteuse'
    : `paletteuse=dither=${settings.dither}`

  const gifHandler = ({ progress: p }: { progress: number }) => {
    onProgress(Math.round(Math.min((p || 0) * 100, 100)))
  }

  ffmpeg.on('progress', gifHandler)

  await ffmpeg.exec([
    '-ss', trim.start.toString(),
    '-t', duration.toString(),
    '-i', inputName,
    '-i', 'palette.png',
    '-filter_complex', `${scaleFilter}[x];[x][1:v]${ditherOpt}`,
    '-y', 'output.gif',
  ])

  ffmpeg.off('progress', gifHandler)

  const data = await ffmpeg.readFile('output.gif')
  const blob = new Blob([data], { type: 'image/gif' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile('palette.png')
  await ffmpeg.deleteFile('output.gif')

  return blob
}
