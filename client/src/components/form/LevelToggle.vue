<script setup lang="ts">
import { vTooltip } from '@/directives/tooltip'
defineProps<{ id: string; label: string; images: { active: string; inactive: string } }>()
const active = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    :id="id"
    v-tooltip="label"
    type="button"
    class="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
    :aria-label="label"
    :aria-pressed="active"
    @click="active = !active"
  >
    <img alt="" class="w-full" :src="active ? images.active : images.inactive" />
  </button>
</template>
