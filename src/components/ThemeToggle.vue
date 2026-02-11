<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Moon, Sun } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'

const isDark = useDark({
  storageKey: 'theme',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    @click="toggleDark()"
  >
    <Sun
      v-if="isDark"
      class="size-5"
    />
    <Moon
      v-else
      class="size-5"
    />
  </Button>
</template>
