import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useMarkdown } from '@/composables/useMarkdown'

describe('useMarkdown', () => {
  it('renders plain markdown to HTML', () => {
    const html = useMarkdown('# Hello').value
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
  })

  it('escapes raw HTML (no script injection)', () => {
    const html = useMarkdown('Hello <script>alert(1)</script>').value
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('adds slug ids to headings (preserves CJK verbatim)', () => {
    const html = useMarkdown('## 意图\n\n## 解决方案').value
    expect(html).toMatch(/id="意图"/)
    expect(html).toMatch(/id="解决方案"/)
  })

  it('rewrites relative imgs paths to BASE_URL-prefixed paths', () => {
    const md = '![observer](../imgs/observer/observer.png)'
    const html = useMarkdown(md).value
    // base is '/' in test env (vitest uses default import.meta.env)
    expect(html).toContain('src="/imgs/observer/observer.png"')
    expect(html).not.toContain('../imgs/')
  })

  it('rewrites every img reference, not just the first', () => {
    const md = '![a](../imgs/a/x.png) and ![b](../imgs/b/y.png)'
    const html = useMarkdown(md).value
    expect(html).toContain('src="/imgs/a/x.png"')
    expect(html).toContain('src="/imgs/b/y.png"')
  })

  it('preserves code fences', () => {
    const md = '```\nclass Foo\n```'
    const html = useMarkdown(md).value
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('class Foo')
  })

  it('auto-links bare URLs', () => {
    const html = useMarkdown('Visit https://example.com today.').value
    expect(html).toContain('href="https://example.com"')
  })

  it('responds to reactive source changes', () => {
    const src = ref('# First')
    const html = useMarkdown(src)
    expect(html.value).toContain('First')
    src.value = '# Second'
    expect(html.value).toContain('Second')
  })
})