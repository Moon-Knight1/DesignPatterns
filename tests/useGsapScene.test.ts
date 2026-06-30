import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

describe('useGsapScene', () => {
  beforeEach(async () => {
    // mock gsap.context + killTweensOf 走真实 gsap（无需 stub）
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls build(tl, rm) on mount after DOM is available', async () => {
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const calls: string[] = []

    // 先创建 DOM 元素
    const testEl = document.createElement('div')
    testEl.id = 'test-target'
    document.body.appendChild(testEl)

    const Comp = defineComponent({
      setup() {
        // 在 setup 时直接使用已存在的元素
        const root = ref<HTMLElement | null>(document.getElementById('test-target'))
        useGsapScene(root, (tl, rm) => {
          calls.push(`build-${typeof tl}-${rm.value ? 'rm-on' : 'rm-off'}`)
        })
        return { root }
      },
      render() {
        return h('div')
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatch(/^build-/)
    wrapper.unmount()
    document.body.removeChild(testEl)
  })

  it('ctx.revert() on unmount tears down tweens', async () => {
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const { gsap } = await import('gsap')

    const testEl = document.createElement('div')
    document.body.appendChild(testEl)

    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(testEl)
        useGsapScene(root, (_tl, _rm) => {
          gsap.set(root.value!, { opacity: 0.5 })
        })
        return { root }
      },
      render() {
        return h('div')
      },
    })
    const beforeChildren = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const peakChildren = gsap.globalTimeline.getChildren(true, true).length
    expect(peakChildren).toBeGreaterThanOrEqual(beforeChildren)
    wrapper.unmount()
    await nextTick()
    const afterChildren = gsap.globalTimeline.getChildren(true, true).length
    expect(afterChildren).toBeLessThanOrEqual(beforeChildren)
    document.body.removeChild(testEl)
  })

  it('warns and no-ops when root is null at mount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const calls: string[] = []

    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        // 故意保持 null - 不设置值
        useGsapScene(root, () => {
          calls.push('should-not-run')
        })
        return { root }
      },
      render: () => h('div'),
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(warn).toHaveBeenCalledWith('[anim] root not ready')
    expect(calls).toHaveLength(0)
    wrapper.unmount()
  })
})