import { describe, it, expect, afterEach, vi } from 'vitest'

// 帮助函数：mock getComputedStyle 返回指定变量集
function mockComputedStyle(map: Record<string, string>) {
  // 确保 window.getComputedStyle 存在
  if (typeof window.getComputedStyle !== 'function') {
    (window as any).getComputedStyle = () => ({})
  }
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => map[name] ?? '',
  } as CSSStyleDeclaration)
}

const FULL_MAP = {
  '--motion-hero-title-duration': '600ms',
  '--motion-hero-title-from-y': '16px',
  '--motion-hero-title-from-opacity': '0',
  '--motion-hero-title-ease': 'power2.out',
  '--motion-subhead-duration': '380ms',
  '--motion-subhead-from-y': '12px',
  '--motion-subhead-from-opacity': '0',
  '--motion-subhead-ease': 'back.out(1.4)',
  '--motion-entry-soft-duration': '480ms',
  '--motion-entry-soft-from-y': '20px',
  '--motion-entry-soft-from-scale': '0.92',
  '--motion-entry-soft-from-opacity': '0',
  '--motion-entry-soft-ease': 'back.out(1.4)',
  '--motion-entry-strong-duration': '520ms',
  '--motion-entry-strong-from-y': '8px',
  '--motion-entry-strong-from-scale': '0.92',
  '--motion-entry-strong-from-opacity': '0',
  '--motion-entry-strong-ease': 'back.out(1.6)',
  '--motion-fade-only-duration': '360ms',
  '--motion-fade-only-from-y': '12px',
  '--motion-fade-only-from-opacity': '0',
  '--motion-fade-only-ease': 'power2.out',
  '--motion-fade-only-tight-duration': '360ms',
  '--motion-fade-only-tight-from-y': '8px',
  '--motion-fade-only-tight-from-opacity': '0',
  '--motion-fade-only-tight-ease': 'power2.out',
  '--motion-reveal-scroll-duration': '420ms',
  '--motion-reveal-scroll-from-y': '18px',
  '--motion-reveal-scroll-from-opacity': '0',
  '--motion-reveal-scroll-ease': 'back.out(1.4)',
  '--motion-leave-quick-duration': '200ms',
  '--motion-leave-quick-from-y': '0',
  '--motion-leave-quick-from-scale': '1',
  '--motion-leave-quick-from-opacity': '1',
  '--motion-leave-quick-to-y': '-10px',
  '--motion-leave-quick-to-opacity': '0',
  '--motion-leave-quick-ease': 'power2.in',
  '--motion-enter-page-duration': '340ms',
  '--motion-enter-page-from-y': '14px',
  '--motion-enter-page-from-scale': '0.96',
  '--motion-enter-page-from-opacity': '0',
  '--motion-enter-page-to-y': '0',
  '--motion-enter-page-to-scale': '1',
  '--motion-enter-page-to-opacity': '1',
  '--motion-enter-page-ease': 'back.out(1.1)',
  '--motion-hover-lift-duration': '300ms',
  '--motion-hover-lift-from-y': '0',
  '--motion-hover-lift-from-scale': '1',
  '--motion-hover-lift-from-opacity': '1',
  '--motion-hover-lift-to-y': '-4px',
  '--motion-hover-lift-to-scale': '1.02',
  '--motion-hover-lift-to-opacity': '1',
  '--motion-hover-lift-ease': 'back.out(1.2)',
  '--motion-press-squish-duration': '200ms',
  '--motion-press-squish-from-y': '0',
  '--motion-press-squish-from-scale': '0.94',
  '--motion-press-squish-from-opacity': '1',
  '--motion-press-squish-to-y': '0',
  '--motion-press-squish-to-scale': '1',
  '--motion-press-squish-to-opacity': '1',
  '--motion-press-squish-ease': 'power3.out',
  '--motion-stagger-card': '50ms',
  '--motion-stagger-toc': '40ms',
  '--motion-stagger-hero': '110ms',
}

describe('useMotionTokens', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    // Clear singleton cache between tests
    const { __resetMotionTokensCache } = await import('@/composables/useMotionTokens')
    __resetMotionTokensCache()
  })

  it('parses hero-title from CSS variables (all four fields)', async () => {
    mockComputedStyle(FULL_MAP)
    const { useMotionTokens } = await import('@/composables/useMotionTokens')
    const t = useMotionTokens().value.heroTitle
    expect(t.duration).toBe(0.6)
    expect(t.fromY).toBe(16)
    expect(t.fromOpacity).toBe(0)
    expect(t.ease).toBe('power2.out')
  })

  it('parses enter-page from-to both ends', async () => {
    mockComputedStyle(FULL_MAP)
    const { useMotionTokens } = await import('@/composables/useMotionTokens')
    const t = useMotionTokens().value.enterPage
    expect(t.fromY).toBe(14)
    expect(t.fromScale).toBe(0.96)
    expect(t.toY).toBe(0)
    expect(t.toScale).toBe(1)
  })

  it('parses stagger values into seconds', async () => {
    mockComputedStyle(FULL_MAP)
    const { useMotionTokens } = await import('@/composables/useMotionTokens')
    const t = useMotionTokens().value
    expect(t.staggerCard).toBe(0.05)
    expect(t.staggerToc).toBe(0.04)
    expect(t.staggerHero).toBe(0.11)
  })

  it('throws [anim] token not defined when a variable is missing', async () => {
    const partial = { ...FULL_MAP }
    delete (partial as any)['--motion-hero-title-duration']
    mockComputedStyle(partial)
    const { useMotionTokens } = await import('@/composables/useMotionTokens')
    expect(() => useMotionTokens().value).toThrow(
      /\[anim\] token not defined: --motion-hero-title-duration/,
    )
  })

  it('parseMs/parsePx/parseNum throw on empty string', async () => {
    mockComputedStyle({} as any)
    const { parseMs, parsePx, parseNum } = await import('@/composables/useMotionTokens')
    expect(() => parseMs('--test', '')).toThrow(/token not defined/)
    expect(() => parsePx('--test', '')).toThrow(/token not defined/)
    expect(() => parseNum('--test', '')).toThrow(/token not defined/)
  })
})