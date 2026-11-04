<script setup lang="ts">
import { computed } from 'vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import type { LoadStatus } from '@/stores/decks'
import type { Card, CardSearchResult, DbStats } from '@/types/api'

const props = defineProps<{
  results: CardSearchResult
  stats: DbStats
  status: LoadStatus
  canAdd: (card: Card) => boolean
}>()
const emit = defineEmits<{
  add: [card: Card]
  select: [card: Card]
  retry: []
}>()

// Shown count is bounded by the page size; the total is the number of matches.
const shown = computed(() => Math.min(props.stats.pageSize, props.results.total))
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
      </div>
    </div>
  </div>
</template>
