// Build-time eager import of all theory/*.md as raw strings.
// Relative path (../../theory/) is canonical Vite form and robust across versions.
const raw = import.meta.glob('../../theory/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface SlugPath {
  path: string
  slug: string
  source: string
}

const allEntries: SlugPath[] = Object.entries(raw).map(([path, source]) => {
  const match = path.match(/\/([^/]+)\.md$/)
  if (!match) throw new Error(`Cannot extract slug from path: ${path}`)
  return { path, slug: match[1], source }
})

export const markdownBySlug: Record<string, string> = Object.fromEntries(
  allEntries.map(({ slug, source }) => [slug, source])
)