<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { languages, type Locale } from '@/i18n/ui.ts'

const props = defineProps<{ locale?: string }>()

const current = ref<Locale>((props.locale ?? 'ru') as Locale)

watch(current, (v) => {
  const lang = v as Locale

  localStorage.setItem('locale', lang)

  const path = window.location.pathname

  if (lang === 'ru') {
    window.location.href = path.replace(/^\/en(\/|$)/, '/')
  }
  else {
    const clean = path.replace(/^\/en(\/|$)/, '/')
    window.location.href = '/en' + (clean === '/' ? '/' : clean)
  }
})
</script>

<template>
  <Select v-model="current">
    <SelectTrigger
      size="sm"
      class="gap-1 border-none shadow-none"
    >
      <Globe class="size-4" />
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="(label, code) in languages"
        :key="code"
        :value="code"
      >
        {{ label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
