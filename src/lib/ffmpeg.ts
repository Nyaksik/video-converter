import { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpeg: FFmpeg | null = null

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg

  ffmpeg = new FFmpeg()
  await ffmpeg.load()
  return ffmpeg
}
