<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref, useId, useTemplateRef } from 'vue'

/** An "i" button that opens a short explanation below it. */
defineProps<{ label: string }>()

const isOpen = ref(false)
const panelId = useId()
const root = useTemplateRef('root')
const button = useTemplateRef('button')
onClickOutside(root, () => (isOpen.value = false))

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  button.value?.focus()
}
</script>

<template>
  <div ref="root" class="relative" @keydown.esc="close">
    <button
      ref="button"
      type="button"
      class="w-10 h-10 flex items-center justify-center bg-blue-800 text-orange-400 duration-200 hover:bg-blue-700"
      :aria-label="label"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="isOpen = !isOpen"
    >
      <FontAwesomeIcon icon="circle-info" />
    </button>
    <div
      v-show="isOpen"
      :id="panelId"
      class="absolute right-0 top-full mt-2 w-64 z-20 p-3 rounded bg-orange-100 text-gray-900 text-sm shadow-lg"
    >
      <span class="absolute -top-1 right-4 w-2 h-2 rotate-45 bg-orange-100" aria-hidden="true" />
      <slot />
    </div>
  </div>
</template>
