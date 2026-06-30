import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'

describe('useReducedMotion', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let mql: { matches: boolean; addEventListener: any; removeEventListener: any }

  beforeEach(() => {
    listeners = []
    mql = {
      matches: false,
      addEventListener: vi.fn((_evt: string, cb: (e: any) => void) => {
        listeners.push(cb)
      }),
      removeEventListener: vi.fn((_evt: string, cb: (e: any) => void) => {
        listeners = listeners.filter(l => l !== cb)
      }),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => mql))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns ref false when matchMedia.matches === false', async () => {
    const { useReducedMotion } = await import('@/composables/useReducedMotion')
    const rm = useReducedMotion()
    expect(rm.value).toBe(false)
  })

  it('returns ref true when matchMedia.matches === true', async () => {
    mql.matches = true
    const { useReducedMotion } = await import('@/composables/useReducedMotion')
    const rm = useReducedMotion()
    expect(rm.value).toBe(true)
  })

  it('updates reactively on matchMedia change event', async () => {
    const { useReducedMotion } = await import('@/composables/useReducedMotion')
    const rm = useReducedMotion()
    expect(rm.value).toBe(false)
    // 模拟系统切换
    listeners[0]({ matches: true } as MediaQueryListEvent)
    await nextTick()
    expect(rm.value).toBe(true)
  })

  it('falls back to ref(false) if matchMedia unsupported', async () => {
    vi.stubGlobal('matchMedia', undefined as any)
    const { useReducedMotion } = await import('@/composables/useReducedMotion')
    const rm = useReducedMotion()
    expect(rm.value).toBe(false)
  })
})