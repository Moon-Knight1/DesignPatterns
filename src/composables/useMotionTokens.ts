import { computed, type Ref } from 'vue'

export type MotionToken = {
  /** 持续时间，秒（GSAP 默认秒）。'480ms' → 0.48 */
  duration: number
  /** GSAP 内置缓动字符串，原样喂 GSAP */
  ease: string
  /** from 系使用的起始 Y（px） */
  fromY: number
  /** to 系使用的目标 / 离场 Y（px），可选 */
  toY?: number
  /** from 系使用的起始 scale，可选 */
  fromScale?: number
  /** to 系使用的目标 scale，可选 */
  toScale?: number
  /** from 系使用的起始 opacity，可选 */
  fromOpacity?: number
  /** to 系使用的目标 opacity，可选 */
  toOpacity?: number
}

export interface MotionTokensMap {
  heroTitle: MotionToken
  subhead: MotionToken
  entrySoft: MotionToken
  entryStrong: MotionToken
  fadeOnly: MotionToken
  fadeOnlyTight: MotionToken
  revealScroll: MotionToken
  leaveQuick: MotionToken
  enterPage: MotionToken
  hoverLift: MotionToken
  pressSquish: MotionToken
  /** stagger 步距，单位秒 */
  staggerCard: number
  staggerToc: number
  staggerHero: number
}

// ── Parsers（所有 parser 入口检查空串并 throw） ─────────────

function ensure(name: string, raw: string): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(`[anim] token not defined: ${name}`)
  }
  return raw.trim()
}

/** '480ms' / '0.5s' → number 秒 */
export function parseMs(name: string, raw: string): number {
  const s = ensure(name, raw)
  if (s.endsWith('ms')) return parseFloat(s) / 1000
  if (s.endsWith('s')) return parseFloat(s)
  return parseFloat(s) / 1000
}

/** '20px' / '14' → number */
export function parsePx(name: string, raw: string): number {
  const s = ensure(name, raw)
  return parseFloat(s.endsWith('px') ? s.slice(0, -2) : s)
}

/** '0.92' → number */
export function parseNum(name: string, raw: string): number {
  return parseFloat(ensure(name, raw))
}

/** 内部用：可选字段，容许空串返回 undefined */
function tryParsePx(name: string, raw: string): number | undefined {
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined
  try { return parsePx(name, raw) } catch { return undefined }
}

/** 内部用：可选字段，容许空串返回 undefined */
function tryParseNum(name: string, raw: string): number | undefined {
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined
  try { return parseNum(name, raw) } catch { return undefined }
}

// ── Singleton 缓存（spec §4.4.3：getComputedStyle 一次性 compute） ──

let cached: Readonly<MotionTokensMap> | undefined

/** 测试用：清除缓存 */
export function __resetMotionTokensCache(): void {
  cached = undefined
}

function loadTokens(): Readonly<MotionTokensMap> {
  if (cached) return cached
  const style = typeof window !== 'undefined'
    ? window.getComputedStyle(document.documentElement)
    : ({} as CSSStyleDeclaration)

  const eight = (name: string): MotionToken => {
    // Required fields - throw on missing
    const durationVal = parseMs(
      `--motion-${name}-duration`,
      style.getPropertyValue(`--motion-${name}-duration`),
    )
    const easeVal = ensure(
      `--motion-${name}-ease`,
      style.getPropertyValue(`--motion-${name}-ease`),
    )
    const fromYVal = parsePx(
      `--motion-${name}-from-y`,
      style.getPropertyValue(`--motion-${name}-from-y`),
    )
    // Optional fields - use tryParse for internal use (allows empty -> undefined)
    const toYVal = tryParsePx(
      `--motion-${name}-to-y`,
      style.getPropertyValue(`--motion-${name}-to-y`),
    )
    const fromScaleVal = tryParseNum(
      `--motion-${name}-from-scale`,
      style.getPropertyValue(`--motion-${name}-from-scale`),
    )
    const toScaleVal = tryParseNum(
      `--motion-${name}-to-scale`,
      style.getPropertyValue(`--motion-${name}-to-scale`),
    )
    const fromOpacityVal = tryParseNum(
      `--motion-${name}-from-opacity`,
      style.getPropertyValue(`--motion-${name}-from-opacity`),
    )
    const toOpacityVal = tryParseNum(
      `--motion-${name}-to-opacity`,
      style.getPropertyValue(`--motion-${name}-to-opacity`),
    )
    return {
      duration: durationVal,
      ease: easeVal,
      fromY: fromYVal ?? 0,
      toY: toYVal,
      fromScale: fromScaleVal,
      toScale: toScaleVal,
      fromOpacity: fromOpacityVal,
      toOpacity: toOpacityVal,
    }
  }

  const tokens: MotionTokensMap = {
    heroTitle: eight('hero-title'),
    subhead: eight('subhead'),
    entrySoft: eight('entry-soft'),
    entryStrong: eight('entry-strong'),
    fadeOnly: eight('fade-only'),
    fadeOnlyTight: eight('fade-only-tight'),
    revealScroll: eight('reveal-scroll'),
    leaveQuick: eight('leave-quick'),
    enterPage: eight('enter-page'),
    hoverLift: eight('hover-lift'),
    pressSquish: eight('press-squish'),
    staggerCard: parseMs('--motion-stagger-card', style.getPropertyValue('--motion-stagger-card')),
    staggerToc: parseMs('--motion-stagger-toc', style.getPropertyValue('--motion-stagger-toc')),
    staggerHero: parseMs('--motion-stagger-hero', style.getPropertyValue('--motion-stagger-hero')),
  }

  cached = Object.freeze(tokens) as Readonly<MotionTokensMap>
  return cached
}

/**
 * 返回 Readonly<Ref<MotionTokensMap>>。
 * SSR / 单测安全：jsdom 没有 getComputedStyle 时返回空 ref。
 */
export function useMotionTokens(): Readonly<Ref<MotionTokensMap>> {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return computed(() => ({} as MotionTokensMap)) as Readonly<Ref<MotionTokensMap>>
  }
  return computed(() => loadTokens()) as Readonly<Ref<MotionTokensMap>>
}