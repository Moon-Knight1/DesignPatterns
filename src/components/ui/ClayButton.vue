<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  to?: string
  href?: string
  type?: 'button' | 'submit'
}>()
</script>

<template>
  <RouterLink v-if="to" :to="to" class="clay-button" :data-variant="variant ?? 'primary'">
    <slot />
  </RouterLink>
  <a v-else-if="href" :href="href" class="clay-button" :data-variant="variant ?? 'primary'" target="_blank" rel="noopener">
    <slot />
  </a>
  <button v-else :type="type ?? 'button'" class="clay-button" :data-variant="variant ?? 'primary'">
    <slot />
  </button>
</template>

<style scoped>
.clay-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  line-height: 1;
  box-shadow: var(--shadow-clay-out);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
  cursor: pointer;
  user-select: none;
}

.clay-button[data-variant='primary'] {
  background: var(--cta-coral);
  color: var(--cta-coral-ink);
}

.clay-button[data-variant='secondary'] {
  background: var(--surface-card);
  color: var(--ink-900);
}

.clay-button[data-variant='ghost'] {
  background: transparent;
  box-shadow: none;
  color: var(--ink-900);
}

.clay-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-clay-out-lg);
}

.clay-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-clay-press);
}

.clay-button:focus-visible {
  outline: 2px solid var(--cta-coral);
  outline-offset: 2px;
}
</style>