<script setup lang="ts">
defineProps<{ id: string; label: string; images: { active: string; inactive: string } }>()
const active = defineModel<boolean>({ default: false })
</script>

<template>
  <img
    :id="id"
    :alt="label"
    :title="label"
    :src="active ? images.active : images.inactive"
    class="cursor-pointer"
    @click="active = !active"
  />
</template>
