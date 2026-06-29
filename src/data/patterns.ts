import type { Pattern, PatternCategory } from '@/types/pattern'

export const patterns: Pattern[] = [
  // 创建型 (Creational) — 5 patterns
  { slug: 'singleton',         titleZh: '单例模式',         titleEn: 'Singleton',          category: 'creational', summary: '保证一个类只有一个实例，并提供全局访问节点。',           order: 1 },
  { slug: 'factory-method',    titleZh: '工厂方法模式',     titleEn: 'Factory Method',     category: 'creational', summary: '将对象创建的逻辑延迟到子类决定具体实例化哪个类。',     order: 2 },
  { slug: 'abstract-factory',  titleZh: '抽象工厂模式',     titleEn: 'Abstract Factory',   category: 'creational', summary: '提供一个创建一系列相关对象的接口，无需指定具体类。',     order: 3 },
  { slug: 'builder',           titleZh: '建造者模式',       titleEn: 'Builder',            category: 'creational', summary: '将复杂对象的构建过程与其表示分离，使同样的构建可创建不同表示。', order: 4 },
  { slug: 'prototype',         titleZh: '原型模式',         titleEn: 'Prototype',          category: 'creational', summary: '通过复制现有对象来创建新对象，而非通过 new 实例化。',   order: 5 },

  // 结构型 (Structural) — 7 patterns
  { slug: 'adapter',           titleZh: '适配器模式',       titleEn: 'Adapter',            category: 'structural', summary: '将一个类的接口转换成客户端期望的另一种接口。',           order: 1 },
  { slug: 'bridge',            titleZh: '桥接模式',         titleEn: 'Bridge',             category: 'structural', summary: '将抽象与实现分离使二者可以独立变化。',                 order: 2 },
  { slug: 'composite',         titleZh: '组合模式',         titleEn: 'Composite',          category: 'structural', summary: '将对象组合成树形结构以表示部分-整体的层次结构。',       order: 3 },
  { slug: 'decorator',         titleZh: '装饰模式',         titleEn: 'Decorator',          category: 'structural', summary: '动态地给对象添加职责，比继承更灵活。',                   order: 4 },
  { slug: 'facade',            titleZh: '外观模式',         titleEn: 'Facade',             category: 'structural', summary: '为子系统中的一组接口提供一个统一的高层接口。',           order: 5 },
  { slug: 'flyweight',         titleZh: '享元模式',         titleEn: 'Flyweight',          category: 'structural', summary: '通过共享技术有效支持大量细粒度对象的复用。',             order: 6 },
  { slug: 'proxy',             titleZh: '代理模式',         titleEn: 'Proxy',              category: 'structural', summary: '为其他对象提供一种代理以控制对这个对象的访问。',         order: 7 },

  // 行为型 (Behavioral) — 11 patterns
  { slug: 'chain-of-responsibility', titleZh: '责任链模式', titleEn: 'Chain of Responsibility', category: 'behavioral', summary: '将请求沿处理链传递，直到有对象处理它为止。',         order: 1 },
  { slug: 'command',           titleZh: '命令模式',         titleEn: 'Command',            category: 'behavioral', summary: '将请求封装为对象，从而支持可撤销、可排队的操作。',       order: 2 },
  { slug: 'iterator',          titleZh: '迭代器模式',       titleEn: 'Iterator',           category: 'behavioral', summary: '提供一种方法顺序访问聚合对象中的元素，而不暴露其内部表示。', order: 3 },
  { slug: 'interpreter',       titleZh: '解释器模式',       titleEn: 'Interpreter',        category: 'behavioral', summary: '给定一种语言，定义它的文法表示，并提供一个解释器来解释语言中的句子。', order: 4 },
  { slug: 'mediator',          titleZh: '中介者模式',       titleEn: 'Mediator',           category: 'behavioral', summary: '用一个中介对象封装一系列对象之间的交互。',               order: 5 },
  { slug: 'memento',           titleZh: '备忘录模式',       titleEn: 'Memento',            category: 'behavioral', summary: '在不破坏封装的前提下捕获对象的内部状态并保存。',         order: 6 },
  { slug: 'observer',          titleZh: '观察者模式',       titleEn: 'Observer',           category: 'behavioral', summary: '定义对象间一对多的依赖关系，状态变化时通知所有依赖者。', order: 7 },
  { slug: 'state',             titleZh: '状态模式',         titleEn: 'State',              category: 'behavioral', summary: '允许对象在其内部状态改变时改变其行为。',                 order: 8 },
  { slug: 'strategy',          titleZh: '策略模式',         titleEn: 'Strategy',           category: 'behavioral', summary: '定义一系列算法，将每个算法封装起来并使它们可互换。',     order: 9 },
  { slug: 'template-method',   titleZh: '模板方法模式',     titleEn: 'Template Method',    category: 'behavioral', summary: '在父类中定义算法骨架，将某些步骤延迟到子类实现。',       order: 10 },
  { slug: 'visitor',           titleZh: '访问者模式',       titleEn: 'Visitor',            category: 'behavioral', summary: '在不修改元素类的前提下为对象结构增加新操作。',           order: 11 },
]

export interface CategoryMeta {
  zh: string
  color: string
  icon: 'PackagePlus' | 'Blocks' | 'Workflow'
  items: Pattern[]
}

export const categories: Record<PatternCategory, CategoryMeta> = {
  creational: {
    zh: '创建型',
    color: 'var(--cat-creational)',
    icon: 'PackagePlus',
    items: patterns.filter((p) => p.category === 'creational').sort((a, b) => a.order - b.order),
  },
  structural: {
    zh: '结构型',
    color: 'var(--cat-structural)',
    icon: 'Blocks',
    items: patterns.filter((p) => p.category === 'structural').sort((a, b) => a.order - b.order),
  },
  behavioral: {
    zh: '行为型',
    color: 'var(--cat-behavioral)',
    icon: 'Workflow',
    items: patterns.filter((p) => p.category === 'behavioral').sort((a, b) => a.order - b.order),
  },
}

// Linear chain across all 23 in category-then-order sequence (Creational 1→5, Structural 1→7, Behavioral 1→11)
const chain: Pattern[] = [
  ...categories.creational.items,
  ...categories.structural.items,
  ...categories.behavioral.items,
]

const bySlug = new Map(chain.map((p) => [p.slug, p]))

export function getPattern(slug: string): Pattern | undefined {
  return bySlug.get(slug)
}

export function getPrev(slug: string): Pattern | null {
  const idx = chain.findIndex((p) => p.slug === slug)
  if (idx <= 0) return null
  return chain[idx - 1]
}

export function getNext(slug: string): Pattern | null {
  const idx = chain.findIndex((p) => p.slug === slug)
  if (idx < 0 || idx >= chain.length - 1) return null
  return chain[idx + 1]
}

export const TOTAL_PATTERNS = chain.length