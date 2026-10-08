<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { attributes, cardBackImage, levelStarImage } from '@/services/values'
import type { Card } from '@/types/api'
import { formatCalendarDate } from '@/utils/date'

const props = defineProps<{ card: Card | null }>()
const { t, locale } = useI18n()

const imageIndex = ref(0)
watch(
  () => props.card,
  () => (imageIndex.value = 0),
)

const attributeImages = Object.fromEntries(attributes.map(({ id, image }) => [id, image]))
const firstRelease = computed(() =>
  formatCalendarDate(props.card?.first_release ?? null, locale.value),
)
</script>

<template>
  <div class="p-2 flex flex-row md:flex-col w-full">
    <div v-if="card" class="flex">
      <button
        type="button"
        class="p-2 bg-blue-800 duration-200 hover:bg-blue-700"
        :class="{ invisible: imageIndex <= 0 }"
        :title="t('edit.Previous image')"
        @click="imageIndex--"
      >
        <FontAwesomeIcon icon="chevron-left" />
      </button>
      <img
        v-for="(image, index) in card.images"
        :key="image.image"
        class="ml-4 w-32 md:w-64 md:mx-auto"
        :class="{ hidden: index !== imageIndex }"
        :src="image.image"
        :alt="card.name"
        :title="card.name"
      />
      <button
        type="button"
        class="p-2 bg-blue-800 duration-200 hover:bg-blue-700"
        :class="{ invisible: imageIndex >= card.images.length - 1 }"
        :title="t('edit.Next image')"
        @click="imageIndex++"
      >
        <FontAwesomeIcon icon="chevron-right" />
      </button>
    </div>
    <img
      v-else
      class="ml-4 w-32 md:w-64 md:mx-auto"
      :src="cardBackImage"
      :alt="t('edit.No card')"
      :title="t('edit.No card')"
    />
    <div v-if="card" class="px-6 py-4">
      <div class="bg-blue-800 p-2 text-center text-sm lg:text-lg mb-2 flex flex-wrap">
        <h2 class="w-full font-bold">{{ card.name }}</h2>
        <span v-if="card.level" class="mx-auto p-1 text-sm flex flex-row items-center text-center">
          <span class="mr-1">{{ card.level }}</span>
          <img
            class="w-5 h-5"
            :alt="t('edit.Level')"
            :title="`${t('edit.Level')} ${card.level}`"
            :src="levelStarImage"
          />
        </span>
        <span
          v-if="card.attribute"
          class="mx-auto p-1 text-sm flex flex-row items-center text-center"
        >
          <span class="mr-1">{{ card.attribute }}</span>
          <img
            class="w-5 h-5"
            :alt="t('edit.Attribute')"
            :title="`${t('edit.Attribute')} ${card.attribute}`"
            :src="attributeImages[card.attribute]"
          />
        </span>
        <span v-if="card.first_release" class="w-full p-1 text-sm items-center text-center italic">
          {{ t('edit.First release') }}: {{ firstRelease }}
        </span>
      </div>
      <div class="bg-blue-800 p-2 mb-2 text-justify">
        <p class="text-xs text-green-400 font-bold">[{{ card.race }}]</p>
        <p class="text-xs" :class="{ italic: card.subtype === 'Normal Monster' }">
          {{ card.description }}
        </p>
      </div>
      <div v-if="card.atk !== null || card.def !== null" class="bg-blue-800 p-2 text-center">
        <div class="w-full flex flex-wrap text-sm">
          <span v-if="card.atk !== null" class="flex-1">ATK {{ card.atk }}</span>
          <span v-if="card.def !== null" class="flex-1">DEF {{ card.def }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
