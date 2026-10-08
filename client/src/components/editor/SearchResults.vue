<script setup lang="ts">
import { computed } from 'vue'
import { Drag, Drop, useDragAware, type DnDEventPayload } from 'vue-easy-dnd'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import type { LoadStatus } from '@/stores/decks'
import type { Card, CardSearchResult, DbStats } from '@/types/api'
import { DRAG_FROM_DECK, DRAG_FROM_RESULTS } from './drag-types'

const props = defineProps<{
  results: CardSearchResult
  stats: DbStats
  status: LoadStatus
  canAdd: (card: Card) => boolean
}>()
const emit = defineEmits<{
  add: [card: Card]
  remove: [card: Card]
  select: [card: Card]
  retry: []
}>()

const { dragInProgress, dragType } = useDragAware()
const receiving = computed(() => dragInProgress.value && dragType.value === DRAG_FROM_DECK)

// Shown count is bounded by the page size; the total is the number of matches.
const shown = computed(() => Math.min(props.stats.pageSize, props.results.total))

function onDrop(event: DnDEventPayload) {
  emit('remove', event.data as Card)
}
</script>

<template>
  <div>
    <div class="p-2 bg-blue-800 text-center mb-2 text-sm md:text-base" aria-live="polite">
      <FontAwesomeIcon v-if="status === 'loading'" icon="spinner" spin class="mr-2" />
      {{ $t('edit.Showing {0} of {1} results', [shown, results.total]) }}
    </div>
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
    <Drop
      :accepts-type="DRAG_FROM_DECK"
      class="flex flex-wrap min-h-24 transition duration-500"
      :class="{ 'bg-gray-900': receiving, 'opacity-50': status === 'loading' }"
      :aria-busy="status === 'loading'"
      data-testid="search-results"
      @drop="onDrop"
    >
      <Drag
        v-for="card in results.data"
        :key="card.id"
        :type="DRAG_FROM_RESULTS"
        :data="card"
        class="group relative w-16 bg-blue-900 h-24 m-1/2 mx-auto cursor-pointer bg-no-repeat bg-cover"
        :style="{ backgroundImage: `url('${card.images[0]?.image_small ?? ''}')` }"
        :title="card.name"
        @click="emit('select', card)"
      >
        <button
          v-if="canAdd(card)"
          type="button"
          class="absolute bottom-0 inset-x-0 text-xs bg-green-600 opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          :title="$t('edit.Add card')"
          :aria-label="$t('edit.Add {card}', { card: card.name })"
          @click.stop="emit('add', card)"
        >
          <FontAwesomeIcon icon="plus" />
        </button>
      </Drag>
    </Drop>
  </div>
</template>
