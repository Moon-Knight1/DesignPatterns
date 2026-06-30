<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CategoryChip from '@/components/ui/CategoryChip.vue'
import type { Pattern } from '@/types/pattern'
import { gsap } from 'gsap'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'

const props = defineProps<{ pattern: Pattern }>()
const headerEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()

useGsapScene(headerEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(headerEl.value!, { opacity: 1, y: 0 })
    return
  }
  tl.from(headerEl.value!, {
    duration: tokens.fadeOnly.duration,
    ease: tokens.fadeOnly.ease,
    y: tokens.fadeOnly.fromY,
    opacity: tokens.fadeOnly.fromOpacity,
  })
})

const categoryZh = {
  creational: '创建型',
  structural: '结构型',
  behavioral: '行为型',
}[props.pattern.category]
</script>

<template>
  <header ref="headerEl" class="pattern-header">
    <nav aria-label="面包屑" class="breadcrumb">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ categoryZh }}</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ pattern.titleZh }}</span>
    </nav>
    <CategoryChip :category="pattern.category" />
    <h1 class="title">{{ pattern.titleZh }} <span class="title-en">/ {{ pattern.titleEn }}</span></h1>
  </header>
</template>

<style scoped>
.pattern-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  color: var(--ink-600);
}

.breadcrumb a {
  color: var(--ink-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.breadcrumb a:hover {
  color: var(--cta-coral);
}

.breadcrumb [aria-current='page'] {
  color: var(--ink-900);
  font-weight: 600;
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(28px, 4vw, 36px);
  color: var(--ink-900);
  line-height: 1.3;
}

.title-en {
  font-family: var(--font-latin);
  font-weight: 700;
  font-size: 0.5em;
  letter-spacing: 0.05em;
  color: var(--ink-400);
  text-transform: uppercase;
}
</style>