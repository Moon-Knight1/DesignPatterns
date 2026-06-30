import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { gsap } from 'gsap'
import App from '@/App.vue'
import HomeView from '@/views/HomeView.vue'
import PatternView from '@/views/PatternView.vue'
import AboutView from '@/views/AboutView.vue'

// Create a fresh router instance for each test to avoid state pollution
function createTestRouter() {
  return createRouter({
    history: createWebHashHistory('/'),
    routes: [
      { path: '/', component: HomeView, name: 'home' },
      { path: '/pattern/:slug', component: PatternView, name: 'pattern', props: true },
      { path: '/about', component: AboutView, name: 'about' },
    ],
  })
}

describe('App route navigation (bug: multi-root views break Transition)', () => {
  let router = createTestRouter()

  beforeEach(() => {
    router = createTestRouter()
    // Clean up gsap global state before each test
    gsap.globalTimeline.clear()
  })

  afterEach(() => {
    gsap.globalTimeline.clear()
  })

  it('navigates from home to pattern detail and renders the pattern page', async () => {
    // Mount App with the router
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          // Stub components that might cause issues in test environment
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    // Wait for initial navigation
    await router.isReady()
    await new Promise((r) => setTimeout(r, 100))

    // Verify home page rendered (Hero text visible)
    expect(wrapper.html()).toContain('设计模式')

    // Navigate to singleton pattern
    await router.push('/pattern/singleton')
    await new Promise((r) => setTimeout(r, 100))

    // The detail page should render with the pattern title "单例模式"
    // With the bug, <main> is EMPTY after navigation
    const main = wrapper.find('main#main')
    expect(main.exists()).toBe(true)

    // This is the critical assertion - if bug exists, main is empty
    const mainHtml = main.html()
    expect(mainHtml).toContain('单例模式')
    expect(mainHtml).not.toBe('')
  })

  it('navigates from home to about page and renders correctly', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    await router.isReady()
    await new Promise((r) => setTimeout(r, 100))

    // Verify home page
    expect(wrapper.html()).toContain('设计模式')

    // Navigate to about
    await router.push('/about')
    await new Promise((r) => setTimeout(r, 100))

    // About page should render
    const mainHtml = wrapper.find('main#main').html()
    expect(mainHtml).toContain('关于本站')
    expect(mainHtml).not.toBe('')
  })
})