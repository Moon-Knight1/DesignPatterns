<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import type { Pattern } from '@/types/pattern'

defineProps<{
  prev: Pattern | null
  next: Pattern | null
}>()
</script>

<template>
  <nav class="nav" aria-label="模式导航">
    <div v-if="prev" class="cell prev">
      <RouterLink :to="`/pattern/${prev.slug}`" class="link">
        <ClayCard interactive>
          <ArrowLeft :size="20" aria-hidden="true" />
          <span class="label">上一篇</span>
          <span class="title">{{ prev.titleZh }}</span>
        </ClayCard>
      </RouterLink>
    </div>
    <div v-if="next" class="cell next">
      <RouterLink :to="`/pattern/${next.slug}`" class="link">
        <ClayCard interactive>
          <span class="label">下一篇</span>
          <span class="title">{{ next.titleZh }}</span>
          <ArrowRight :size="20" aria-hidden="true" />
        </ClayCard>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.cell.next {
  grid-column: 2;
}

.cell.prev {
  grid-column: 1;
}

/* When only one of prev/next is present, it occupies its own column
   and is left-aligned (not centered). The CSS Grid above already does this
   because the empty cell takes the other column but renders nothing. */

.link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.label {
  font-size: 12px;
  color: var(--ink-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--space-1);
}

.cell.next :deep(.clay-card),
.cell.prev :deep(.clay-card) {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cell.next :deep(.clay-card) {
  justify-content: flex-end;
  text-align: right;
  flex-direction: row;
}

.cell.prev :deep(.clay-card) {
  flex-direction: row;
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
}

@media (max-width: 640px) {
  .nav { grid-template-columns: 1fr; }
  .cell.next { grid-column: 1; }
}
</style>