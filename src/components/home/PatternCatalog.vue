<script setup lang="ts">
import { categories } from '@/data/patterns'
import CategorySection from './CategorySection.vue'
</script>

<template>
  <div class="catalog">
    <CategorySection :category="categories.creational" />
    <CategorySection :category="categories.structural" />
    <CategorySection :category="categories.behavioral" />
  </div>
</template>

<style scoped>
.catalog {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
</style>