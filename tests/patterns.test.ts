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
  it('contains exactly 22 patterns', () => {
    expect(patterns.length).toBe(22)
  })

  it('excludes interpreter', () => {
    expect(patterns.find((p) => p.slug === 'interpreter')).toBeUndefined()
  })

  it('has unique slugs', () => {
    const slugs = patterns.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('distributes 5/7/10 across categories', () => {
    expect(categories.creational.items.length).toBe(5)
    expect(categories.structural.items.length).toBe(7)
    expect(categories.behavioral.items.length).toBe(10)
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
    const factoryMethod = getPattern('factory-method')
    const abstractFactory = getPattern('abstract-factory')
    expect(getNext('abstract-factory')?.slug).toBe('builder')      // within creational
    expect(getNext('prototype')?.slug).toBe('adapter')              // last creational → first structural
    expect(getNext('proxy')?.slug).toBe('chain-of-responsibility')  // last structural → first behavioral
  })

  it('getPattern returns undefined for unknown slug', () => {
    expect(getPattern('not-a-pattern')).toBeUndefined()
  })

  it('TOTAL_PATTERNS equals 22', () => {
    expect(TOTAL_PATTERNS).toBe(22)
  })
})