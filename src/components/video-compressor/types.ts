export enum Status {
  Idle,
  Loading,
  Processing,
  Done,
}

export enum Quality {
  High,
  Medium,
  Low,
}

export type Resolution = 'og' | '1080p' | '720p' | '480p'
export type Codec = 'h264' | 'vp9' | 'av1'

export type VideoMetaData = {
  width: number
  height: number
  duration: number
  estimatedBitrate: number
}

export type ResolutionItem = {
  value: Resolution
  label: string
  disabled: boolean
  pixels: number
}
