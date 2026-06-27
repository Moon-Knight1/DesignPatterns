<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdown } from '@/composables/useMarkdown'

const props = defineProps<{ source: string }>()
const html = useMarkdown(props.source)

// Wrap every <img> with a preceding skeleton span and add lazy loading.
const wrappedHtml = computed(() =>
  html.value.replace(
    /<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g,
    (_, before, src, after) => {
      const altMatch = (before + after).match(/alt="([^"]*)"/)
      const alt = altMatch ? altMatch[1] : '示意图'
      return `<span class="image-skeleton" aria-hidden="true"></span><img ${before} src="${src}" ${after} loading="lazy" decoding="async" alt="${alt.replace(/"/g, '&quot;')}">`
    },
  ),
)

// Anchor link smooth-scroll: TOC and inline # links share this handler.
function onAnchorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName !== 'A') return
  const href = target.getAttribute('href')
  if (!href || !href.startsWith('#') || href === '#') return
  const id = href.slice(1)
  const el = document.getElementById(id)
  if (el) {
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }
}

// Image event delegation. `load` and `error` events fire on <img> elements
// rendered via v-html. `load` bubbles; `error` does not — we use capture to
// catch both. The skeleton is shown while loading; on error we replace the
// <img> with a claymorphism-styled fallback span.
function onImgLoad(e: Event) {
  const img = e.target as HTMLElement
  if (img.tagName !== 'IMG') return
  const prev = img.previousElementSibling
  if (prev && prev.classList.contains('image-skeleton')) prev.remove()
}

function onImgError(e: Event) {
  const img = e.target as HTMLElement
  if (img.tagName !== 'IMG') return
  const prev = img.previousElementSibling
  if (prev && prev.classList.contains('image-skeleton')) prev.remove()
  const alt = img.getAttribute('alt') || '示意图不可用'
  const fallback = document.createElement('span')
  fallback.className = 'image-fallback'
  fallback.setAttribute('role', 'img')
  fallback.setAttribute('aria-label', alt)
  fallback.textContent = '示意图'
  img.replaceWith(fallback)
}
</script>

<template>
  <article
    class="prose"
    @click="onAnchorClick"
    @load.capture="onImgLoad"
    @error.capture="onImgError"
    v-html="wrappedHtml"
  />
</template>