<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useToc } from '@/composables/useToc'
import { useStaggerReveal } from '@/composables/useStaggerReveal'

const props = defineProps<{ html: string }>()
const entries = useToc(toRef(props, 'html'))

const ulEl = ref<HTMLElement | null>(null)
useStaggerReveal(ulEl, {
  registryId: 'pattern-toc',
  tokenKey: 'subhead',
  staggerKey: 'staggerToc',
})

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }
}
</script>

<template>
  <aside class="toc" aria-label="本页目录">
    <p class="heading">本页目录</p>
    <ul v-if="entries.length" ref="ulEl">
      <li v-for="entry in entries" :key="entry.id" :data-level="entry.level">
        <a :href="`#${entry.id}`" @click="scrollTo(entry.id, $event)">{{ entry.text }}</a>
      </li>
    </ul>
    <p v-else class="empty">暂无章节</p>
  </aside>
</template>

<style scoped>
.toc {
  position: sticky;
  top: 96px;
  padding: var(--space-4);
  background: var(--surface-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-clay-out);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  font-size: 14px;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .toc {
    will-change: auto;
  }
}

.heading {
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: var(--space-3);
  font-size: 14px;
}

ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

li[data-level='3'] {
  padding-left: var(--space-4);
  font-size: 13px;
}

a {
  display: block;
  padding: var(--space-1) var(--space-2);
  color: var(--ink-600);
  border-radius: var(--radius-xs);
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

a:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--cta-coral);
}

.empty {
  color: var(--ink-400);
  font-size: 13px;
}

@media (max-width: 1023px) {
  .toc {
    position: static;
    max-height: none;
    margin-top: var(--space-5);
  }
}
</style>
