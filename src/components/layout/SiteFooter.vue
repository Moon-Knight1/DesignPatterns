<script setup lang="ts">
import Container from './Container.vue'
</script>

<template>
  <footer class="site-footer">
    <Container>
      <div class="inner">
        <p>
          内容整理自 Refactoring.Guru 中文版 ·
          <a
            href="https://github.com/Moon-Knight1/DesignPatterns"
            target="_blank"
            rel="noopener"
          >源码仓库</a>
        </p>
        <p class="meta">部署于 GitHub Pages · MIT License</p>
      </div>
    </Container>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--space-8);
  padding: var(--space-6) 0;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  color: var(--ink-600);
  font-size: 14px;
}

.inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  text-align: center;
}

.inner a {
  color: var(--cta-coral);
  text-decoration: underline;
}

.meta {
  font-size: 12px;
  color: var(--ink-400);
}
</style>