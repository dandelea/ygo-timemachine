<template>
  <div class="p-2 w-full">
    <autocomplete @input="select" :items="archetypes" placeholder="Select a monster archetype" />
    <div class="mt-2 items-center flex flex-wrap">
      <span v-for="item in selected" :key="item"
        class="p-2 m-1 rounded duration-500 bg-gray-400 hover:bg-gray-300 text-gray-800 text-sm">
        {{item}}
        <font-awesome-icon :icon="['far', 'times-circle']"
          class="cursor-pointer duration-500 text-gray-600 hover:text-black"
          @click="remove(item)"  /> 
      </span>
    </div>
  </div>
</template>

<script>
import autocomplete from '@/components/form/autocomplete-search'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faTimesCircle)

export default {
  name: 'archetype-selector',
  components: {
    autocomplete,
    FontAwesomeIcon
  },
  props: {
    archetypes: Array,
    values: Array,
  },
  data: function() {
    return {
      selected: this.values,
    }
  },
  watch: {
    values: function(newv) {
      this.selected = newv
      this.$emit('input', this.selected)
    },
  },
  methods: {
    select: function(item) {
      if (typeof item === 'string' && !this.selected.includes(item)) {
        this.selected.push(item)
        this.$emit('input', this.selected)
      }
    },
    remove: function(item) {
      let index = this.selected.indexOf(item)
      if (typeof item === 'string' && index > -1) {
        this.selected.splice(index, 1)
        this.$emit('input', this.selected)
      }
    }
  },
}
</script>