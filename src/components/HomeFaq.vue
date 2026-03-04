<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'

import { useI18n } from '@/i18n/vue'

import type { TranslationKey } from '@/i18n/ui'

const props = defineProps<{ lang?: string }>()

const { t } = useI18n(props.lang)

const items: { q: TranslationKey
  a: TranslationKey }[] = [
  {
    q: 'home.faq1Q',
    a: 'home.faq1A',
  },
  {
    q: 'home.faq2Q',
    a: 'home.faq2A',
  },
  {
    q: 'home.faq3Q',
    a: 'home.faq3A',
  },
  {
    q: 'home.faq4Q',
    a: 'home.faq4A',
  },
  {
    q: 'home.faq5Q',
    a: 'home.faq5A',
  },
]
</script>

<template>
  <AccordionRoot
    type="single"
    collapsible
    class="w-full divide-y divide-border"
  >
    <AccordionItem
      v-for="(item, i) in items"
      :key="i"
      :value="`faq-${i}`"
      class="group"
    >
      <AccordionHeader as="h3">
        <AccordionTrigger
          class="flex w-full items-center justify-between py-4 text-left text-base font-medium transition-colors hover:text-foreground/80 [&[data-state=open]>svg]:rotate-180"
        >
          {{ t(item.q) }}
          <ChevronDown class="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <p class="pb-4 text-muted-foreground">
          {{ t(item.a) }}
        </p>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
