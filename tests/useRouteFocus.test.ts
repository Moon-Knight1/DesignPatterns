import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'

// Mutable reactive route shared with the mocked vue-router.
// We expose a reactive object (NOT a ref) so that `() => route.fullPath` inside
// useRouteFocus tracks the property reactively. A bare ref would require .value
// access which the composable does not perform.
const routeState = reactive<{ fullPath: string }>({ fullPath: '/' })
vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

const { useRouteFocus } = await import('@/composables/useRouteFocus')

describe('useRouteFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="main"></main>'
    routeState.fullPath = '/'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('moves focus to <main> after route change', async () => {
    const main = document.getElementById('main')!
    const focusSpy = vi.spyOn(main, 'focus')

    const Comp = defineComponent({
      setup() {
        useRouteFocus()
        return () => h('div')
      },
    })
    mount(Comp)

    // Trigger route change.
    routeState.fullPath = '/pattern/singleton'
    await nextTick()
    await nextTick()  // flush: 'post' needs a second tick

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    expect(main.getAttribute('tabindex')).toBe('-1')
  })

  it('does not throw when #main is missing', async () => {
    document.body.innerHTML = ''

    const Comp = defineComponent({
      setup() {
        useRouteFocus()
        return () => h('div')
      },
    })
    expect(() => mount(Comp)).not.toThrow()

    routeState.fullPath = '/about'
    await nextTick()
    await nextTick()
    // No assertion needed — absence of throw is the contract.
  })
})