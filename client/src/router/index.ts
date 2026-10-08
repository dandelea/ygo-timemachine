import { createRouter, createWebHistory } from 'vue-router'
import DecksView from '@/views/Decks.vue'

export const APP_TITLE = 'YuGiOh! TimeMachine'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'decks', component: DecksView, meta: { title: `${APP_TITLE} - Decks` } },
    {
      path: '/decks/:id',
      name: 'deck',
      component: () => import('@/views/Edit.vue'),
      props: true,
      meta: { title: `${APP_TITLE} - Edit deck` },
    },
    {
      path: '/credits',
      name: 'credits',
      component: () => import('@/views/Credits.vue'),
      meta: { title: `${APP_TITLE} - Credits` },
    },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ?? APP_TITLE
})
