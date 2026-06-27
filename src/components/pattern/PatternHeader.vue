<script setup lang="ts">
import { RouterLink } from 'vue-router'
import CategoryChip from '@/components/ui/CategoryChip.vue'
import type { Pattern } from '@/types/pattern'

const props = defineProps<{ pattern: Pattern }>()

const categoryZh = {
  creational: '创建型',
  structural: '结构型',
  behavioral: '行为型',
}[props.pattern.category]
</script>

<template>
  <div class="header">
    <nav aria-label="面包屑" class="breadcrumb">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ categoryZh }}</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ pattern.titleZh }}</span>
    </nav>
    <CategoryChip :category="pattern.category" />
    <h1 class="title">{{ pattern.titleZh }} <span class="title-en">/ {{ pattern.titleEn }}</span></h1>
  </div>
</template>

<style scoped>
.header {
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