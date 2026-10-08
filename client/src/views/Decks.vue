<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useDecksStore } from '@/stores/decks'
import type { DeckSummary } from '@/types/api'

const store = useDecksStore()
const { decks } = storeToRefs(store)

onMounted(() => void store.load())

function background(deck: DeckSummary) {
  const image = deck.cards[0]?.images[0]?.image
  const url = image ? `, url('${image}')` : ''
  return `background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))${url}; background-repeat: no-repeat; background-size: cover;`
}
</script>

<template>
  <section class="flex flex-wrap">
    <RouterLink
      to="/decks/new"
      :title="$t('decks.New deck')"
      class="w-full m-4 p-4 text-center bg-blue-800 duration-200 hover:bg-blue-700 cursor-pointer"
    >
      <FontAwesomeIcon icon="plus" size="2x" />
    </RouterLink>
    <div v-for="deck in decks" :key="deck.id" class="w-1/6 mx-4 my-2">
      <div class="w-full relative text-center py-8" :style="background(deck)">
        <RouterLink
          :to="`/decks/${deck.id}`"
          :class="`absolute w-full h-full bg-${deck.color}/50 top-0 left-0`"
        />
        <RouterLink :to="`/decks/${deck.id}`" class="relative w-full text-lg font-bold m-4">
          {{ deck.name }}
        </RouterLink>
      </div>
    </div>
  </section>
</template>
