import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick, toRef } from 'vue'
import { useToc } from '@/composables/useToc'
import PatternToc from '@/components/pattern/PatternToc.vue'

describe('PatternToc reactivity (same root cause as MarkdownRenderer)', () => {
  it('re-renders the TOC list when the html prop changes (currently broken)', async () => {
    const Parent = defineComponent({
      components: { PatternToc },
      setup() {
        const html = ref('<h2 id="a">Alpha</h2>')
        const setHtml = (v: string) => {
          html.value = v
        }
        return { html, setHtml }
      },
      template: `<PatternToc :html="html" />`,
    })

    const wrapper = mount(Parent)
    expect(wrapper.text()).toContain('Alpha')

    ;(wrapper.vm as unknown as { setHtml: (v: string) => void }).setHtml(
      '<h2 id="b">Beta</h2>',
    )
    await nextTick()

    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.text()).not.toContain('Alpha')
  })

  it('proposed fix: useToc(toRef(props, "html")) re-renders on prop change', async () => {
    const Fixed = defineComponent({
      props: { html: { type: String, required: true } },
      setup(props) {
        const entries = useToc(toRef(props, 'html'))
        return { entries }
      },
      template: `<ul><li v-for="e in entries" :key="e.id">{{ e.text }}</li></ul>`,
    })

    const wrapper = mount(Fixed, {
      props: { html: '<h2 id="a">Alpha</h2>' },
    })
    expect(wrapper.text()).toContain('Alpha')

    await wrapper.setProps({ html: '<h2 id="b">Beta</h2>' })
    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.text()).not.toContain('Alpha')
  })
})
