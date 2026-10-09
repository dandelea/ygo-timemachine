<script setup lang="ts">
import AutocompleteSearch from './AutocompleteSearch.vue'

defineProps<{ archetypes: string[] }>()
const selected = defineModel<string[]>({ required: true })

function add(item: string) {
  if (!selected.value.includes(item)) selected.value = [...selected.value, item]
}

function remove(item: string) {
  selected.value = selected.value.filter((value) => value !== item)
}
</script>

<template>
  <div class="p-2 w-full">
    <AutocompleteSearch
      :items="archetypes"
      :placeholder="$t('form.archetype-selector.Select an archetype')"
      @select="add"
    />
    <div class="mt-2 items-center flex flex-wrap">
      <span
        v-for="item in selected"
        :key="item"
        class="p-2 m-1 duration-500 bg-blue-800 hover:bg-blue-700 text-sm"
      >
        {{ item }}
        <button
          type="button"
          :title="$t('form.archetype-selector.Remove archetype')"
          @click="remove(item)"
        >
          <FontAwesomeIcon :icon="['far', 'times-circle']" />
        </button>
      </span>
    </div>
  </div>
</template>
