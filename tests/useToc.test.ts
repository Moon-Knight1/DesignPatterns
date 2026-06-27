import { describe, it, expect } from 'vitest'
import { useToc } from '@/composables/useToc'

const SAMPLE_HTML = `
  <h2 id="意图">意图</h2>
  <p>...</p>
  <h2 id="解决方案">解决方案</h2>
  <h3 id="步骤一">步骤一</h3>
  <h3 id="步骤二">步骤二</h3>
  <h2 id="结构">结构</h2>
  <h4 id="ignored">ignored</h4>
`

describe('useToc', () => {
  it('extracts h2 and h3 with their ids and text', () => {
    const toc = useToc(SAMPLE_HTML).value
    expect(toc).toHaveLength(5)
    expect(toc[0]).toEqual({ level: 2, id: '意图',    text: '意图' })
    expect(toc[1]).toEqual({ level: 2, id: '解决方案', text: '解决方案' })
    expect(toc[2]).toEqual({ level: 3, id: '步骤一',   text: '步骤一' })
  })

  it('ignores headings without an id', () => {
    const toc = useToc('<h2>no id</h2><h2 id="x">x</h2>').value
    expect(toc).toHaveLength(1)
    expect(toc[0].id).toBe('x')
  })

  it('ignores h1, h4, h5, h6', () => {
    const toc = useToc('<h1 id="a">a</h1><h4 id="b">b</h4><h6 id="c">c</h6>').value
    expect(toc).toHaveLength(0)
  })

  it('returns empty array for empty html', () => {
    expect(useToc('').value).toEqual([])
  })
})