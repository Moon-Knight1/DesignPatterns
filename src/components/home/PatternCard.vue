<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import type { Pattern } from '@/types/pattern'
import { gsap } from 'gsap'
import { useMotionTokens } from '@/composables/useMotionTokens'

const props = defineProps<{
  pattern: Pattern
  accentColor: string
}>()

const tokensRef = useMotionTokens()
const linkEl = ref<HTMLElement | null>(null)

const categoryColorVar: Record<Pattern['category'], string> = {
  creational: 'var(--cat-creational)',
  structural: 'var(--cat-structural)',
  behavioral: 'var(--cat-behavioral)',
}

function onEnter() {
  const { duration, ease, toY, toScale } = tokensRef.value.hoverLift
  gsap.to(linkEl.value!, { duration, ease, y: toY, scale: toScale })
}

function onLeave() {
  const { duration, ease, fromY, fromScale } = tokensRef.value.hoverLift
  gsap.to(linkEl.value!, { duration, ease, y: fromY, scale: fromScale })
}

function onDown() {
  const { duration, ease, fromScale, toScale } = tokensRef.value.pressSquish
  gsap.fromTo(linkEl.value!,
    { scale: fromScale },
    { scale: toScale, duration, ease },
  )
}
</script>

<template>
  <RouterLink
    ref="linkEl"
    :to="`/pattern/${props.pattern.slug}`"
    class="link"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerdown="onDown"
  >
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
