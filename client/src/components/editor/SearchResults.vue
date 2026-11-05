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
  /** Copies the deck's format allows of a card (0 = forbidden), or null if unrestricted. */
  limitOf?: (card: Card) => number | null
  /** Name of the deck's format, when it has one. */
  formatName?: string | null
}>()
const emit = defineEmits<{
  add: [card: Card]
  select: [card: Card]
  retry: []
}>()

const { t } = useI18n()

const limitOf = (card: Card) => props.limitOf?.(card) ?? null
const format = computed(() => props.formatName ?? '')

const blockMessage = (card: Card, reason: AddBlockReason) =>
  ({
    copies: t('help.blocked.copies', { copies: DECK_LIMITS.copies }),
    'main-full': t('help.blocked.mainFull', { max: DECK_LIMITS.main }),
    'extra-full': t('help.blocked.extraFull', { max: DECK_LIMITS.extra }),
    forbidden: t('formats.forbiddenIn', { format: format.value }),
    'format-copies': t(
      'formats.copiesIn',
      { format: format.value, count: limitOf(card) ?? 0 },
      limitOf(card) ?? 0,
    ),
  })[reason]
function blockLabel(card: Card, reason: AddBlockReason) {
  if (reason === 'copies') return `${DECK_LIMITS.copies}/${DECK_LIMITS.copies}`
  if (reason === 'format-copies') return `${limitOf(card) ?? 0}/${limitOf(card) ?? 0}`
  if (reason === 'forbidden') return t('formats.forbidden')
  return t('help.blocked.full')
}

// Literal class names so Tailwind can detect them.
const badgeClass = ['bg-red-700', 'bg-orange-600', 'bg-yellow-500 text-gray-900']
const badgeMessage = (limit: number) =>
  limit === 0
    ? t('formats.forbiddenIn', { format: format.value })
    : t('formats.limitedIn', { format: format.value, count: limit }, limit)

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
        <span
          v-if="limitOf(card) !== null"
          v-tooltip="badgeMessage(limitOf(card)!)"
          class="absolute top-0.5 left-0.5 w-4 h-4 grid place-items-center rounded-full text-[10px] font-extrabold"
          :class="badgeClass[limitOf(card)!]"
          data-testid="format-badge"
        >
          <span aria-hidden="true">{{ limitOf(card) === 0 ? '✕' : limitOf(card) }}</span>
          <span class="sr-only">{{ badgeMessage(limitOf(card)!) }}</span>
        </span>
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
          v-tooltip="blockMessage(card, blockReason(card)!)"
          class="absolute bottom-0 inset-x-0 text-[10px] leading-4 text-center bg-gray-700/90"
          data-testid="add-blocked"
        >
          <span aria-hidden="true">{{ blockLabel(card, blockReason(card)!) }}</span>
          <span class="sr-only">{{ blockMessage(card, blockReason(card)!) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
