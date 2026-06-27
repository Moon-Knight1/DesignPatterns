<script setup lang="ts">
import { House, CircleHelp, Github } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Container from './Container.vue'
</script>

<template>
  <header class="site-header">
    <Container>
      <div class="bar">
        <RouterLink to="/" class="brand">
          <span class="brand-mark">23</span>
          <span class="brand-name">设计模式</span>
        </RouterLink>
        <nav aria-label="主导航">
          <ul class="links">
            <li>
              <RouterLink to="/" class="link">
                <House :size="18" aria-hidden="true" />
                <span>首页</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/about" class="link">
                <CircleHelp :size="18" aria-hidden="true" />
                <span>关于</span>
              </RouterLink>
            </li>
            <li>
              <a
                href="https://github.com/Moon-Knight1/DesignPatterns"
                class="link"
                target="_blank"
                rel="noopener"
                aria-label="GitHub 仓库"
              >
                <Github :size="18" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </Container>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 247, 240, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 20px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  background: var(--cta-coral);
  color: var(--cta-coral-ink);
  font-family: var(--font-display);
  font-size: 18px;
}

.links {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  color: var(--ink-900);
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.link:hover {
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-out);
}

.link.router-link-active {
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-in);
}

@media (max-width: 640px) {
  .link span:not([aria-label]) {
    display: none;
  }
}
</style>