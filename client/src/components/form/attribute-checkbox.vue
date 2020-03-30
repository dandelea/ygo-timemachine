<template>
  <span class="cursor-pointer p-1 rounded-full hover:shadow-lg duration-300"
    :class="{
      'active': this.internalValue, 
    }"
    @click="onClick"
    :title="label"
  >
    <img :id="id" :alt="label" :src="image" />
  </span>
</template>

<script>
export default {
  name: 'attribute-checkbox',
  props: {
    id: String,
    label: String,
    image: String,
    value: Boolean,
  },
  watch: {
    value: function (newv) {
      if (newv === undefined) newv = false
      this.internalValue = newv
    },
  },
  data: function() {
    return {
      internalValue: this.value,
    }
  },
  methods: {
    onClick: function() {
      this.internalValue = !this.internalValue
      this.$emit('input', this.internalValue)
    },
  },
}
</script>

<style lang="scss" scoped>
span.active {
  @apply bg-blue-700 shadow-lg ;
}
</style>