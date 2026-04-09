<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { VisuallyHidden } from 'reka-ui'

import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useI18n } from '@/i18n/vue.ts'

const props = defineProps<{
  locale: string
  base: string
}>()

const { t } = useI18n(props.locale)

const prefix = props.locale === 'ru' ? '' : `/${props.locale}`

const links = [
  {
    href: `${props.base}${prefix}/compressor`,
    label: t('nav.compressor'),
  },
  {
    href: `${props.base}${prefix}/gif`,
    label: t('nav.gif'),
  },
]
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('nav.menu')"
      >
        <Menu class="size-5" />
      </Button>
    </SheetTrigger>

    <SheetContent
      :aria-describedby="undefined"
      class="w-full sm:max-w-full"
    >
      <VisuallyHidden>
        <SheetTitle>{{ t('nav.menu') }}</SheetTitle>
      </VisuallyHidden>

      <div class="flex flex-col items-center justify-center h-full">
        <nav class="flex flex-col gap-2.5">
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
            class="text-lg font-medium text-center hover:text-blue-500 transition-colors"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="flex items-center gap-1 mt-6">
          <LanguageSwitcher :locale="locale" />
          <ThemeToggle />
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
