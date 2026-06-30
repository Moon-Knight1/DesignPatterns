<script setup lang="ts">
import { computed, toRef, onMounted, onUpdated, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMarkdown } from '@/composables/useMarkdown'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'

const props = defineProps<{ source: string }>()
const containerEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()
// toRef so useMarkdown sees a reactive ref — without it, the
// composable's `isRef(source)` branch returns false and the string
// value is captured statically at setup, freezing the rendered HTML
// when the route changes (e.g. clicking 上一篇/下一篇).
const html = useMarkdown(toRef(props, 'source'))

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

// ── 容器入场：fade-only（spec §6.2） ──
useGsapScene(containerEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(containerEl.value!, { opacity: 1, y: 0 })
    return
  }
  tl.from(containerEl.value!, {
    duration: tokens.fadeOnly.duration,
    ease: tokens.fadeOnly.ease,
    y: tokens.fadeOnly.fromY,
    opacity: tokens.fadeOnly.fromOpacity,
  }, '+=0.12') // 120ms 间隔（hero stagger 节奏）
})

// ── 滚动驱动：reveal-scroll + ScrollTrigger ──
onMounted(() => setupScrollReveal())
onUpdated(() => ScrollTrigger.refresh()) // markdown 替换内容后重算

function setupScrollReveal() {
  if (!containerEl.value) return
  const tokens = tokensRef.value
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (rm) return // reduced-motion 不接 ScrollTrigger

  const headings = containerEl.value.querySelectorAll<HTMLElement>('h2, h3, img, pre')
  headings.forEach((el: HTMLElement) => {
    gsap.from(el, {
      duration: tokens.revealScroll.duration,
      ease: tokens.revealScroll.ease,
      y: tokens.revealScroll.fromY,
      opacity: tokens.revealScroll.fromOpacity,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        markers: import.meta.env.DEV,
        once: true,
      },
    })
  })
}
</script>

<template>
  <article
    ref="containerEl"
    class="prose"
    @click="onAnchorClick"
    @load.capture="onImgLoad"
    @error.capture="onImgError"
    v-html="wrappedHtml"
  />
</template>