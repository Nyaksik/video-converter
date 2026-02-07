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

export enum Resolution {
  OG,
  FullHD,
  HD,
  SD,
}

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
  description?: string
  disabled: boolean
  pixels?: number
}
