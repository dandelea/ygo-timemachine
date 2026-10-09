<script setup lang="ts">
defineProps<{ id: string; label: string; image: string }>()
const active = defineModel<boolean>({ default: false })
</script>

<template>
  <span
    class="cursor-pointer p-1 rounded-full hover:shadow-lg duration-300"
    :class="{ 'bg-blue-700 shadow-lg': active }"
    :title="label"
    @click="active = !active"
  >
    <img :id="id" :alt="label" :src="image" />
  </span>
</template>
