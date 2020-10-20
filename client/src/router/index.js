import Vue from 'vue'
import VueRouter from 'vue-router'

import Decks from '../views/Decks'
import Edit from '../views/Edit'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Decks',
    component: Decks,
    meta: {
      title: 'Yu-Gi-Oh! TimeMachine'
    },
  },
  {
    path: '/decks/:id',
    name: 'Deck',
    component: Edit,
    meta: {
      title: 'Yu-Gi-Oh! TimeMachine - Edit deck'
    },
    props: true,
  },
  {
    path: '/credits',
    name: 'Credits',
    component: () => import(/* webpackChunkName: "about" */ '../views/Credits.vue'),
    meta: {
      title: 'Yu-Gi-Oh! TimeMachine - Credits'
    },
  },
]

const router = new VueRouter({
  routes,
  mode: 'history',
})

export default router
