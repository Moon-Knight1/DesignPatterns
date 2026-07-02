import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useSplitText } from '@/composables/useSplitText'

interface Harness { root: Ref<HTMLElement | null>; split: () => void; restore: () => void }

function mountHarness(template: () => string): { wrapper: ReturnType<typeof mount>; get: () => Harness } {
  const harness: { current: Harness | null } = { current: null }

  const Comp = defineComponent({
    setup() {
      const root = ref<HTMLElement | null>(null)
      const handle = useSplitText(root, { mode: 'char' })
      harness.current = { root, split: handle.split, restore: handle.restore }
      return () => h('div', { ref: root, innerHTML: template() })
    },
  })

  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, get: () => harness.current! }
}

describe('useSplitText — char mode', () => {
  let wrapper: ReturnType<typeof mount>
  let harness: Harness

  beforeEach(() => {
    const m = mountHarness(() => '23 种 GoF 设计模式')
    wrapper = m.wrapper
    harness = m.get()
    harness.split()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('wraps every non-whitespace character in a .reveal-char span', () => {
    const chars = harness.root.value!.querySelectorAll('.reveal-char')
    // "23 种 GoF 设计模式" → 11 non-whitespace chars (2,3,种,G,o,F,设,计,模,式)
    expect(chars.length).toBe(10)
  })

  it('preserves whitespace as .reveal-ws spans', () => {
    const ws = harness.root.value!.querySelectorAll('.reveal-ws')
    expect(ws.length).toBeGreaterThanOrEqual(1)
  })

  it('marks item spans aria-hidden so screen readers skip the per-char reveal', () => {
    const chars = Array.from(harness.root.value!.querySelectorAll('.reveal-char'))
    for (const c of chars) {
      expect(c.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('split is idempotent — calling twice does not re-split', () => {
    const beforeCount = harness.root.value!.querySelectorAll('.reveal-char').length
    harness.split()
    const afterCount = harness.root.value!.querySelectorAll('.reveal-char').length
    expect(afterCount).toBe(beforeCount)
  })

  it('restore() puts original children back exactly', () => {
    harness.restore()
    expect(harness.root.value!.querySelectorAll('.reveal-char').length).toBe(0)
    expect(harness.root.value!.textContent).toBe('23 种 GoF 设计模式')
  })
})

describe('useSplitText — element siblings preserved', () => {
  it('keeps inner <span class="title-en"> intact while splitting the leading text', () => {
    const harnessRef: { current: Harness | null } = { current: null }
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        const handle = useSplitText(root, { mode: 'char' })
        harnessRef.current = { root, split: handle.split, restore: handle.restore }
        return () =>
          h('h1', { ref: root, innerHTML: '单例模式 <span class="title-en">/ Singleton</span>' })
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const harness = harnessRef.current!
    harness.split()

    // CJK part was split
    expect(harness.root.value!.querySelectorAll('.reveal-char').length).toBe(4)
    // .title-en sibling kept as element (not cloned away)
    const en = harness.root.value!.querySelector('.title-en')
    expect(en).not.toBeNull()
    expect(en!.textContent).toBe('/ Singleton')

    // restore() puts the original structure back
    harness.restore()
    expect(harness.root.value!.querySelectorAll('.reveal-char').length).toBe(0)
    expect(harness.root.value!.querySelector('.title-en')!.textContent).toBe('/ Singleton')
    expect(harness.root.value!.textContent).toBe('单例模式 / Singleton')

    wrapper.unmount()
  })
})

describe('useSplitText — word mode', () => {
  it('splits on whitespace boundaries and preserves whitespace tokens', () => {
    const harnessRef: { current: Harness | null } = { current: null }
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        const handle = useSplitText(root, { mode: 'word' })
        harnessRef.current = { root, split: handle.split, restore: handle.restore }
        return () => h('div', { ref: root, innerHTML: 'hello world foo' })
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const harness = harnessRef.current!
    harness.split()

    const items = harness.root.value!.querySelectorAll('.reveal-char')
    expect(items.length).toBe(3) // hello, world, foo
    const ws = harness.root.value!.querySelectorAll('.reveal-ws')
    expect(ws.length).toBe(2)   // 2 whitespace gaps

    harness.restore()
    expect(harness.root.value!.textContent).toBe('hello world foo')

    wrapper.unmount()
  })
})

describe('useSplitText — cleanup', () => {
  it('split → restore round-trip leaves DOM textually identical to original', () => {
    const el = document.createElement('h1')
    el.innerHTML = '单例模式 <span class="title-en">/ Singleton</span>'
    document.body.appendChild(el)
    const handle = useSplitText(ref(el), { mode: 'char' })
    handle.split()

    // verify split happened
    expect(el.querySelectorAll('.reveal-char').length).toBe(4)
    expect(el.querySelector('.title-en')!.textContent).toBe('/ Singleton')

    handle.restore()
    // original text and inner-element are back
    expect(el.textContent).toBe('单例模式 / Singleton')
    expect(el.querySelector('.title-en')).not.toBeNull()
    expect(el.querySelectorAll('.reveal-char').length).toBe(0)

    document.body.removeChild(el)
  })

  it('restore is a no-op when split was never called', () => {
    const el = document.createElement('h1')
    el.textContent = 'never split'
    const handle = useSplitText(ref(el), { mode: 'char' })
    expect(() => handle.restore()).not.toThrow()
    expect(el.textContent).toBe('never split')
  })
})