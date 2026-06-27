<script setup lang="ts">
import ClayButton from '@/components/ui/ClayButton.vue'
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <p class="eyebrow">面向中文读者的交互式学习手册</p>
      <h1 class="title">23 种 GoF 设计模式</h1>
      <p class="subtitle">
        经典 Gang of Four 设计模式的中文详解,涵盖创建型、结构型、行为型三大类,共 22 个模式。
      </p>
      <div class="actions">
        <ClayButton to="/pattern/singleton" variant="primary">开始学习</ClayButton>
        <ClayButton href="#cat-creational" variant="secondary">浏览全部模式</ClayButton>
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

.eyebrow {
  font-size: 14px;
  color: var(--ink-600);
  font-weight: 500;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 48px);
  font-weight: 400;
  color: var(--ink-900);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--ink-600);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}
</style>