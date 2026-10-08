<template>
  <header class="w-full bg-gray-900">
    <nav class="flex items-center justify-between flex-wrap p-4 px-6">
      <RouterLink to="/">
        <div class="flex items-center mr-6 duration-300 text-blue-800 hover:text-white">
          <span class="font-semibold text-xl tracking-tight">YuGiOh! Time Machine</span>
        </div>
      </RouterLink>
      <RouterLink
        to="/credits"
        class="duration-300 no-underline cursor-pointer sm:inline-block text-blue-200 hover:text-white"
      >
        {{ $t('header.credits') }}
      </RouterLink>
    </nav>
  </header>
</template>
