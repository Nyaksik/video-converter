<script setup lang="ts">
import { Download, Upload, Loader2, Repeat2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useVideoCompressor } from '@/components/video-compressor/useVideoCompressor.ts'
import { Status } from './types.ts'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Field, FieldContent, FieldLabel, FieldTitle } from '@/components/ui/field'
import { ButtonGroup } from '@/components/ui/button-group'
import { Badge } from '@/components/ui/badge'

const { inputFile, outputBlob, availableCodecs, availableQuality, availableResolutions, compressionInfo, codec, quality, resolution, status, progress, handleCompress, handleFile, downloadVideo } = useVideoCompressor()
</script>

<template>
  <section class="container">
    <h1 class="absolute size-0 left-0 top-0 invisible">
      Видео компрессор
    </h1>

    <div class="text-center">
      <p class="text-lg text-slate-600 mb-6">
        Сожми видео за секунды!
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-5 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Добавь видео</CardTitle>
          <CardDescription>Поддержка MP4, MOV, WebM, MKV</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 grow">
          <div class="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
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
        <CardContent class="grid gap-5 relative">
          <div>
            <label class="text-sm font-medium mb-1 block">Кодек</label>
            <RadioGroup
              v-model="codec"
              class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
              :disabled="!inputFile || status === Status.Processing"
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
              class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
              :disabled="!inputFile || status === Status.Processing"
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
              class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
              :disabled="!inputFile || status === Status.Processing"
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

          <Transition mode="out-in">
            <Button
              v-if="outputBlob && status === Status.Done"
              class="w-full"
              size="lg"
              @click="downloadVideo"
            >
              <Download class="size-4" />
              Скачать {{ Math.round(outputBlob.size / 1024 / 1024 * 100) / 100 }} MB
            </Button>
            <Button
              v-else
              class="w-full"
              size="lg"
              :disabled="!inputFile || status === Status.Loading || status === Status.Processing"
              @click="handleCompress"
            >
              <Loader2
                v-if="status === Status.Loading || status === Status.Processing"
                class="w-5 h-5 mr-2 animate-spin"
              />
              <template v-if="status === Status.Loading" />
              <template v-else-if="status === Status.Processing">
                Обработка {{ progress }}&percnt;
              </template>
              <template v-else>
                Сжать видео
              </template>
            </Button>
          </Transition>
        </CardContent>
      </Card>
    </div>

    <Teleport to="body">
      <Transition>
        <div
          v-show="status === Status.Processing || status === Status.Done"
          class="sticky left-0 bottom-0"
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
                    Обработка {{ progress }}&percnt;
                  </template>
                  <template v-else>
                    Готово
                  </template>
                </Badge>
                <Transition>
                  <ButtonGroup v-if="outputBlob && status === Status.Done">
                    <Button @click="downloadVideo">
                      <Download class="size-4" />
                      Скачать {{ Math.round(outputBlob.size / 1024 / 1024 * 100) / 100 }} MB
                    </Button>
                    <Button
                      variant="secondary"
                      @click="handleCompress"
                    >
                      <Repeat2 class="size-4" />
                      Перегенерировать
                    </Button>
                    <Button
                      class="relative cursor-pointer"
                      variant="destructive"
                      as="label"
                    >
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        @change="handleFile"
                      >
                      Новое видео
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
