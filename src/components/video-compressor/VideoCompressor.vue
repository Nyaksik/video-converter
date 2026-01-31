<script setup lang="ts">
import { Download, Upload, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { useVideoCompressor } from '@/components/video-compressor/useVideoCompressor.ts'
import { Status } from './types.ts'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Field, FieldContent, FieldLabel, FieldTitle } from '@/components/ui/field'

const { inputFile, outputBlob, availableCodecs, availableQuality, availableResolutions, compressionInfo, codec, quality, resolution, status, progress, handleCompress, handleFile, downloadVideo } = useVideoCompressor()
</script>

<template>
  <section class="container">
    <div class="text-center">
      <p class="text-lg text-slate-600">
        Сожми видео за секунды!
      </p>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Добавь видео</CardTitle>
          <CardDescription>Поддержка MP4, MOV, WebM, MKV</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 grow">
          <div class="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors h-full flex flex-col justify-center">
            <Upload class="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handleFile"
            >
            <p class="font-medium text-slate-700 mb-1">
              {{ inputFile ? inputFile.name : 'Нажми или перетащи видео' }}
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

      <Card>
        <CardHeader>
          <CardTitle>Настройки сжатия</CardTitle>
        </CardHeader>
        <CardContent class="relative">
          <div>
            <label class="text-sm font-medium mb-1 block">Кодек</label>
            <RadioGroup
              v-model="codec"
              class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
              :disabled="!inputFile"
            >
              <FieldLabel
                v-for="(item, index) in availableCodecs"
                :key="index"
                class="cursor-pointer"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{{ item.label }}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    id="codec"
                    :value="item.value"
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Сжатие</label>
            <RadioGroup
              v-model="quality"
              class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
              :disabled="!inputFile"
            >
              <FieldLabel
                v-for="(item, index) in availableQuality"
                :key="index"
                class="cursor-pointer"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{{ item.label }}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    id="codec"
                    :value="item.value"
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Разрешение</label>
            <RadioGroup
              v-model="resolution"
              class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]"
              :disabled="!inputFile"
            >
              <FieldLabel
                v-for="(item, index) in availableResolutions"
                :key="index"
                class="cursor-pointer"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{{ item.label }}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    id="codec"
                    :value="item.value"
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </div>

          <Button
            class="w-full"
            size="lg"
            :disabled="(!inputFile && status !== Status.Processing) || status === Status.Loading"
            @click="handleCompress"
          >
            <Loader2
              v-if="status === Status.Loading"
              class="w-5 h-5 mr-2 animate-spin"
            />
            {{ status === Status.Loading ? '' : 'Сжать видео' }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card v-if="outputBlob && status === Status.Done">
      <CardHeader>
        <CardTitle>Готово!</CardTitle>
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

    <Teleport to="body">
      <Transition>
        <div class="sticky left-0 bottom-0">
          <Card
            v-show="status === Status.Processing || status === Status.Done"
            class="relative w-full m-0 rounded-none"
          >
            <CardContent class="">
              <Progress
                :model-value="progress"
                class="absolute top-0 left-0 h-3 rounded-none"
              />
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
