<template>
  <checkbox-lg 
    :id="id" :value="value" color="green" v-model="internalValue"
    class="rounded-full px-2 py-1 bg-blue-200 text-center"
  >
    <img :src="image" :alt="label" class="w-4 h-4 mr-1" v-if="image" />
    <span>{{label}}</span>
  </checkbox-lg>
</template>

<script>
import checkboxLg from '@/components/form/checkbox-lg'

export default {
  name: 'MonsterTypeCheckbox',
  components: {
    checkboxLg,
  },
  props: {
    id: String,
    label: String,
    value: Boolean,
    color: String,
    image: String,
  },
  computed: {
    internalValue: {
      get: function() {
        return this.value
      },
      set: function (v) {
        this.$emit('input', v)
      },
    }
  },
}
</script>