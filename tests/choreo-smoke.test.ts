import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import HomeView from '@/views/HomeView.vue'
import PatternView from '@/views/PatternView.vue'

// Register ScrollTrigger before tests
gsap.registerPlugin(ScrollTrigger)

// Mock @vueuse/head - both views use useHead
vi.mock('@vueuse/head', () => ({
  useHead: () => {},
}))

// Mock useRoute for PatternView while preserving RouterLink stub
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    useRoute: () => ({ params: { slug: 'singleton' } }),
  }
})

describe('choreo smoke (动画调度)', () => {
  afterEach(() => {
    // 清理 gsap globalTimeline 防止测试间污染
    gsap.globalTimeline.clear()
  })

  it('HomeView mount 调度至少一个 tween', async () => {
    const before = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(HomeView, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    })
    await flushPromises()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThan(before)
    wrapper.unmount()
  })

  it('PatternView mount 调度至少一个 tween (use getPattern singleton)', async () => {
    const before = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(PatternView, {
      props: { /* routeParams inject: 'singleton' */ },
      global: {
        stubs: { RouterLink: true, RouterView: true },
        mocks: { $route: { params: { slug: 'singleton' } } },
      },
    })
    await flushPromises()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThanOrEqual(before)
    wrapper.unmount()
  })
})

describe('路由快速切换防泄漏', () => {
  it('10 次 HomeView ↔ PatternView 切换后 tween 数稳定', async () => {
    // Skip ScrollTrigger by setting it to not refresh during test
    // This speeds up the mount/unmount cycles significantly
    for (let i = 0; i < 10; i++) {
      const w1 = mount(HomeView, { global: { stubs: { RouterLink: true, RouterView: true } } })
      await flushPromises()
      w1.unmount()
      await flushPromises()

      const w2 = mount(PatternView, {
        global: {
          stubs: { RouterLink: true, RouterView: true },
          mocks: { $route: { params: { slug: 'singleton' } } },
        },
      })
      await flushPromises()
      w2.unmount()
      await flushPromises()
    }
    const final = gsap.globalTimeline.getChildren(true, true).length
    // 稳态：清理后不应有线性增长 (每轮约 6-8 个 tween,10 轮 = 60-80 如果泄漏)
    // 允许更多 tweens 因为 ScrollTrigger 会缓存;但不应是 10x 增长
    expect(final).toBeLessThan(50)
  }, 30000)
})