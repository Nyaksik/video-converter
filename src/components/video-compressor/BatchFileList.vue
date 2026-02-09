<script setup lang="ts">
import {
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  X,
  XCircle,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { type BatchFileItem, BatchFileStatus } from './types.ts'

defineProps<{
  files: BatchFileItem[]
  currentFileId: string | null
}>()

defineEmits<{
  remove: [id: string]
  download: [id: string]
}>()

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="item in files"
      :key="item.id"
      class="flex items-center gap-3 py-3 px-2 rounded-lg border-b rounded-none"
    >
      <component
        :is="
          item.status === BatchFileStatus.Done
            ? CheckCircle2
            : item.status === BatchFileStatus.Error
              ? XCircle
              : item.status === BatchFileStatus.Processing || item.status === BatchFileStatus.Analyzing
                ? Loader2
                : Circle
        "
        :class="[
          'size-5 shrink-0',
          item.status === BatchFileStatus.Done && 'text-green',
          item.status === BatchFileStatus.Error && 'text-destructive',
          (item.status === BatchFileStatus.Processing || item.status === BatchFileStatus.Analyzing)
            && 'animate-spin text-primary',
          (item.status === BatchFileStatus.Pending) && 'text-muted-foreground',
        ]"
      />

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">
          {{ item.file.name }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatSize(item.file.size) }}
          <template v-if="item.outputBlob">
            &rarr; {{ formatSize(item.outputBlob.size) }}
          </template>
        </p>
        <Progress
          v-if="item.status === BatchFileStatus.Processing"
          :model-value="item.progress"
          class="mt-1.5 h-1.5"
        />
        <Badge
          v-if="item.status === BatchFileStatus.Error && item.error"
          variant="destructive"
          class="mt-1 text-xs"
        >
          {{ item.error }}
        </Badge>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <Button
          v-if="item.status === BatchFileStatus.Done"
          size="icon-sm"
          variant="ghost"
          @click="$emit('download', item.id)"
        >
          <Download class="size-4" />
        </Button>
        <Button
          v-if="item.status !== BatchFileStatus.Processing"
          size="icon-sm"
          variant="ghost"
          @click="$emit('remove', item.id)"
        >
          <X class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
