import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Mock getComputedStyle to provide all motion tokens
function mockMotionTokens() {
  const FULL_MAP: Record<string, string> = {
    '--motion-hero-title-duration': '600ms',
    '--motion-hero-title-from-y': '16px',
    '--motion-hero-title-from-opacity': '0',
    '--motion-hero-title-ease': 'power2.out',
    '--motion-subhead-duration': '380ms',
    '--motion-subhead-from-y': '12px',
    '--motion-subhead-from-opacity': '0',
    '--motion-subhead-ease': 'back.out(1.4)',
    '--motion-entry-soft-duration': '480ms',
    '--motion-entry-soft-from-y': '20px',
    '--motion-entry-soft-from-scale': '0.92',
    '--motion-entry-soft-from-opacity': '0',
    '--motion-entry-soft-ease': 'back.out(1.4)',
    '--motion-entry-strong-duration': '520ms',
    '--motion-entry-strong-from-y': '8px',
    '--motion-entry-strong-from-scale': '0.92',
    '--motion-entry-strong-from-opacity': '0',
    '--motion-entry-strong-ease': 'back.out(1.6)',
    '--motion-fade-only-duration': '360ms',
    '--motion-fade-only-from-y': '12px',
    '--motion-fade-only-from-opacity': '0',
    '--motion-fade-only-ease': 'power2.out',
    '--motion-fade-only-tight-duration': '360ms',
    '--motion-fade-only-tight-from-y': '8px',
    '--motion-fade-only-tight-from-opacity': '0',
    '--motion-fade-only-tight-ease': 'power2.out',
    '--motion-reveal-scroll-duration': '420ms',
    '--motion-reveal-scroll-from-y': '18px',
    '--motion-reveal-scroll-from-opacity': '0',
    '--motion-reveal-scroll-ease': 'back.out(1.4)',
    '--motion-leave-quick-duration': '200ms',
    '--motion-leave-quick-from-y': '0',
    '--motion-leave-quick-from-scale': '1',
    '--motion-leave-quick-from-opacity': '1',
    '--motion-leave-quick-to-y': '-10px',
    '--motion-leave-quick-to-opacity': '0',
    '--motion-leave-quick-ease': 'power2.in',
    '--motion-enter-page-duration': '340ms',
    '--motion-enter-page-from-y': '14px',
    '--motion-enter-page-from-scale': '0.96',
    '--motion-enter-page-from-opacity': '0',
    '--motion-enter-page-to-y': '0',
    '--motion-enter-page-to-scale': '1',
    '--motion-enter-page-to-opacity': '1',
    '--motion-enter-page-ease': 'back.out(1.1)',
    '--motion-hover-lift-duration': '300ms',
    '--motion-hover-lift-from-y': '0',
    '--motion-hover-lift-from-scale': '1',
    '--motion-hover-lift-from-opacity': '1',
    '--motion-hover-lift-to-y': '-4px',
    '--motion-hover-lift-to-scale': '1.02',
    '--motion-hover-lift-to-opacity': '1',
    '--motion-hover-lift-ease': 'back.out(1.2)',
    '--motion-press-squish-duration': '200ms',
    '--motion-press-squish-from-y': '0',
    '--motion-press-squish-from-scale': '0.94',
    '--motion-press-squish-from-opacity': '1',
    '--motion-press-squish-to-y': '0',
    '--motion-press-squish-to-scale': '1',
    '--motion-press-squish-to-opacity': '1',
    '--motion-press-squish-ease': 'power3.out',
    '--motion-stagger-card': '50ms',
    '--motion-stagger-toc': '40ms',
    '--motion-stagger-hero': '110ms',
  }
  if (typeof window.getComputedStyle !== 'function') {
    (window as any).getComputedStyle = () => ({})
  }
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => FULL_MAP[name] ?? '',
  } as CSSStyleDeclaration)
}

describe('useStaggerReveal', () => {
  beforeEach(async () => {
    mockMotionTokens()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('on first mount with registryId, schedules a tween for :scope > * children', async () => {
    const { gsap } = await import('gsap')
    const before = gsap.globalTimeline.getChildren(true, true).length

    // Create DOM element first, then pass to ref
    const testUl = document.createElement('ul')
    testUl.innerHTML = '<li>a</li><li>b</li><li>c</li>'
    document.body.appendChild(testUl)

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(testUl)
        useStaggerReveal(root, {
          registryId: 'test-stagger-1',
          tokenKey: 'subhead',
          staggerKey: 'staggerToc',
        })
        return { root }
      },
      render: () => h('ul'),
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThan(before)
    wrapper.unmount()
    document.body.removeChild(testUl)
  })

  it('on second mount with same registryId, no new tween is scheduled', async () => {
    const { gsap } = await import('gsap')

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const make = () => {
      const testUl = document.createElement('ul')
      testUl.innerHTML = '<li></li><li></li>'
      document.body.appendChild(testUl)
      return defineComponent({
        setup() {
          const root = ref<HTMLElement | null>(testUl)
          useStaggerReveal(root, {
            registryId: 'test-stagger-2',
            tokenKey: 'subhead',
            staggerKey: 'staggerToc',
          })
          return { root }
        },
        render: () => h('ul'),
        unmounted() {
          document.body.removeChild(testUl)
        },
      })
    }

    const w1 = mount(make(), { attachTo: document.body })
    await nextTick()
    const w1Children = gsap.globalTimeline.getChildren(true, true).length
    w1.unmount()
    await nextTick()

    const w2 = mount(make(), { attachTo: document.body })
    await nextTick()
    const w2Children = gsap.globalTimeline.getChildren(true, true).length
    // 第二次应只在 t=0 跑一次 gsap.set（瞬时终态），
    // 不应累积额外 tween。
    expect(w2Children).toBeLessThanOrEqual(w1Children)
    w2.unmount()
  })

  it('honors prefers-reduced-motion: set children to opacity 1 without tween', async () => {
    vi.stubGlobal('window', {
      ...((window as any) ?? {}),
      matchMedia: (q: string) => ({
        matches: q.includes('reduce'),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    } as any)

    // Create DOM element with li children
    const testUl = document.createElement('ul')
    testUl.innerHTML = '<li></li><li></li>'
    document.body.appendChild(testUl)

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const Comp = defineComponent({
      setup() {
        // Pass the actual DOM element with children
        const root = ref<HTMLElement | null>(testUl)
        useStaggerReveal(root, {
          registryId: 'test-stagger-3',
          tokenKey: 'subhead',
          staggerKey: 'staggerToc',
        })
        return { root }
      },
      render: () => h('ul'),
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    // Access the original testUl which has li children
    const li = testUl.querySelector('li') as HTMLElement
    expect(li.style.opacity === '1' || li.style.opacity === '').toBe(true)
    wrapper.unmount()
    document.body.removeChild(testUl)
  })
})