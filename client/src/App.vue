<template>
  <div id="app" class="w-full overflow-x-hidden">
    <Header />
    <router-view />
  </div>
</template>

<script>
import Header from '@/components/Header'

export default {
  name: 'App',
  components: {
    Header,
  }
}

</script>

<style>
</style>
