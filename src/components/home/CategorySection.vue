<script setup lang="ts">
import CategoryChip from '@/components/ui/CategoryChip.vue'
import PatternCard from './PatternCard.vue'
import type { CategoryMeta } from '@/data/patterns'

defineProps<{ category: CategoryMeta }>()
</script>

<template>
  <section class="section" :id="`cat-${category.items[0]?.category}`">
    <div class="header">
      <CategoryChip :category="category.items[0]?.category ?? 'creational'" />
      <h2 class="title">{{ category.zh }}</h2>
      <span class="count">{{ category.items.length }} 个模式</span>
    </div>
    <div class="grid">
      <PatternCard
        v-for="p in category.items"
        :key="p.slug"
        :pattern="p"
        :accent-color="category.color"
      />
    </div>
  </section>
</template>

<style scoped>
.section {
  scroll-margin-top: 80px;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
}

.count {
  font-size: 14px;
  color: var(--ink-600);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
</style>