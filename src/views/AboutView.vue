<script setup lang="ts">
import { useHead } from '@vueuse/head'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

useHead({
  title: '关于 · 23 种设计模式',
  meta: [
    { name: 'description', content: '关于本网站的来源、技术栈与贡献方式。' },
    { property: 'og:title', content: '关于 · 23 种设计模式' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/#/about' }],
})
</script>

<template>
  <Container>
    <article class="about">
      <h1>关于本站</h1>

      <section>
        <h2>内容来源</h2>
        <p>本站内容整理自 <a href="https://refactoringguru.cn" target="_blank" rel="noopener">Refactoring Guru</a>
          中文版的 23 种 GoF 设计模式文档。原始内容以 Markdown 形式存放在
          <a href="https://github.com/Moon-Knight1/DesignPatterns/tree/main/theory" target="_blank" rel="noopener"><code>theory/</code></a>
          目录下,本站直接渲染这些 Markdown 文件,不做二次创作。</p>
      </section>

      <section>
        <h2>技术栈</h2>
        <p>本站使用 Vue 3 + Vite + TypeScript 构建,Markdown 通过
          <a href="https://github.com/markdown-it/markdown-it" target="_blank" rel="noopener">markdown-it</a>
          渲染,使用 vue-router 的 hash 模式路由,部署于 GitHub Pages。</p>
      </section>

      <section>
        <h2>贡献</h2>
        <p>内容纠错与改进请通过
          <a href="https://github.com/Moon-Knight1/DesignPatterns/issues" target="_blank" rel="noopener">Issue</a>
          或 Pull Request 提交至
          <a href="https://github.com/Moon-Knight1/DesignPatterns" target="_blank" rel="noopener">源码仓库</a>。</p>
      </section>

      <section>
        <h2>许可</h2>
        <p>本站采用 MIT 许可证。</p>
      </section>
    </article>
  </Container>
  <SiteFooter />
</template>

<style scoped>
.about {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) 0;
}

.about h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  margin-bottom: var(--space-5);
}

.about h2 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 20px;
  margin: var(--space-5) 0 var(--space-2);
}

.about p {
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink-900);
}

.about a {
  color: var(--cta-coral);
  text-decoration: underline;
}

.about code {
  font-family: var(--font-code);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 14px;
}
</style>