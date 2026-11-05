<script setup lang="ts">
import { computed } from 'vue'
import { MAIN_DECK_MIN } from '@/services/deck'
import { DECK_LIMITS } from '@/types/api'

/**
 * Bars for the Main and Extra deck sizes. Decks under the legal minimum can
 * still be saved (they are drafts), so this only informs.
 */
const props = defineProps<{ main: number; extra: number }>()

const percent = (value: number, max: number) => `${Math.min(value / max, 1) * 100}%`
const legalZoneStart = `${(MAIN_DECK_MIN / DECK_LIMITS.main) * 100}%`
const missing = computed(() => Math.max(MAIN_DECK_MIN - props.main, 0))
</script>

<template>
  <div class="px-2 py-1 flex flex-col gap-1 bg-black/20" data-testid="deck-limits">
    <div class="flex items-center gap-2" aria-hidden="true">
      <span class="w-12 text-xs text-gray-400">Main</span>
      <div class="relative flex-1 h-1.5 bg-blue-800">
        <div
          class="absolute -inset-y-0.5 right-0 border-x-2 border-green-400 bg-green-400/15"
          :style="{ left: legalZoneStart }"
        />
        <div
          class="absolute inset-y-0 left-0 bg-blue-500"
          :style="{ width: percent(main, DECK_LIMITS.main) }"
        />
      </div>
    </div>
    <div class="flex items-center gap-2" aria-hidden="true">
      <span class="w-12 text-xs text-gray-400">Extra</span>
      <div class="relative flex-1 h-1.5 bg-blue-800">
        <div
          class="absolute inset-y-0 left-0 bg-blue-500"
          :style="{ width: percent(extra, DECK_LIMITS.extra) }"
        />
      </div>
    </div>
    <p v-if="missing" class="text-xs text-orange-200" data-testid="deck-draft">
      {{ $t('help.limits.draft', { missing }, missing) }}
    </p>
    <p v-else class="text-xs text-green-400" data-testid="deck-legal">
      {{ $t('help.limits.legal', { min: MAIN_DECK_MIN, max: DECK_LIMITS.main }) }}
    </p>
  </div>
</template>
