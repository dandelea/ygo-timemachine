<template>
  <label :for="id" class="inline-flex items-center cursor-pointer">
    <span class="relative">
      <span class="block w-10 h-6 rounded-full shadow-inner"
        :class="{
          'bg-blue-800': !this.value,
          [color2]: this.value,
        }"></span>
      <span class="absolute block w-4 h-4 my-1 ml-1 rounded-full shadow inset-y-0 left-0 focus-within:shadow-outline transition-transform duration-300 ease-in-out"
        :class="{
          'bg-white': !this.value,
          'transform translate-x-full': this.value,
          [color1]: this.value
        }">
        <input :id="id" type="checkbox" :checked="value" 
          @change="$emit('input', $event.target.checked)"
          class="absolute opacity-0 w-0 h-0"
        />
      </span>
    </span>
    <span class="ml-1 text-2xs flex items-center"><slot></slot></span>
  </label>
</template>

<script>
export default {
  name: 'checkbox-lg',
  props: {
    id: String,
    value: Boolean,
    color: String,
  },
  computed: {
    color1: function() {
      return this.color ? `bg-${this.color}-500` : 'bg-blue-800'
    },
    color2: function() {
      return this.color ? `bg-${this.color}-200` : 'bg-blue-700'
    },
  },
}
</script>

<style lang="scss" scoped>

</style>