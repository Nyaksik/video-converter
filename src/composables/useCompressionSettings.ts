import { computed, ref } from 'vue'

import { detectBrowserCodecs } from '@/components/video-compressor/compressFile.ts'
import {
  type Codec,
  Quality,
  Resolution,
} from '@/components/video-compressor/types.ts'

export const availableQuality = [
  {
    value: Quality.High,
    label: 'Fast',
  },
  {
    value: Quality.Medium,
    label: 'Balance',
  },
  {
    value: Quality.Low,
    label: 'Strong',
  },
]

export function useCompressionSettings() {
  const supportedCodecs = ref<Set<Codec>>(new Set(['h264']))
  const codec = ref<Codec>('h264')
  const quality = ref<Quality>(Quality.Medium)
  const resolution = ref<Resolution>(Resolution.OG)
  const removeAudio = ref(false)

  const availableCodecs = computed(() => {
    const codecs = [
      {
        value: 'h264',
        label: 'H.264',
        supported: supportedCodecs.value.has('h264'),
      },
      {
        value: 'vp9',
        label: 'VP9',
        supported: supportedCodecs.value.has('vp9'),
      },
      {
        value: 'av1',
        label: 'AV1',
        supported: supportedCodecs.value.has('av1'),
      },
    ]

    return codecs.filter(c => c.supported)
  })

  async function detectAndSetCodecs() {
    const codecs = await detectBrowserCodecs()
    supportedCodecs.value = codecs
    if (!codecs.has(codec.value)) {
      codec.value = Array.from(codecs)[0] || 'h264'
    }
  }

  return {
    supportedCodecs,
    codec,
    quality,
    resolution,
    removeAudio,
    availableCodecs,
    availableQuality,
    detectAndSetCodecs,
  }
}
