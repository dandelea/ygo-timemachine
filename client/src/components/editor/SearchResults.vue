<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHint from '@/components/help/SectionHint.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import { vTooltip } from '@/directives/tooltip'
import type { AddBlockReason } from '@/services/deck'
import type { LoadStatus } from '@/stores/decks'
import { DECK_LIMITS, type Card, type CardSearchResult, type DbStats } from '@/types/api'

const props = defineProps<{
  results: CardSearchResult
  stats: DbStats
  status: LoadStatus
  blockReason: (card: Card) => AddBlockReason | null
}>()
const emit = defineEmits<{
  add: [card: Card]
  select: [card: Card]
  retry: []
}>()

const { t } = useI18n()

const blockMessage = (reason: AddBlockReason) =>
  ({
    copies: t('help.blocked.copies', { copies: DECK_LIMITS.copies }),
    'main-full': t('help.blocked.mainFull', { max: DECK_LIMITS.main }),
    'extra-full': t('help.blocked.extraFull', { max: DECK_LIMITS.extra }),
  })[reason]
const blockLabel = (reason: AddBlockReason) =>
  reason === 'copies' ? `${DECK_LIMITS.copies}/${DECK_LIMITS.copies}` : t('help.blocked.full')

// Shown count is bounded by the page size; the total is the number of matches.
const shown = computed(() => Math.min(props.stats.pageSize, props.results.total))
</script>

<template>
  <div>
    <div class="p-2 bg-blue-800 text-center mb-2 text-sm md:text-base" aria-live="polite">
      <FontAwesomeIcon v-if="status === 'loading'" icon="spinner" spin class="mr-2" />
      {{ $t('edit.Showing {0} of {1} results', [shown, results.total]) }}
    </div>
    <SectionHint v-if="results.data.length" class="mb-2">{{
      $t('help.hints.results')
    }}</SectionHint>
    <StatusMessage
      v-if="status === 'error'"
      kind="error"
      :message="$t('edit.Search error')"
      retry
      @retry="emit('retry')"
    />
    <StatusMessage
      v-else-if="status === 'ready' && !results.data.length"
      kind="empty"
      :message="$t('edit.No results')"
    />
    <div
      class="flex flex-wrap min-h-24 transition duration-500"
      :class="{ 'opacity-50': status === 'loading' }"
      :aria-busy="status === 'loading'"
      data-testid="search-results"
    >
      <div
        v-for="card in results.data"
        :key="card.id"
        class="group relative w-16 bg-blue-900 h-24 m-1/2 mx-auto cursor-pointer bg-no-repeat bg-cover"
        :style="{ backgroundImage: `url('${card.images[0]?.image_small ?? ''}')` }"
        :class="{ 'opacity-60': blockReason(card) }"
        :title="card.name"
        @click="emit('select', card)"
      >
        <button
          v-if="!blockReason(card)"
          v-tooltip="$t('edit.Add {card}', { card: card.name })"
          type="button"
          class="absolute bottom-0 inset-x-0 text-xs bg-green-600 opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="$t('edit.Add {card}', { card: card.name })"
          @click.stop="emit('add', card)"
        >
          <FontAwesomeIcon icon="plus" />
        </button>
        <span
          v-else
          v-tooltip="blockMessage(blockReason(card)!)"
          class="absolute bottom-0 inset-x-0 text-[10px] leading-4 text-center bg-gray-700/90"
          data-testid="add-blocked"
        >
          <span aria-hidden="true">{{ blockLabel(blockReason(card)!) }}</span>
          <span class="sr-only">{{ blockMessage(blockReason(card)!) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
