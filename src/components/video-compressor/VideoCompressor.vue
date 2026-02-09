<script setup lang="ts">
import {
  Download,
  FolderArchive,
  Loader2,
  Plus,
  Repeat2,
  Upload,
} from 'lucide-vue-next'
import { computed } from 'vue'

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
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/i18n/vue.ts'
import { formatSize } from '@/lib/utils'

import BatchFileList from './BatchFileList.vue'
import { BatchStatus, Status } from './types.ts'
import { useBatchCompressor } from './useBatchCompressor.ts'
import { useVideoCompressor } from './useVideoCompressor.ts'

const props = defineProps<{ locale?: string }>()

const { t } = useI18n(props.locale)

const {
  inputFile,
  outputBlob,
  availableCodecs: singleAvailableCodecs,
  availableQuality,
  availableResolutions: singleAvailableResolutions,
  codec: singleCodec,
  compressionInfo,
  quality: singleQuality,
  resolution: singleResolution,
  status,
  progress,
  previewUrl,
  trimEndComputed,
  trimStartComputed,
  videoMetadata,
  videoRef,
  removeAudio: singleRemoveAudio,
  handleCompress,
  handleFile: handleSingleFile,
  downloadVideo,
  updateTrimValues,
} = useVideoCompressor(props.locale)

const {
  files: batchFiles,
  batchStatus,
  currentFileId,
  codec: batchCodec,
  quality: batchQuality,
  resolution: batchResolution,
  removeAudio: batchRemoveAudio,
  availableCodecs: batchAvailableCodecs,
  availableResolutions: batchAvailableResolutions,
  totalCount,
  completedCount,
  overallProgress,
  totalOutputSize,
  addFiles,
  removeFile,
  startBatch,
  cancelBatch,
  downloadFile,
  downloadAll,
  resetBatch,
} = useBatchCompressor(props.locale)

const isBatchMode = computed(() => batchFiles.value.length > 0)

const FILE_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-matroska'

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  const fileList = target.files
  if (!fileList || fileList.length === 0) return

  if (fileList.length === 1 && !isBatchMode.value) {
    handleSingleFile(e)
  }
  else {
    inputFile.value = null
    outputBlob.value = null
    addFiles(fileList)
  }

  target.value = ''
}

function handleAddMore(e: Event) {
  const target = e.target as HTMLInputElement
  const fileList = target.files
  if (!fileList || fileList.length === 0) return

  addFiles(fileList)
  target.value = ''
}

function handleNewBatch() {
  resetBatch()
}
</script>

<template>
  <section class="container">
    <h1 class="absolute size-0 left-0 top-0 invisible">
      {{ t('comp.pageTitle') }}
    </h1>

    <div class="text-center">
      <p class="text-lg mb-6">
        {{ t('comp.tagline') }}
      </p>
    </div>

    <Transition mode="out-in">
      <!-- Upload state -->
      <Card v-if="!inputFile && !isBatchMode">
        <CardHeader>
          <CardTitle>{{ t('comp.addVideo') }}</CardTitle>
          <CardDescription>{{ t('comp.formats') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 grow">
          <div class="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload class="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <input
              type="file"
              multiple
              :accept="FILE_ACCEPT"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handleFileInput"
            >
            <p class="font-medium mb-1">
              {{ t('comp.dropHint') }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Batch mode -->
      <div
        v-else-if="isBatchMode"
        class="grid lg:grid-cols-2 gap-5 items-start"
      >
        <Card>
          <CardHeader>
            <CardTitle>{{ t('batch.files', { count: totalCount }) }}</CardTitle>
            <CardDescription>{{ t('batch.completed', { done: completedCount, total: totalCount }) }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 grow">
            <BatchFileList
              :files="batchFiles"
              :current-file-id="currentFileId"
              @remove="removeFile"
              @download="downloadFile"
            />
            <Button
              class="relative cursor-pointer w-full"
              variant="outline"
              as="label"
              :disabled="batchStatus === BatchStatus.Processing"
            >
              <input
                type="file"
                multiple
                :accept="FILE_ACCEPT"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleAddMore"
              >
              <Plus class="size-4" />
              {{ t('batch.addMore') }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('comp.settings') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-5 relative">
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('comp.codec') }}</label>
              <RadioGroup
                v-model="batchCodec"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="batchStatus === BatchStatus.Processing"
              >
                <FieldLabel
                  v-for="(item, index) in batchAvailableCodecs"
                  :key="index"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      id="batch-codec"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('comp.compression') }}</label>
              <RadioGroup
                v-model="batchQuality"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="batchStatus === BatchStatus.Processing"
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
                      id="batch-quality"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('comp.resolution') }}</label>
              <RadioGroup
                v-model="batchResolution"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="batchStatus === BatchStatus.Processing"
              >
                <FieldLabel
                  v-for="(item, index) in batchAvailableResolutions"
                  :key="index"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                      <FieldDescription v-if="item.description">
                        {{ item.description }}
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      id="batch-resolution"
                      :value="item.value"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <div>
              <div class="flex items-center space-x-2">
                <Switch
                  id="batch-remove-audio"
                  v-model="batchRemoveAudio"
                />
                <Label for="batch-remove-audio">{{ t('comp.removeAudio') }}</Label>
              </div>
            </div>

            <Transition mode="out-in">
              <Button
                v-if="batchStatus === BatchStatus.Done"
                class="w-full"
                size="lg"
                @click="downloadAll"
              >
                <FolderArchive class="size-4" />
                {{ t('batch.downloadAll', { size: formatSize(totalOutputSize) }) }}
              </Button>
              <Button
                v-else-if="batchStatus === BatchStatus.Processing"
                class="w-full"
                size="lg"
                variant="destructive"
                @click="cancelBatch"
              >
                {{ t('batch.cancel') }}
              </Button>
              <Button
                v-else
                class="w-full"
                size="lg"
                :disabled="totalCount === 0"
                @click="startBatch"
              >
                {{ t('batch.compressAll') }}
              </Button>
            </Transition>
          </CardContent>
        </Card>
      </div>

      <!-- Single file mode -->
      <div
        v-else
        class="grid lg:grid-cols-2 gap-5 items-start"
      >
        <Card v-if="inputFile && previewUrl">
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
                multiple
                :accept="FILE_ACCEPT"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleFileInput"
              >
              {{ t('comp.newVideo') }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('comp.settings') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-5 relative">
            <div>
              <label class="text-sm font-medium mb-1 block">{{ t('comp.codec') }}</label>
              <RadioGroup
                v-model="singleCodec"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="!inputFile || status === Status.Processing"
              >
                <FieldLabel
                  v-for="(item, index) in singleAvailableCodecs"
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
              <label class="text-sm font-medium mb-1 block">{{ t('comp.compression') }}</label>
              <RadioGroup
                v-model="singleQuality"
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
              <label class="text-sm font-medium mb-1 block">{{ t('comp.resolution') }}</label>
              <RadioGroup
                v-model="singleResolution"
                class="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))]"
                :disabled="!inputFile || status === Status.Processing"
              >
                <FieldLabel
                  v-for="(item, index) in singleAvailableResolutions"
                  :key="index"
                  class="cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{{ item.label }}</FieldTitle>
                      <FieldDescription v-if="item.description">
                        {{ item.description }}
                      </FieldDescription>
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
              <div class="flex items-center space-x-2">
                <Switch
                  id="remove-audio"
                  v-model="singleRemoveAudio"
                />
                <Label for="remove-audio">{{ t('comp.removeAudio') }}</Label>
              </div>
            </div>

            <p
              v-if="compressionInfo"
              class="text-sm text-muted-foreground"
            >
              {{
                t('comp.estimatedSize', {
                  min: compressionInfo.min.toFixed(1),
                  max: compressionInfo.max.toFixed(1),
                })
              }}
            </p>

            <Transition mode="out-in">
              <Button
                v-if="outputBlob && status === Status.Done"
                class="w-full"
                size="lg"
                @click="downloadVideo"
              >
                <Download class="size-4" />
                {{ t('comp.download', { size: formatSize(outputBlob.size) }) }}
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
                  {{ t('comp.processing', { progress }) }}
                </template>
                <template v-else>
                  {{ t('comp.compress') }}
                </template>
              </Button>
            </Transition>
          </CardContent>
        </Card>
      </div>
    </Transition>

    <!-- Single file bottom bar -->
    <Teleport to="body">
      <Transition>
        <div
          v-show="!isBatchMode && (status === Status.Processing || status === Status.Done)"
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
                    {{ t('comp.processing', { progress }) }}
                  </template>
                  <template v-else>
                    {{ t('comp.done') }}
                  </template>
                </Badge>
                <Transition>
                  <ButtonGroup v-if="outputBlob && status === Status.Done">
                    <Button @click="downloadVideo">
                      <Download class="size-4" />
                      {{ t('comp.download', { size: formatSize(outputBlob.size) }) }}
                    </Button>
                    <Button
                      variant="secondary"
                      @click="handleCompress"
                    >
                      <Repeat2 class="size-4" />
                      {{ t('comp.regenerate') }}
                    </Button>
                    <Button
                      class="relative cursor-pointer"
                      variant="destructive"
                      as="label"
                    >
                      <input
                        type="file"
                        multiple
                        :accept="FILE_ACCEPT"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        @change="handleFileInput"
                      >
                      {{ t('comp.newVideo') }}
                    </Button>
                  </ButtonGroup>
                </Transition>
              </div>
            </CardContent>
          </Card>
        </div>
      </Transition>
    </Teleport>

    <!-- Batch bottom bar -->
    <Teleport to="body">
      <Transition>
        <div
          v-show="isBatchMode && (batchStatus === BatchStatus.Processing || batchStatus === BatchStatus.Done)"
          class="fixed left-0 bottom-0 w-full"
        >
          <Card class="relative w-full m-0 rounded-none">
            <CardContent>
              <Progress
                :model-value="overallProgress"
                class="absolute top-0 left-0 h-3 rounded-none"
              />

              <div class="flex flex-wrap justify-between items-center">
                <Badge>
                  <template v-if="batchStatus === BatchStatus.Processing">
                    {{ t('batch.processing', { done: completedCount, total: totalCount }) }}
                  </template>
                  <template v-else>
                    {{ t('batch.allDone') }}
                  </template>
                </Badge>
                <Transition>
                  <ButtonGroup v-if="batchStatus === BatchStatus.Done">
                    <Button @click="downloadAll">
                      <FolderArchive class="size-4" />
                      {{ t('batch.downloadAll', { size: formatSize(totalOutputSize) }) }}
                    </Button>
                    <Button
                      variant="destructive"
                      @click="handleNewBatch"
                    >
                      {{ t('batch.newBatch') }}
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
