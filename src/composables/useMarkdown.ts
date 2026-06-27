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
    const rewritten = src.value.replace(
      /\]\(\.\.\/imgs\//g,
      `](${base}imgs/`,
    )
    return md.render(rewritten)
  })
}