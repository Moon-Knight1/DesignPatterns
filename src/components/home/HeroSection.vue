<script setup lang="ts">
import { ref } from 'vue'
import { gsap } from 'gsap'
import ClayButton from '@/components/ui/ClayButton.vue'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'
import { useSplitText } from '@/composables/useSplitText'

const heroEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()

const titleSplit = useSplitText(titleEl, { mode: 'char' })

useGsapScene(heroEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(heroEl.value!, { opacity: 1, y: 0 })
    return
  }
  // Split the CJK title into per-char spans BEFORE targeting them with GSAP.
  titleSplit.split()
  const cta = heroEl.value!.querySelector('.actions')!

  tl.from('.reveal-char', {
    duration: tokens.heroTitle.duration,
    ease: tokens.heroTitle.ease,
    yPercent: 100,
    opacity: 0,
    stagger: 0.025,
  })
  tl.from(cta, {
    duration: tokens.entryStrong.duration,
    ease: tokens.entryStrong.ease,
    y: tokens.entryStrong.fromY,
    scale: tokens.entryStrong.fromScale,
    opacity: tokens.entryStrong.fromOpacity,
  }, '+=0.11')   // 110ms 间隔（hero stagger）
})
</script>

<template>
  <section ref="heroEl" class="hero">
    <div class="hero-inner">
      <h1 ref="titleEl" class="title" aria-label="23 种 GoF 设计模式">23 种 GoF 设计模式</h1>
      <div class="actions">
        <ClayButton to="/pattern/singleton" variant="primary">开始学习</ClayButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: var(--space-8) 0 var(--space-7);
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  max-width: 760px;
  margin: 0 auto;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 48px);
  font-weight: 400;
  color: var(--ink-900);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}
</style>