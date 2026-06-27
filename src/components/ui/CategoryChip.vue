<script setup lang="ts">
import { PackagePlus, Blocks, Workflow } from 'lucide-vue-next'
import type { PatternCategory } from '@/types/pattern'

const props = defineProps<{ category: PatternCategory }>()

const iconMap = {
  creational: PackagePlus,
  structural: Blocks,
  behavioral: Workflow,
} as const

const labelMap = {
  creational: '创建型',
  structural: '结构型',
  behavioral: '行为型',
} as const
</script>

<template>
  <span class="chip" :data-category="props.category">
    <component :is="iconMap[props.category]" :size="18" aria-hidden="true" />
    <span>{{ labelMap[props.category] }}</span>
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-clay-out);
  color: var(--ink-900);
}

.chip[data-category='creational'] { background: var(--cat-creational-soft); }
.chip[data-category='structural'] { background: var(--cat-structural-soft); }
.chip[data-category='behavioral'] { background: var(--cat-behavioral-soft); }
</style>