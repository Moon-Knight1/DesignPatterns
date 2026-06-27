<script setup lang="ts">
import { useHead } from '@vueuse/head'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import PatternCatalog from '@/components/home/PatternCatalog.vue'
import ProgressDemo from '@/components/home/ProgressDemo.vue'
import CtaBanner from '@/components/home/CtaBanner.vue'

useHead({
  title: '23 种 GoF 设计模式 · 学习手册',
  meta: [
    { name: 'description', content: '一份面向中文读者的交互式设计模式学习手册,涵盖 22 个 GoF 经典模式。' },
    { property: 'og:title', content: '23 种 GoF 设计模式 · 学习手册' },
    { property: 'og:description', content: '一份面向中文读者的交互式设计模式学习手册。' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/' }],
})
</script>

<template>
  <Container>
    <HeroSection />
    <PatternCatalog />
    <ProgressDemo />
    <CtaBanner />
  </Container>
  <SiteFooter />
</template>