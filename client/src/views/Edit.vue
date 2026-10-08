<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import CardDetail from '@/components/editor/CardDetail.vue'
import CardHistory from '@/components/editor/CardHistory.vue'
import DeckPanel from '@/components/editor/DeckPanel.vue'
import SearchFilters from '@/components/editor/SearchFilters.vue'
import SearchResults from '@/components/editor/SearchResults.vue'
import { APP_TITLE } from '@/router'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useEditorStore()
const { deck, form, results, stats, archetypes, history, selectedCard, activeTab, canSave } =
  storeToRefs(store)

watch(
  () => props.id,
  (id) => void store.open(id),
  { immediate: true },
)
void store.search()

// Filters change on every keystroke or click; search once the user pauses.
const debouncedSearch = useDebounceFn(() => store.search(), 250)
watch(form, () => void debouncedSearch(), { deep: true })

watch(
  () => deck.value.name,
  (name) => (document.title = `${APP_TITLE} - Deck ${name}`),
)

async function save() {
  const id = await store.save()
  if (id && id !== props.id) await router.replace(`/decks/${id}`)
}
</script>

<template>
  <div class="flex flex-col md:flex-row md:max-h-body">
    <div class="w-full md:w-1/3 md:overflow-y-auto">
      <CardDetail :card="selectedCard" />
      <CardHistory :cards="history" @select="store.selectCard" @clear="store.clearHistory" />
    </div>
    <div class="px-2 w-full md:w-1/3">
      <DeckPanel
        :deck="deck"
        :can-save="canSave"
        @update:name="deck.name = $event"
        @update:color="deck.color = $event"
        @add="store.addCard"
        @remove="store.removeCard"
        @select="store.selectCard"
        @clear="store.clearDeck"
        @save="save"
      />
    </div>
    <div class="w-full md:w-1/3 flex flex-col md:overflow-y-auto">
      <div class="flex" role="tablist">
        <button
          v-for="tab in ['form', 'cards'] as const"
          :key="tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab"
          class="flex-1 text-center block py-2 px-4 uppercase duration-200 text-white"
          :class="
            activeTab === tab ? 'bg-blue-500 hover:bg-blue-700' : 'bg-blue-800 hover:bg-blue-700'
          "
          @click="activeTab = tab"
        >
          {{ tab === 'form' ? $t('edit.Search') : $t('edit.Result') }}
        </button>
      </div>
      <SearchResults
        v-if="activeTab === 'cards' && stats"
        :results="results"
        :stats="stats"
        :can-add="store.canAdd"
        @add="store.addCard"
        @remove="store.removeCard"
        @select="store.selectCard"
      />
      <SearchFilters
        v-else-if="activeTab === 'form'"
        v-model="form"
        :archetypes="archetypes"
        @clear="store.resetFilters"
      />
    </div>
  </div>
</template>
