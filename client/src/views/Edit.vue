<script setup lang="ts">
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CardDetail from '@/components/editor/CardDetail.vue'
import CardHistory from '@/components/editor/CardHistory.vue'
import DeckPanel from '@/components/editor/DeckPanel.vue'
import SaveFeedback from '@/components/editor/SaveFeedback.vue'
import SearchFilters from '@/components/editor/SearchFilters.vue'
import SearchResults from '@/components/editor/SearchResults.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import { APP_TITLE } from '@/router'
import { useEditorStore } from '@/stores/editor'
import type { Card } from '@/types/api'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useEditorStore()
const {
  deck,
  deckStatus,
  deckError,
  saveStatus,
  form,
  results,
  searchStatus,
  stats,
  archetypes,
  history,
  selectedCard,
  activeTab,
  canSave,
} = storeToRefs(store)

// Saving a new deck changes the URL to its id; that deck is already loaded.
let justSavedId: string | null = null
watch(
  () => props.id,
  (id) => {
    if (id === justSavedId) return
    void store.open(id)
  },
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
  if (id && id !== props.id) {
    justSavedId = id
    await router.replace(`/decks/${id}`)
  }
}

// Below the md breakpoint the three columns do not fit: show one at a time.
type MobileView = 'card' | 'deck' | 'search'
const isDesktop = useMediaQuery('(min-width: 768px)')
const mobileView = ref<MobileView>('deck')
const mobileViews: MobileView[] = ['card', 'deck', 'search']
// Literal class names so Tailwind can detect them.
const hiddenOnMobile = { block: 'hidden md:block', flex: 'hidden md:flex' } as const
const columnClass = (view: MobileView, display: 'block' | 'flex' = 'block') =>
  mobileView.value === view ? display : hiddenOnMobile[display]

function selectCard(card: Card) {
  store.selectCard(card)
  if (!isDesktop.value) mobileView.value = 'card'
}
</script>

<template>
  <div
    class="md:hidden sticky top-0 z-10 flex bg-gray-900"
    role="tablist"
    :aria-label="$t('edit.Sections')"
  >
    <button
      v-for="view in mobileViews"
      :key="view"
      type="button"
      role="tab"
      :aria-selected="mobileView === view"
      class="flex-1 py-2 uppercase text-sm duration-200"
      :class="mobileView === view ? 'bg-blue-500 text-white' : 'bg-blue-800 hover:bg-blue-700'"
      @click="mobileView = view"
    >
      {{ $t(`edit.sections.${view}`) }}
    </button>
  </div>

  <StatusMessage
    v-if="deckStatus === 'error'"
    kind="error"
    :message="deckError === 'not-found' ? $t('edit.Not found') : $t('edit.Load error')"
    :retry="deckError !== 'not-found'"
    @retry="store.open(id)"
  >
    <RouterLink to="/" class="underline">{{ $t('edit.Back to decks') }}</RouterLink>
  </StatusMessage>

  <div v-else class="flex flex-col md:flex-row md:max-h-body">
    <div class="w-full md:w-1/3 md:overflow-y-auto" :class="columnClass('card')">
      <CardDetail :card="selectedCard" />
      <CardHistory :cards="history" @select="selectCard" @clear="store.clearHistory" />
    </div>
    <div class="px-2 w-full md:w-1/3" :class="columnClass('deck')">
      <StatusMessage v-if="deckStatus === 'loading'" kind="loading" :message="$t('edit.Loading')" />
      <DeckPanel
        v-else
        :deck="deck"
        :can-save="canSave"
        :saving="saveStatus === 'saving'"
        @update:name="deck.name = $event"
        @update:color="deck.color = $event"
        @add="store.addCard"
        @remove="store.removeCard"
        @select="selectCard"
        @clear="store.clearDeck"
        @save="save"
      />
    </div>
    <div class="w-full md:w-1/3 flex-col md:overflow-y-auto" :class="columnClass('search', 'flex')">
      <div class="flex" role="tablist" :aria-label="$t('edit.Search')">
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
        :status="searchStatus"
        :can-add="store.canAdd"
        @add="store.addCard"
        @remove="store.removeCard"
        @select="selectCard"
        @retry="store.search"
      />
      <SearchFilters
        v-else-if="activeTab === 'form'"
        v-model="form"
        :archetypes="archetypes"
        @clear="store.resetFilters"
      />
    </div>
  </div>

  <SaveFeedback :status="saveStatus" @dismiss="store.dismissSaveStatus" />
</template>
