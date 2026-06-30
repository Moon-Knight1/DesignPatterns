<script setup lang="ts">
defineProps<{
  interactive?: boolean
  accentColor?: string
}>()
</script>

<template>
  <article
    class="clay-card"
    :class="{ 'clay-card--interactive': interactive }"
    :style="accentColor ? { borderTopColor: accentColor } : undefined"
  >
    <slot />
  </article>
</template>

<style scoped>
.clay-card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  border-top: 4px solid transparent;
  padding: var(--space-5);
  box-shadow: var(--shadow-clay-out);
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.clay-card--interactive {
  cursor: pointer;
}

.clay-card--interactive:hover {
  box-shadow: var(--shadow-clay-out-lg);
}

.clay-card--interactive:active {
  box-shadow: var(--shadow-clay-press);
}

.clay-card--interactive:focus-visible {
  outline: 2px solid var(--cta-coral);
  outline-offset: 4px;
}
</style>
