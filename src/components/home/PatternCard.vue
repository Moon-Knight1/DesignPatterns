<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import type { Pattern } from '@/types/pattern'

const props = defineProps<{
  pattern: Pattern
  accentColor: string
}>()

const categoryColorVar: Record<Pattern['category'], string> = {
  creational: 'var(--cat-creational)',
  structural: 'var(--cat-structural)',
  behavioral: 'var(--cat-behavioral)',
}
</script>

<template>
  <RouterLink :to="`/pattern/${props.pattern.slug}`" class="link">
    <ClayCard interactive :accent-color="categoryColorVar[props.pattern.category]">
      <div class="row">
        <span class="category">
          {{
            props.pattern.category === 'creational' ? '创建型'
              : props.pattern.category === 'structural' ? '结构型'
              : '行为型'
          }}
        </span>
      </div>
      <h3 class="title-zh">{{ props.pattern.titleZh }}</h3>
      <p class="title-en">{{ props.pattern.titleEn }}</p>
      <p class="summary">{{ props.pattern.summary }}</p>
    </ClayCard>
  </RouterLink>
</template>

<style scoped>
.link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.row {
  margin-bottom: var(--space-3);
}

.category {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.title-zh {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink-900);
  margin-bottom: var(--space-1);
}

.title-en {
  font-family: var(--font-latin);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-400);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.summary {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-600);
}
</style>