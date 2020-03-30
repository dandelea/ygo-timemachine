<template>
  <div id="app" class="w-full">
    <nav class="flex items-center justify-between flex-wrap bg-teal-500 p-4 px-6">
      <router-link to="/">
        <div class="flex items-center flex-no-shrink text-white mr-6">
          <svg class="fill-current h-8 w-8 mr-2" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z"/></svg>
          <span class="font-semibold text-xl tracking-tight">YuGiOh! Time Machine</span>
        </div>
      </router-link>
      <router-link to="/credits" class="duration-300 no-underline cursor-pointer sm:inline-block text-teal-300 hover:text-white">
        Credits
      </router-link>
    </nav>
  </div>
</template>
<script>
export default {
  name: 'Header',
  data: function() {
    return {
      open: false,
    }
  },
  methods: {
    toggle: function() {
      this.open = !this.open
    },
  },
}
</script>
<style lang="scss" scoped>

</style>