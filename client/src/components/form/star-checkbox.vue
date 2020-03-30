<template>
  <img :id="id" :alt="label" :title="label" :src="imageSrc" 
    @click="onClick"
    class="cursor-pointer"
    :class="{
      'active': this.internalValue, 
    }"
  />
</template>

<script>
export default {
  name: 'star-checkbox',
  props: {
    id: String,
    label: String,
    images: Array,
    value: Boolean,
  },
  computed: {
    imageSrc: function() {
      if (this.internalValue) {
        return this.images[0]
      } else {
        return this.images[1]
      }
    }
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
</style>