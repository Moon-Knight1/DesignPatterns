import { describe, it, expect } from 'vitest'
import {
  patterns,
  categories,
  getPattern,
  getPrev,
  getNext,
  TOTAL_PATTERNS,
} from '@/data/patterns'

describe('patterns manifest', () => {
  it('contains exactly 23 patterns', () => {
    expect(patterns.length).toBe(23)
  })

  it('includes interpreter at order 4 in behavioral category', () => {
    const interp = patterns.find((p) => p.slug === 'interpreter')
    expect(interp).toBeDefined()
    expect(interp?.category).toBe('behavioral')
    expect(interp?.order).toBe(4)
    expect(interp?.titleZh).toBe('解释器模式')
    expect(interp?.titleEn).toBe('Interpreter')
  })

  it('has unique slugs', () => {
    const slugs = patterns.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('distributes 5/7/11 across categories', () => {
    expect(categories.creational.items.length).toBe(5)
    expect(categories.structural.items.length).toBe(7)
    expect(categories.behavioral.items.length).toBe(11)
  })

  it('orders items within each category', () => {
    for (const cat of Object.values(categories)) {
      const orders = cat.items.map((p) => p.order)
      const sorted = [...orders].sort((a, b) => a - b)
      expect(orders).toEqual(sorted)
    }
  })

  it('first pattern is singleton, last is visitor', () => {
    const first = getPrev('singleton')
    const last = getNext('visitor')
    expect(first).toBeNull()
    expect(last).toBeNull()
  })

  it('chains correctly between categories', () => {
    // Last creational → first structural
    expect(getNext('abstract-factory')?.slug).toBe('builder')      // within creational
    expect(getNext('prototype')?.slug).toBe('adapter')              // last creational → first structural
    expect(getNext('proxy')?.slug).toBe('chain-of-responsibility')  // last structural → first behavioral
  })

  it('chains interpreter between iterator and mediator', () => {
    // Behavioral chain around the new pattern
    expect(getNext('iterator')?.slug).toBe('interpreter')          // before interpreter
    expect(getNext('interpreter')?.slug).toBe('mediator')          // after interpreter
    expect(getPrev('mediator')?.slug).toBe('interpreter')          // reverse direction
  })

  it('getPattern returns the interpreter pattern', () => {
    const p = getPattern('interpreter')
    expect(p?.slug).toBe('interpreter')
    expect(p?.titleEn).toBe('Interpreter')
  })

  it('getPattern returns undefined for unknown slug', () => {
    expect(getPattern('not-a-pattern')).toBeUndefined()
  })

  it('TOTAL_PATTERNS equals 23', () => {
    expect(TOTAL_PATTERNS).toBe(23)
  })
})