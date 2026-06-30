<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import Container from '@/components/layout/Container.vue'
import PatternHeader from '@/components/pattern/PatternHeader.vue'
import MarkdownRenderer from '@/components/pattern/MarkdownRenderer.vue'
import PatternToc from '@/components/pattern/PatternToc.vue'
import PatternFooterNav from '@/components/pattern/PatternFooterNav.vue'
import { getPattern, getPrev, getNext } from '@/data/patterns'
import { markdownBySlug } from '@/data/markdown'
import { useMarkdown } from '@/composables/useMarkdown'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const pattern = computed(() => getPattern(slug.value))
const source = computed(() => (pattern.value ? markdownBySlug[slug.value] : ''))
const html = useMarkdown(source)
const prev = computed(() => getPrev(slug.value))
const next = computed(() => getNext(slug.value))

useHead(() => ({
  title: pattern.value
    ? `${pattern.value.titleZh} · 23 种设计模式`
    : '未找到模式 · 23 种设计模式',
  meta: pattern.value
    ? [
        { name: 'description', content: pattern.value.summary },
        { property: 'og:title', content: `${pattern.value.titleZh} · 23 种设计模式` },
        { property: 'og:description', content: pattern.value.summary },
        { property: 'og:type', content: 'article' },
      ]
    : [],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/' }],
}))
</script>

<template>
  <Container>
    <template v-if="pattern">
      <PatternHeader :pattern="pattern" />
      <div class="layout">
        <MarkdownRenderer :source="source" />
        <PatternToc :html="html" />
      </div>
      <PatternFooterNav :prev="prev" :next="next" />
    </template>
    <template v-else>
      <div class="not-found">
        <h1>未找到该模式</h1>
        <p>请检查链接,或返回首页浏览全部模式。</p>
        <RouterLink to="/" class="back">← 返回首页</RouterLink>
      </div>
    </template>
  </Container>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: start;
  }
}

.not-found {
  text-align: center;
  padding: var(--space-8) 0;
}

.not-found h1 {
  font-family: var(--font-heading);
  font-size: 28px;
  margin-bottom: var(--space-3);
}

.back {
  display: inline-block;
  margin-top: var(--space-4);
  color: var(--cta-coral);
  text-decoration: underline;
}
</style>