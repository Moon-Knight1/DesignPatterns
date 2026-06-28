import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import GithubSlugger from 'github-slugger'
import { computed, isRef, type ComputedRef, type Ref } from 'vue'

export function useMarkdown(source: string | Ref<string>): ComputedRef<string> {
  const src = isRef(source) ? source : ({ value: source } as Ref<string>)

  // Fresh slugger per render so duplicate heading texts across pages
  // get independent slugs (the slugger is stateful — its `occurrences`
  // map tracks duplicates within a single render only).
  const slugger = new GithubSlugger()

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
  }).use(anchor, {
    slugify: (s: string) => slugger.slug(s),
  })

  return computed(() => {
    const base = import.meta.env.BASE_URL || '/'
    // Two pre-processing passes before markdown-it sees the source:
    //   1. Rewrite `](../imgs/...)` to point at the runtime base URL.
    //   2. Collapse the `- ` empty-list-item separators that the theory
    //      files use as paragraph dividers. Without this, markdown-it
    //      treats each trailing `- ` as a setext-heading underline and
    //      promotes the preceding paragraph to <h2>, which pollutes the
    //      TOC and applies the heading style to body text.
    const rewritten = src.value
      .replace(/\]\(\.\.\/imgs\//g, `](${base}imgs/`)
      .replace(/^- \r?\n/gm, '\r\n\r\n')
    return md.render(rewritten)
  })
}