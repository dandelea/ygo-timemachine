<template>
  <label :id="id" class="custom-label flex cursor-pointer">
    <div class="bg-blue-700 shadow w-6 h-6 p-1 flex justify-center items-center">
      <input type="checkbox" class="hidden" :checked="value" 
        @change="$emit('input', $event.target.checked)"
      >
      <svg class="hidden w-4 h-4 bg-white text-blue-500 pointer-events-none" viewBox="0 0 172 172">
        <g fill="none" stroke-width="none" stroke-miterlimit="10" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode:normal">
          <path d="M0 172V0h172v172z"/>
          <path d="M145.433 37.933L64.5 118.8658 33.7337 88.0996l-10.134 10.1341L64.5 139.1341l91.067-91.067z" fill="currentColor" stroke-width="1"/>
        </g>
      </svg>
    </div>
    <span class="select-none flex flex-wrap items-center text-center text-sm ml-1">
      <slot></slot>
    </span>
  </label>
</template>

<script>
export default {
  name: 'checkbox',
  props: {
    id: String,
    label: String,
    value: Boolean,
  },
}
</script>
<style lang="scss" scoped>
.custom-label input:checked + svg {
  display: block !important;
}
</style>