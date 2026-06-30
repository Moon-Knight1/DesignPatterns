import type { Ref } from 'vue'
import { gsap } from 'gsap'
import { useGsapScene } from './useGsapScene'
import { useMotionTokens, type MotionTokensMap } from './useMotionTokens'

const FIRST_MOUNT_REGISTRY = new Set<string>()

export interface StaggerRevealOptions {
  /** 同一 registryId 首次调用跑动画；后续瞬时终态 gsap.set 不动画（spec §6.6） */
  registryId?: string
  tokenKey: keyof Pick<MotionTokensMap,
    'subhead' | 'entrySoft' | 'fadeOnly' | 'fadeOnlyTight'>
  staggerKey: keyof Pick<MotionTokensMap,
    'staggerCard' | 'staggerToc' | 'staggerHero'>
}

/**
 * 子节点 stagger 入场的薄封装（spec §6.6）。
 * 首次 mount 跑 tl.from(children)；后续 mount 瞬时终态。
 */
export function useStaggerReveal(
  root: Ref<HTMLElement | null | undefined>,
  options: StaggerRevealOptions,
) {
  const tokensRef = useMotionTokens()

  useGsapScene(root, (tl, rm) => {
    const el = root.value!
    const children = el.querySelectorAll(':scope > *')

    if (rm.value) {
      gsap.set(children, { opacity: 1, y: 0, scale: 1 })
      return
    }

    const regId = options.registryId ?? `__default-${options.tokenKey}`
    if (FIRST_MOUNT_REGISTRY.has(regId)) {
      gsap.set(children, { opacity: 1, y: 0, scale: 1 })
      return
    }
    FIRST_MOUNT_REGISTRY.add(regId)

    const tokens = tokensRef.value
    const token = tokens[options.tokenKey]
    tl.from(children, {
      duration: token.duration,
      ease: token.ease,
      y: token.fromY,
      opacity: token.fromOpacity,
      stagger: tokens[options.staggerKey],
    })
  })
}