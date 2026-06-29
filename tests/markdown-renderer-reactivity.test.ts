import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, toRef, ref, nextTick } from 'vue'
import { useMarkdown } from '@/composables/useMarkdown'
import MarkdownRenderer from '@/components/pattern/MarkdownRenderer.vue'

// Root cause analysis: MarkdownRenderer.vue currently does
//   const props = defineProps<{ source: string }>()
//   const html = useMarkdown(props.source)        // <-- BUG
// `props.source` is a string, not a ref, so useMarkdown's
// `isRef(source)` branch is false and the value is captured
// statically. When the parent flips `source` after a route
// change, the inner computed never re-runs.
//
// We reproduce the failure both at the useMarkdown boundary
// and at the component boundary (mounting MarkdownRenderer
// via a parent that toggles its source prop).
describe('MarkdownRenderer reactivity (root cause: useMarkdown called with plain string)', () => {
  it('useMarkdown with a non-ref string captures the value statically (does NOT re-render)', () => {
    // Simulate the broken call: a non-reactive string is captured.
    const captured = { value: '# First' } // what useMarkdown's fallback branch builds
    const html1 = useMarkdown(captured.value)
    expect(html1.value).toContain('First')

    // Mutating the captured ref's value (mimicking what props.source would do)
    // has NO effect because the original string was copied.
    captured.value = '# Second'
    expect(html1.value).toContain('First') // still old — proves static capture
  })

  it('useMarkdown with toRef(props, "source") DOES re-render on prop change', async () => {
    const Host = defineComponent({
      props: { source: { type: String, required: true } },
      setup(props) {
        const html = useMarkdown(toRef(props, 'source'))
        return { html }
      },
      template: `<article v-html="html" />`,
    })

    const wrapper = mount(Host, { props: { source: '# First' } })
    expect(wrapper.html()).toContain('First')

    await wrapper.setProps({ source: '# Second' })
    expect(wrapper.html()).toContain('Second')
    expect(wrapper.html()).not.toContain('First')
  })

  it('MarkdownRenderer component: re-renders only when useMarkdown receives a reactive ref', async () => {
    // Mount a parent that toggles its `source` ref, then pass it via
    // a getter template binding so MarkdownRenderer's props.source
    // actually updates between renders.
    const Parent = defineComponent({
      components: { MarkdownRenderer },
      setup() {
        const source = ref('# First article')
        // Expose a setter so the test can mutate the ref through the
        // public vm proxy (which auto-unwraps refs).
        const setSource = (v: string) => {
          source.value = v
        }
        return { source, setSource }
      },
      template: `<MarkdownRenderer :source="source" />`,
    })

    const wrapper = mount(Parent)

    expect(wrapper.html()).toContain('First article')

    ;(wrapper.vm as unknown as { setSource: (v: string) => void }).setSource(
      '# Second article',
    )
    await nextTick()

    // With the current (buggy) MarkdownRenderer implementation, the
    // v-html output is frozen at the first source. With the fix
    // (toRef inside MarkdownRenderer), it updates.
    expect(wrapper.html()).toContain('Second article')
    expect(wrapper.html()).not.toContain('First article')
  })
})
