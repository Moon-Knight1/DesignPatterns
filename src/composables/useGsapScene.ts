import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'
import { useReducedMotion } from './useReducedMotion'

export type SceneBuilder = (
  tl: gsap.core.Timeline,
  rm: Readonly<Ref<boolean>>,
) => gsap.core.Timeline | void

/**
 * 在组件 mount 时用 gsap.context(fn, scopeEl) 注册所有 tweens / ScrollTrigger。
 * 组件 unmount 时 ctx.revert() 一键清理（spec §3.1, §3.2）。
 *
 * 调用方惯用法：
 * - 顶层只接 root ref，不要在此解构任何 .value
 * - build 回调里通过 read .value 读 motion tokens（详见 useMotionTokens 时序）
 */
export function useGsapScene(
  root: Ref<HTMLElement | null | undefined>,
  build: SceneBuilder,
): void {
  const reducedRef = useReducedMotion()
  let ctx: gsap.Context | undefined

  onMounted(() => {
    const el = root.value
    if (!el) {
      console.warn('[anim] root not ready')
      return
    }

    ctx = gsap.context(() => {
      const tl = gsap.timeline()
      build(tl, reducedRef)
    }, el)
  })

  onBeforeUnmount(() => {
    ctx?.revert()
    ctx = undefined
  })
}