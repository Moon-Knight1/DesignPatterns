import { computed, isRef, type ComputedRef, type Ref } from 'vue'

export interface TocEntry {
  level: 2 | 3
  id: string
  text: string
}

export function useToc(html: string | Ref<string>): ComputedRef<TocEntry[]> {
  const src = isRef(html) ? html : ({ value: html } as Ref<string>)

  return computed<TocEntry[]>(() => {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return []
    }
    const doc = new DOMParser().parseFromString(src.value, 'text/html')
    const headings = doc.querySelectorAll('h2, h3')
    const out: TocEntry[] = []
    headings.forEach((h) => {
      const id = h.getAttribute('id')
      if (!id) return
      out.push({
        level: h.tagName === 'H2' ? 2 : 3,
        id,
        text: (h.textContent || '').trim(),
      })
    })
    return out
  })
}