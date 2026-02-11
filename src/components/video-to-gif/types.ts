export enum GifFps {
  F10 = 10,
  F15 = 15,
  F20 = 20,
  F24 = 24,
}

export enum GifWidth {
  W320 = 320,
  W480 = 480,
  W640 = 640,
  Original = 0,
}

export enum GifColors {
  C64 = 64,
  C128 = 128,
  C256 = 256,
}

export enum GifDither {
  None = 'none',
  FloydSteinberg = 'floyd_steinberg',
  Bayer = 'bayer:bayer_scale=3',
}

export interface GifSettings {
  fps: GifFps
  width: GifWidth
  colors: GifColors
  dither: GifDither
}
