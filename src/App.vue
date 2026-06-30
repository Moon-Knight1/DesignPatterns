<script setup lang="ts">
import { RouterView } from 'vue-router'
import { gsap } from 'gsap'
import { useMotionTokens } from '@/composables/useMotionTokens'
import SiteFooter from '@/components/layout/SiteFooter.vue'

// ⚠️ 顶层只接 ref，.value 在 Transition 钩子里读（spec §4.4.3）
const tokensRef = useMotionTokens()

function onLeave(el: Element, done: () => void) {
  gsap.killTweensOf(el)                                    // 路线 A：节点级清理（spec §3.4）
  const { duration, ease, toY, toOpacity } = tokensRef.value.leaveQuick
  gsap.to(el as gsap.TweenTarget, {
    y: toY,
    opacity: toOpacity,
    duration,
    ease,
    onComplete: done,
  })
}

function onEnter(el: Element, done: () => void) {
  gsap.killTweensOf(el)
  const { duration, ease, fromY, fromOpacity, fromScale, toY, toOpacity, toScale } = tokensRef.value.enterPage
  gsap.fromTo(el as gsap.TweenTarget,
    { y: fromY, opacity: fromOpacity, scale: fromScale },
    { y: toY, opacity: toOpacity, scale: toScale, duration, ease, onComplete: done },
  )
}
</script>

<template>
  <a class="skip-link" href="#main">跳转到主要内容</a>
  <main id="main">
    <RouterView v-slot="{ Component, route }">
      <Transition name="route" mode="out-in"
                  @enter="onEnter" @leave="onLeave">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter />
</template>