<template>
  <div class="w-full bg-gray-900">
    <nav class="flex items-center justify-between flex-wrap p-4 px-6">
      <router-link to="/">
        <div
          class="flex items-center flex-no-shrink mr-6 duration-300 text-blue-800 hover:text-white"
        >
          <span class="font-semibold text-xl tracking-tight"
            >YuGiOh! Time Machine</span
          >
        </div>
      </router-link>
      <router-link
        to="/credits"
        class="duration-300 no-underline cursor-pointer sm:inline-block text-blue-200 hover:text-white"
      >
        Credits
      </router-link>
    </nav>
  </div>
</template>
<script>
export default {
  name: "Header",
  data: function () {
    return {
      open: false,
    };
  },
  methods: {
    toggle: function () {
      this.open = !this.open;
    },
  },
};
</script>
<style lang="scss" scoped>
</style>