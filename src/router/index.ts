import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue'), name: 'home' },
    { path: '/pattern/:slug', component: () => import('@/views/PatternView.vue'), name: 'pattern', props: true },
    { path: '/about', component: () => import('@/views/AboutView.vue'), name: 'about' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})