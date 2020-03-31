import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Yu-Gi-Oh! TimeMachine'
    },
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
