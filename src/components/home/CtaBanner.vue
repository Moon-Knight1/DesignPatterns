<script setup lang="ts">
import ClayButton from '@/components/ui/ClayButton.vue'
</script>

<template>
  <section class="cta">
    <div class="card">
      <h2 class="title">准备好开始了吗?</h2>
      <p class="text">从最简单的单例模式开始,逐步掌握 22 个经典模式。</p>
      <ClayButton to="/pattern/singleton" variant="primary">从单例模式开始</ClayButton>
    </div>
  </section>
</template>

<style scoped>
.cta {
  padding: var(--space-7) 0;
}

.card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  padding: var(--space-7);
  text-align: center;
  box-shadow: var(--shadow-clay-out-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
}

.text {
  font-size: 16px;
  color: var(--ink-600);
  margin-bottom: var(--space-2);
}
</style>