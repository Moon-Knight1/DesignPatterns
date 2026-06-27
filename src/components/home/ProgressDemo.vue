<template>
  <section class="progress-demo" aria-label="学习路径示意">
    <h2 class="heading">学习路径</h2>
    <p class="caption">由浅入深,逐步掌握所有模式</p>
    <div class="track">
      <div class="dot filled" aria-label="已完成">
        <span class="dot-label">单例</span>
      </div>
      <div class="tube"></div>
      <div class="dot filled" aria-label="已完成">
        <span class="dot-label">工厂</span>
      </div>
      <div class="tube"></div>
      <div class="dot in-progress" aria-label="学习中">
        <span class="dot-label">观察者</span>
      </div>
      <div class="tube"></div>
      <div class="dot" aria-label="未开始">
        <span class="dot-label">策略</span>
      </div>
      <div class="tube"></div>
      <div class="dot" aria-label="未开始">
        <span class="dot-label">访问者</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress-demo {
  text-align: center;
  padding: var(--space-7) 0;
}

.heading {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
  margin-bottom: var(--space-2);
}

.caption {
  font-size: 14px;
  color: var(--ink-600);
  margin-bottom: var(--space-6);
}

.track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0 var(--space-4);
}

.dot {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-out);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.dot.filled {
  background: var(--cat-creational);
  box-shadow: var(--shadow-clay-out-lg);
}

.dot.in-progress {
  background: var(--accent-yellow);
  box-shadow: var(--shadow-clay-out-lg);
  position: relative;
}

.dot.in-progress::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: var(--radius-pill);
  border: 2px dashed var(--cta-coral);
  animation: spin 6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dot-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-900);
  text-align: center;
  line-height: 1.1;
  padding: 0 4px;
}

.dot.filled .dot-label,
.dot.in-progress .dot-label {
  color: var(--ink-900);
}

.tube {
  height: 8px;
  width: clamp(24px, 4vw, 48px);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-in);
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dot.in-progress::after { animation: none; }
}
</style>