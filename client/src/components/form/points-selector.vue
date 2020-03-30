<template>
  <div>
    <h1>{{label}} ({{internalValue[0]}} - {{internalValue[1]}})</h1>
    <VueSlider
      :enable-cross="false"
      :min="min"
      :max="max"
      :width="width"
      v-model="internalValue"
      :interval="100"
    />
  </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

export default {
  name: 'points-selector',
  components: {
    VueSlider,
  },
  props: {
    label: String,
    value: Object,
    min: Number,
    max: Number,
  },
  computed: {
    internalValue: {
      get: function() {
        return [this.value.min, this.value.max]
      },
      set: function (v) {
        this.$emit('input', {
          min: v[0],
          max: v[1],
        })
      },
    }
  },
  data: function() {
    return {
      width: this.handleResize(),
    }
  },
  methods: {
    handleResize: function() {
      let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      return width > 768 ? (width / 3 - 50) : width - 50
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.width = this.handleResize()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="scss" scoped>
</style>