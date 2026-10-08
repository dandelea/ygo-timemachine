<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

const props = withDefaults(defineProps<{ items: string[]; placeholder?: string }>(), {
  placeholder: 'Select...',
})
const emit = defineEmits<{ select: [item: string] }>()

const search = ref('')
const isOpen = ref(false)
const activeIndex = ref(-1)
const root = useTemplateRef('root')

const results = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? props.items.filter((item) => item.toLowerCase().includes(term)) : []
})

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function choose(item: string | undefined) {
  if (item) emit('select', item)
  search.value = ''
  close()
}

function move(step: 1 | -1) {
  const last = results.value.length - 1
  activeIndex.value = Math.min(Math.max(activeIndex.value + step, 0), last)
}

onClickOutside(root, close)
</script>

<template>
  <div ref="root" class="relative">
    <input
      v-model="search"
      type="text"
      class="p-2 pl-6 w-full text-white bg-blue-800"
      :placeholder="placeholder"
      @input="isOpen = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="choose(results[activeIndex])"
      @keydown.esc="close"
    />
    <ul v-show="isOpen && results.length" class="p-0 m-0 overflow-auto w-full h-20">
      <li
        v-for="(result, index) in results"
        :key="result"
        class="cursor-pointer text-left p-2 list-none hover:bg-blue-700 hover:text-white"
        :class="index === activeIndex ? 'bg-blue-700 text-white' : 'bg-white text-blue-700'"
        @click="choose(result)"
      >
        {{ result }}
      </li>
    </ul>
  </div>
</template>
