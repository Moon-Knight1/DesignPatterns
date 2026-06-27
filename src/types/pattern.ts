export type PatternCategory = 'creational' | 'structural' | 'behavioral'

export interface Pattern {
  slug: string
  titleZh: string
  titleEn: string
  category: PatternCategory
  summary: string
  order: number
}