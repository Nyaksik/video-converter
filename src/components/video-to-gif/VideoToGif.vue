<script setup lang="ts">
import {
  Download,
  Loader2,
  Repeat2,
  Upload,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { useI18n } from '@/i18n/vue.ts'
import { formatSize } from '@/lib/utils'

import { Status } from '../video-compressor/types.ts'

import { useVideoToGif } from './useVideoToGif.ts'

const props = defineProps<{ locale?: string }>()

const { t } = useI18n(props.locale)

const {
  inputFile,
  outputBlob,
  progress,
  status,
  videoMetadata,
  previewUrl,
  videoRef,
  trimStartComputed,
  trimEndComputed,

  fps,
  width,
  colors,
  dither,
  availableFps,
  availableWidths,
  availableColors,
  availableDithers,
  estimatedSize,

  handleConvert,
  downloadGif,
  handleFile,
  updateTrimValues,
} = useVideoToGif(props.locale)

const FILE_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-matroska'
</script>

<template>
  <section class="container">
    <h1 class="absolute size-0 left-0 top-0 invisible">
      {{ t('gif.pageTitle') }}
    </h1>

    <div class="text-center">
      <p class="text-lg mb-6">
        {{ t('gif.tagline') }}
      </p>
    </div>

    <Transition mode="out-in">
      <!-- Upload state -->
      <Card v-if="!inputFile">
        <CardHeader>
          <CardTitle>{{ t('gif.addVideo') }}</CardTitle>
          <CardDescription>{{ t('gif.formats') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 grow">
          <div class="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload class="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <input
              type="file"
              :accept="FILE_ACCEPT"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handleFile"
            >
            <p class="font-medium mb-1">
              {{ t('gif.dropHint') }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- File loaded -->
      <div
        v-else
        class="grid lg:grid-cols-2 gap-5 items-start"
      >
        <Card v-if="previewUrl">
          <CardHeader>
            <CardTitle>{{ inputFile.name }}</CardTitle>
            <CardDescription>{{ formatSize(inputFile.size) }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 grow">
            <video
              ref="videoRef"
              :src="previewUrl"
              controls
              class="rounded-xl"
            />
            <Slider
              class="mb-5"
              :model-value="[trimStartComputed, trimEndComputed]"
              :default-value="[0, videoMetadata?.duration ?? 1]"
              :max="videoMetadata?.duration"
              :step="0.001"
              @update:model-value="updateTrimValues"
            />
            <div class="grid grid-cols-2 gap-5">
              <Input
                v-model.number="trimStartComputed"
                type="number"
                :min="0"
                :max="videoMetadata?.duration"
              />
              <Input
                v-model.number="trimEndComputed"
                type="number"
                :min="0"
                :max="videoMetadata?.duration"
              />
            </div>

            <Button
              class="relative cursor-pointer w-full"
              variant="destructive"
              as="label"
            >
              <input
                type="file"
                :accept="FILE_ACCEPT"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleFile"
              >
              {{ t('gif.newVideo') }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('gif.settings') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-5 relative">
            <!-- FPS -->
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('gif.fps') }}</label>
              <RadioGroup
                v-model="fps"
                class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
                :disabled="status === Status.Processing"
              >
                <FieldLabel
                  v-for="item in availableFps"
                  :key="item.value"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      id="fps"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <!-- Width -->
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('gif.width') }}</label>
              <RadioGroup
                v-model="width"
                class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
                :disabled="status === Status.Processing"
              >
                <FieldLabel
                  v-for="item in availableWidths"
                  :key="item.value"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      id="width"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <!-- Colors -->
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('gif.colors') }}</label>
              <RadioGroup
                v-model="colors"
                class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
                :disabled="status === Status.Processing"
              >
                <FieldLabel
                  v-for="item in availableColors"
                  :key="item.value"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      id="colors"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <!-- Dithering -->
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('gif.dither') }}</label>
              <RadioGroup
                v-model="dither"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="status === Status.Processing"
              >
                <FieldLabel
                  v-for="item in availableDithers"
                  :key="item.value"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      id="dither"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <p
              v-if="estimatedSize"
              class="text-sm text-muted-foreground"
            >
              {{
                t('gif.estimatedSize', {
                  min: estimatedSize.min.toFixed(1),
                  max: estimatedSize.max.toFixed(1),
                })
              }}
            </p>

            <Transition mode="out-in">
              <Button
                v-if="outputBlob && status === Status.Done"
                class="w-full"
                size="lg"
                @click="downloadGif"
              >
                <Download class="size-4" />
                {{ t('gif.download', { size: formatSize(outputBlob.size) }) }}
              </Button>
              <Button
                v-else
                class="w-full"
                size="lg"
                :disabled="!inputFile || status === Status.Processing"
                @click="handleConvert"
              >
                <Loader2
                  v-if="status === Status.Processing"
                  class="w-5 h-5 mr-2 animate-spin"
                />
                <template v-if="status === Status.Processing">
                  {{ t('gif.processing', { progress }) }}
                </template>
                <template v-else>
                  {{ t('gif.convert') }}
                </template>
              </Button>
            </Transition>
          </CardContent>
        </Card>
      </div>
    </Transition>

    <!-- Bottom bar -->
    <Teleport to="body">
      <Transition>
        <div
          v-show="status === Status.Processing || status === Status.Done"
          class="fixed left-0 bottom-0 w-full"
        >
          <Card class="relative w-full m-0 rounded-none">
            <CardContent>
              <Progress
                :model-value="progress"
                class="absolute top-0 left-0 h-3 rounded-none"
              />

              <div class="flex flex-wrap justify-between items-center">
                <Badge>
                  <template v-if="status === Status.Processing">
                    {{ t('gif.processing', { progress }) }}
                  </template>
                  <template v-else>
                    {{ t('gif.done') }}
                  </template>
                </Badge>
                <Transition>
                  <ButtonGroup v-if="outputBlob && status === Status.Done">
                    <Button @click="downloadGif">
                      <Download class="size-4" />
                      {{ t('gif.download', { size: formatSize(outputBlob.size) }) }}
                    </Button>
                    <Button
                      variant="secondary"
                      @click="handleConvert"
                    >
                      <Repeat2 class="size-4" />
                    </Button>
                    <Button
                      class="relative cursor-pointer"
                      variant="destructive"
                      as="label"
                    >
                      <input
                        type="file"
                        :accept="FILE_ACCEPT"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        @change="handleFile"
                      >
                      {{ t('gif.newVideo') }}
                    </Button>
                  </ButtonGroup>
                </Transition>
              </div>
            </CardContent>
          </Card>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
