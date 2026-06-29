# 解释器模式 (Interpreter Pattern) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把解释器模式作为第 23 个 GoF 模式加入 DesignPatterns 学习手册，覆盖现有乱码内容、解除数据层硬编码过滤、下载并黏土化本地图片。

**Architecture:** 解除 `src/data/markdown.ts` 中针对 interpreter 的硬编码过滤 → 注册 `patterns.ts` 元数据并调整 7 个 order → 下载 3 张远程图到 `imgs/interpreter/` → 添加 prose.css 黏土包装 → 重写 `theory/interpreter.md` 为 RefactoringGuru 风格 → 验证。TDD 优先：先反转现有 `tests/patterns.test.ts` 的"排除 interpreter"断言为"包含"，跑测试失败后再改实现。

**Tech Stack:** Vue 3.5 + Vite 5.4 + TypeScript 5.5 + Vitest 2.1 + markdown-it 14 + Vitest + jsdom

**Spec:** `docs/superpowers/specs/2026-06-29-interpreter-pattern-design.md`

---

## Global Constraints

- 项目使用 **hash 模式**路由（`createWebHashHistory`），新模式自动通过 `/pattern/interpreter` 路由
- 所有图片路径在 markdown 中必须用 `../imgs/<slug>/<file>` 形式，由 `useMarkdown.ts` 重写为 `{BASE_URL}imgs/<slug>/<file>`
- 所有模式元数据是单一事实来源：`src/data/patterns.ts`
- 类型严格模式（`strict` + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax`）；`import type` 需显式
- 组件 `<script setup lang="ts">`
- 路径别名 `@` → `src/`
- 样式值必须使用 `src/styles/tokens.css` 中的 CSS 变量
- 中文标点一致，全角中文逗号 `，` / 全角中文冒号 `：` / 全角空格视情况
- 提交策略：每完成一个独立可验证任务即提交一次
- 不要删除 `theory/` 下的 `.md` 或 `imgs/<slug>/` 下的图片而不更新 `patterns.ts`（当前是覆盖 `theory/interpreter.md`，因此需要同步注册）

---

## File Structure

| 文件 | 操作 | 职责 |
|---|---|---|
| `src/data/markdown.ts` | 修改 | 移除 interpreter 硬编码过滤；让所有 `theory/*.md` 自然注册 |
| `src/data/patterns.ts` | 修改 | 新增 interpreter 条目；7 个 order +1 |
| `theory/interpreter.md` | 覆盖 | 11 章节 RefactoringGuru 风格内容 |
| `imgs/interpreter/structure-zh.png` | 新增 | 结构图（从七七大 OSS 下载） |
| `imgs/interpreter/ast-zh.png` | 新增 | AST 示例图 |
| `imgs/interpreter/example-zh.png` | 新增 | 案例实现图 |
| `src/styles/prose.css` | 修改 | 新增 `.prose img[src*="imgs/interpreter/"]` 黏土包装 |
| `tests/patterns.test.ts` | 修改 | 断言 22→23；删除"excludes interpreter"；新增"includes interpreter at order 4"；分布 5/7/10→5/7/11；新增 chain 断言 |

---

## Task 1: 解除 `src/data/markdown.ts` 中的硬编码过滤

**Files:**
- Modify: `src/data/markdown.ts:21-26`

**Why first:** 这是数据层最深的过滤。`markdownBySlug` 暴露给所有 `useMarkdown` 调用方；如果不先解除，后续注册 patterns.ts 时理论内容仍然 404。属于"无回归风险"的任务（只是让现有 22 个 pattern 数据完全一致，多一个合法 entry）。

- [ ] **Step 1: 打开 `src/data/markdown.ts` 并定位硬编码过滤**

预期看到 21-26 行：

```ts
// Filter out the empty interpreter.md so the catalog shows 22 patterns.
export const markdownBySlug: Record<string, string> = Object.fromEntries(
  allEntries
    .filter(({ slug }) => slug !== 'interpreter')
    .map(({ slug, source }) => [slug, source])
)
```

- [ ] **Step 2: 用以下代码替换整段 22-26 行**

```ts
export const markdownBySlug: Record<string, string> = Object.fromEntries(
  allEntries.map(({ slug, source }) => [slug, source])
)
```

注意：删除 21 行的注释 "Filter out the empty interpreter.md so the catalog shows 22 patterns."，因为这个解释已不再成立。

- [ ] **Step 3: 跑测试，验证无回归**

Run: `npm run test`
Expected: 全部通过。注意：当前 `tests/patterns.test.ts` 不检查 `markdownBySlug`，所以这一步骤不会因新行为而失败，但能保证其他 22 个模式的 markdown 加载没被破坏。

- [ ] **Step 4: 跑 typecheck**

Run: `npm run typecheck`
Expected: 通过，无类型错误。

- [ ] **Step 5: 提交**

```bash
git add src/data/markdown.ts
git commit -m "refactor(markdown): remove hardcoded interpreter filter from markdownBySlug"
```

---

## Task 2: 反转 `tests/patterns.test.ts` 中"排除 interpreter"的断言

**Files:**
- Modify: `tests/patterns.test.ts`

**Why:** TDD 要求先写失败测试。把"excludes interpreter"和"22 patterns"两条断言改写成它们的反面，跑测试看到 8 个 fail，再进入 Task 3 改 `patterns.ts`。

- [ ] **Step 1: 打开 `tests/patterns.test.ts` 并修改以下 5 处断言**

完整替换文件内容（注意 import 不变，断言全改）：

```ts
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
```

修改点：
- 22 → 23（两处：行 13 和行 57）
- "excludes interpreter"（行 16-18）→ "includes interpreter at order 4 in behavioral category"
- "5/7/10"（行 26-28）→ "5/7/11"
- 新增 "chains interpreter between iterator and mediator" 整段
- 新增 "getPattern returns the interpreter pattern" 整段

- [ ] **Step 2: 跑测试，预期看到多个 FAIL**

Run: `npm run test -- tests/patterns.test.ts`
Expected: 大约 6 个 FAIL（22→23、interpreter 包含、interpreter 包含 5/7/11、interpreter chain 双向、getPattern('interpreter')、TOTAL_PATTERNS=23）。

- [ ] **Step 3: 提交失败测试**

```bash
git add tests/patterns.test.ts
git commit -m "test(patterns): invert exclusions; expect 23 patterns including interpreter"
```

---

## Task 3: 在 `src/data/patterns.ts` 中注册 interpreter 条目并调整 7 个 order

**Files:**
- Modify: `src/data/patterns.ts:20-30`

**Why:** 让 Task 2 的失败测试全部通过。这是"添加模式"的核心元数据变更。

- [ ] **Step 1: 打开 `src/data/patterns.ts` 并替换 20-30 行的行为型分组**

把：

```ts
  // 行为型 (Behavioral) — 10 patterns
  { slug: 'chain-of-responsibility', titleZh: '责任链模式', titleEn: 'Chain of Responsibility', category: 'behavioral', summary: '将请求沿处理链传递，直到有对象处理它为止。',         order: 1 },
  { slug: 'command',           titleZh: '命令模式',         titleEn: 'Command',            category: 'behavioral', summary: '将请求封装为对象，从而支持可撤销、可排队的操作。',       order: 2 },
  { slug: 'iterator',          titleZh: '迭代器模式',       titleEn: 'Iterator',           category: 'behavioral', summary: '提供一种方法顺序访问聚合对象中的元素，而不暴露其内部表示。', order: 3 },
  { slug: 'mediator',          titleZh: '中介者模式',       titleEn: 'Mediator',           category: 'behavioral', summary: '用一个中介对象封装一系列对象之间的交互。',               order: 4 },
  { slug: 'memento',           titleZh: '备忘录模式',       titleEn: 'Memento',            category: 'behavioral', summary: '在不破坏封装的前提下捕获对象的内部状态并保存。',         order: 5 },
  { slug: 'observer',          titleZh: '观察者模式',       titleEn: 'Observer',           category: 'behavioral', summary: '定义对象间一对多的依赖关系，状态变化时通知所有依赖者。', order: 6 },
  { slug: 'state',             titleZh: '状态模式',         titleEn: 'State',              category: 'behavioral', summary: '允许对象在其内部状态改变时改变其行为。',                 order: 7 },
  { slug: 'strategy',          titleZh: '策略模式',         titleEn: 'Strategy',           category: 'behavioral', summary: '定义一系列算法，将每个算法封装起来并使它们可互换。',     order: 8 },
  { slug: 'template-method',   titleZh: '模板方法模式',     titleEn: 'Template Method',    category: 'behavioral', summary: '在父类中定义算法骨架，将某些步骤延迟到子类实现。',       order: 9 },
  { slug: 'visitor',           titleZh: '访问者模式',       titleEn: 'Visitor',            category: 'behavioral', summary: '在不修改元素类的前提下为对象结构增加新操作。',           order: 10 },
```

替换为：

```ts
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
```

注意细节：
- 注释 "10 patterns" → "11 patterns"
- iterator order 保持 3
- 在 iterator 后插入 interpreter，order 4
- mediator 4 → 5，memento 5 → 6，observer 6 → 7，state 7 → 8，strategy 8 → 9，template-method 9 → 10，visitor 10 → 11
- 字段对齐：interpreter 行的字段长度需要与 sibling 行对齐（看 visitor 行的对齐宽度）

- [ ] **Step 2: 修改文件底部的注释（62 行）**

把：

```ts
// Linear chain across all 22 in category-then-order sequence (Creational 1→5, Structural 1→7, Behavioral 1→10)
```

替换为：

```ts
// Linear chain across all 23 in category-then-order sequence (Creational 1→5, Structural 1→7, Behavioral 1→11)
```

- [ ] **Step 3: 跑 patterns 测试，预期全过**

Run: `npm run test -- tests/patterns.test.ts`
Expected: Task 2 中所有 FAIL 全部转为 PASS。

- [ ] **Step 4: 跑全套测试，确认无回归**

Run: `npm run test`
Expected: 全部通过（useMarkdown.test.ts、useToc.test.ts 不受影响，但会一并跑过）。

- [ ] **Step 5: typecheck**

Run: `npm run typecheck`
Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add src/data/patterns.ts
git commit -m "feat(patterns): register interpreter pattern; shift 7 order fields"
```

---

## Task 4: 下载 3 张远程图到 `imgs/interpreter/`

**Files:**
- Create: `imgs/interpreter/structure-zh.png`
- Create: `imgs/interpreter/ast-zh.png`
- Create: `imgs/interpreter/example-zh.png`

**Why:** 图片是 markdown 内容的物理依赖。先下载避免后续 `theory/interpreter.md` 引用死链。Windows Git Bash 环境用 `curl` 下载到 `imgs/interpreter/`。

- [ ] **Step 1: 创建目录**

Run: `mkdir -p imgs/interpreter`
Expected: 命令静默成功（如目录已存在也无害）。

- [ ] **Step 2: 下载 3 张图**

Run:

```bash
curl -L -o imgs/interpreter/structure-zh.png "https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271806730.png"
curl -L -o imgs/interpreter/ast-zh.png "https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271807269.png"
curl -L -o imgs/interpreter/example-zh.png "https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271807077.png"
```

Expected: 三个文件创建成功。HTTP 状态码 200。如果某个 URL 已失效，临时记下"图片 X 下载失败，需手工准备"，但仍继续后续任务（理论稿可先不带图）。

- [ ] **Step 3: 验证文件**

Run: `ls -la imgs/interpreter/`
Expected: 看到 3 个 .png 文件，每个 > 5KB（不是 HTML 错误页）。

- [ ] **Step 4: 提交**

```bash
git add imgs/interpreter/
git commit -m "chore(imgs): download interpreter pattern diagrams from seven97"
```

---

## Task 5: 在 `src/styles/prose.css` 添加 interpreter 图片黏土包装

**Files:**
- Modify: `src/styles/prose.css:75-84`（在现有 `.prose img` 块之后）

**Why:** 全局 `.prose img` 已应用黏土阴影（`box-shadow: var(--shadow-clay-out)`），但 interpreter 图片想用更大的圆角和留白 padding 来呼应"模式示意图"的重要性。该 selector 只命中 `imgs/interpreter/` 下的图片，不影响其他 22 个模式。

- [ ] **Step 1: 打开 `src/styles/prose.css` 并定位现有 `.prose img` 块**

在第 84 行（`}` 结束 `.prose img` 之后）插入新规则。**不要修改现有 75-84 行的 `.prose img` 全局规则**。

- [ ] **Step 2: 插入新规则**

在 `.prose img` 块（行 84 `}`）之后、`.prose img.error-fallback`（行 86）之前，插入：

```css
/* Interpreter pattern diagrams use a softer, roomier clay card to
   distinguish them from inline illustrations in body text. Scoped to
   imgs/interpreter/ to avoid affecting other patterns. */
.prose img[src*="imgs/interpreter/"] {
  border-radius: var(--radius-card);
  background: #fff;
  padding: 12px;
  box-shadow: var(--shadow-clay-out);
}
```

- [ ] **Step 3: 验证 CSS 语法**

Run: `npm run build`
Expected: Vite 构建通过（CSS 解析无错）。如报错，按行号检查大括号/分号。

- [ ] **Step 4: 提交**

```bash
git add src/styles/prose.css
git commit -m "style(prose): clay wrapper for interpreter pattern images"
```

---

## Task 6: 覆盖 `theory/interpreter.md` 为 RefactoringGuru 风格

**Files:**
- Overwrite: `theory/interpreter.md`（现为乱码）

**Why:** 这是解释器模式的理论正文。必须覆盖现有乱码（疑似 Abstract Factory 早期文件编码错误），改为本站统一的 11 章节结构。

- [ ] **Step 1: 用 Write 工具覆盖 `theory/interpreter.md`**

写入以下完整内容（注意保留每段的中文标点 `，`/`：`/全角空格、章节空行符合 visitor.md 风格）：

```markdown
# 解释器模式

## 意图

**解释器模式**是一种行为设计模式， 它给定一种语言，定义它的文法的一种表示， 并定义一个解释器， 这个解释器使用该表示来解释语言中的句子。

![解释器设计模式](../imgs/interpreter/structure-zh.png)

## 问题

假如你开发了一款简单的计算器程序， 它需要解析诸如 `1+2+3-4` 这样的算术表达式。 一个常见做法是， 你为每一种运算都写一个工具方法—— `add()`、`minus()` 等等。 当表达式越来越复杂时（加入 `*`、`/`、括号、不同优先级）， 工具方法会迅速膨胀， 而且彼此之间还会纠缠不清。

更进一步， 如果你打算让用户能自定义变量——例如 `a + b * 2`——那么问题就更棘手了： 你需要为每一种变量、每一种组合都做特殊处理。 当文法变复杂时， 工具方法这条路会很快走到尽头。

## 解决方案

解释器模式建议将**运算符**和**数字**都看成一种"节点"， 逐个节点地进行解析与计算。 当你把算式抽象为一种"小语言"后， 就可以构造一棵**抽象语法树（AST）** 来表示它， 并让解释器递归地遍历这棵树， 得出最终结果。

举例来说， 表达式 `1 + 2 - 3 + 4` 可以被表示成如下一棵抽象语法树：

![抽象语法树示例](../imgs/interpreter/ast-zh.png)

树上的每个节点都对应一种语法结构： 数字是叶子节点， `+`、`-` 等运算符是中间节点（它们有左右两个子节点）。 解释器只需要在每个节点上执行相同的 `interpret()` 方法， 由节点自己决定是返回一个数值（终结符）还是把左右子树的解释结果合起来（非终结符）。

这种"递归 + 抽象语法树"的做法看似朴实， 实际上**几乎所有编译器**都在用： 解析源代码 → 构造 AST → 解释或编译执行。 解释器模式让我们能够为一种自定义的小语言， 用 OO 的方式去实现同样的过程。

## 真实世界类比

![音乐家与乐谱](../imgs/interpreter/example-zh.png)

想象一位钢琴演奏者正在读谱演奏。 乐谱定义了"音乐语言"的文法： 音符是高音还是低音、 节拍是 4/4 还是 3/4、 哪些小节要渐强。 演奏者本人就是"解释器"—— 他把乐谱这种**静态表示**实时翻译成**实际的声音**。

- 乐谱 = 文法表示（语法规则 + 抽象语法树）
- 演奏者 = 解释器（解释器对象）
- 实际演奏 = 解释结果

## 解释器模式结构

- 

**抽象表达式**（`Abstract Expression`） 声明 `interpret(Context)` 方法。 所有节点都要实现它。

- 

**终结符表达式**（`Terminal Expression`） 是抽象表达式的子类， 表示文法中的最小单元。 例如数字、变量。 它们直接返回自己的字面值， 不再递归。

- 

**非终结符表达式**（`Nonterminal Expression`） 也是抽象表达式的子类， 表示文法中的复合规则。 例如 `+`、`-`、`*`、`/` 运算符。 它们通常持有左右两个子表达式， 在 `interpret()` 中先递归解释子树， 再把结果按规则合起来。

- 

**上下文**（`Context`） 保存所有解释器共享的数据。 在最简形式中， 它就是一个"变量名 → 数值"的映射表； 但你也可以加入作用域、类型、调试钩子等。

- 

**客户端**（`Client`） 构建（手工或借助解析器）一棵抽象语法树， 然后在根节点上调 `interpret(Context)` 即可得到最终结果。

## 伪代码

下面以一个极简的"加减法计算器"为例， 演示解释器模式的核心结构。

```
// 抽象表达式：所有节点都要实现 interpret(Context)
interface AbstractExpression is
    method interpret(Context context): Number

// 终结符：数字字面值
class Number implements AbstractExpression is
    field value: Number
    constructor Number(value) is
        this.value = value
    method interpret(context): Number is
        return value  // 数字直接返回

// 终结符：变量（从 Context 里查值）
class Variable implements AbstractExpression is
    field name: String
    constructor Variable(name) is
        this.name = name
    method interpret(context): Number is
        return context.get(name)

// 非终结符：加法
class Plus implements AbstractExpression is
    field left: AbstractExpression
    field right: AbstractExpression
    constructor Plus(left, right) is
        this.left = left
        this.right = right
    method interpret(context): Number is
        return left.interpret(context) + right.interpret(context)

// 非终结符：减法
class Minus implements AbstractExpression is
    field left: AbstractExpression
    field right: AbstractExpression
    constructor Minus(left, right) is
        this.left = left
        this.right = right
    method interpret(context): Number is
        return left.interpret(context) - right.interpret(context)

// 上下文：保存"变量名 → 数值"映射
class Context is
    private map: Map<String, Number>
    method assign(name, value) is
        map.put(name, value)
    method get(name): Number is
        return map.get(name)

// 客户端：手工构造 AST 并求值
context = new Context()
context.assign("a", 1)
context.assign("b", 2)
context.assign("c", 4)

// 表达式: (a + b) * (c - a)
expr = new Plus(
    new Variable("a"),
    new Minus(new Variable("c"), new Variable("a"))
)
result = expr.interpret(context)  // = 1 + (4 - 1) = 4
```

## 解释器模式适合应用场景

- 当一种**语言**需要被解释执行， 并且你能把语言中的句子表示为**抽象语法树**时。
- 当文法**比较简单**时。 对于复杂的文法， 类的数量会急剧膨胀， 维护成本反而超过收益。
- 当**执行效率不是关键瓶颈**时。 解释器模式依赖大量递归与小对象， 比专用编译器慢得多。
- 当问题**重复出现**， 且可以用一种**简单的语言**来表达时。 例如规则引擎、表达式求值、DSL（领域特定语言）、正则引擎等。

## 实现方式

- 

声明 `Abstract Expression` 接口， 约定一个 `interpret(Context): Result` 方法。 这里的 `Result` 一般是某种数值或对象， 根据你的语言决定。

- 

对文法中的每个终结符（数字、变量、关键字）实现一个 `Terminal Expression`。 它们通常在构造时拿到字面值， `interpret` 时**直接返回**或去 Context 里查。

- 

对文法中的每条规则（`+`、`-`、`if-then-else` 等）实现一个 `Nonterminal Expression`。 它们在构造时拿到**子表达式引用**， `interpret` 时**先递归解释子树**， 再按规则合并。

- 

实现 `Context` 类， 提供"共享状态"接口。 最简形式是 `Map<String, Value>`； 复杂场景可以加入作用域栈、调试钩子、类型检查等。

- 

**客户端负责构造 AST**。 你可以选择： ① 客户端代码手工 new 节点（最简）； ② 写一个独立的**解析器**（parser）把字符串文法转成 AST（更通用， 但工作量更大）。

- 

在 AST 根节点上调用 `interpret(Context)`， 让递归自动展开。

## 解释器模式优缺点

-  *易于改变和扩展文法*。 你可以通过继承 `Abstract Expression` 来定义新的规则， 几乎不改动既有代码。
-  *易于实现文法*。 每种节点类（终结符 / 非终结符）的实现套路非常相似。
-  符合 *开闭原则*。 新增一种节点或新规则时， 既有节点类无需修改。

-  对于**复杂文法**会导致**类数量爆炸**。 每条规则至少对应一个类， 几十条规则的项目会非常笨重。
-  执行**效率较低**。 大量递归调用 + 大量小对象， 比直接 `eval()` 或专用编译器慢得多。

## 与其他模式的关系

- **复合模式**（Composite） 是解释器模式的**底层骨架**。 抽象语法树本身就是一棵组合树， 非终结符节点和终结符节点共享同一个 `Abstract Expression` 父类， 才能用统一的 `interpret()` 递归调用。
- **访问者模式**（Visitor） 经常被用来**增强解释器**： 当你不想在 `interpret()` 里堆一堆 `if-else` 处理不同节点类型时， 可以让 visitor 接管"对 AST 做什么"的部分（类型检查、代码生成、优化等）， 节点本身只负责结构。
- **享元模式**（Flyweight） 可以在**终结符节点**上共享字面值相同的实例（所有 `Number(2)` 共用一个对象）， 节省大量内存。
- **迭代器模式**（Iterator） 经常用于**遍历 AST 的子节点列表**， 配合 visitor 使用。
- **状态模式**（State） 与解释器模式共享"用对象表示上下文"的思路， 但前者强调"对象内部状态决定行为"， 后者强调"用对象表示语法结构"。

## 代码示例

下面给出一个**完整可运行**的 Java 实现（基于七七大示例的 Java 风格改写， 保留核心逻辑与中文注释）。

```java
import java.util.HashMap;
import java.util.Map;

/**
 * 抽象表达式：所有节点都必须实现 interpret(Context)
 */
interface AbstractExpression {
    int interpret(Context context);
}

/**
 * 终结符：数字字面值
 */
class Number implements AbstractExpression {
    private final int value;
    public Number(int value) { this.value = value; }
    @Override public int interpret(Context context) { return value; }
}

/**
 * 终结符：变量
 */
class Variable implements AbstractExpression {
    private final String name;
    public Variable(String name) { this.name = name; }
    @Override public int interpret(Context context) {
        Integer v = context.get(name);
        if (v == null) throw new RuntimeException("未定义变量: " + name);
        return v;
    }
    @Override public String toString() { return name; }
}

/**
 * 非终结符：加法
 */
class Plus implements AbstractExpression {
    private final AbstractExpression left;
    private final AbstractExpression right;
    public Plus(AbstractExpression left, AbstractExpression right) {
        this.left = left; this.right = right;
    }
    @Override public int interpret(Context context) {
        return left.interpret(context) + right.interpret(context);
    }
    @Override public String toString() { return "(" + left + " + " + right + ")"; }
}

/**
 * 非终结符：减法
 */
class Minus implements AbstractExpression {
    private final AbstractExpression left;
    private final AbstractExpression right;
    public Minus(AbstractExpression left, AbstractExpression right) {
        this.left = left; this.right = right;
    }
    @Override public int interpret(Context context) {
        return left.interpret(context) - right.interpret(context);
    }
    @Override public String toString() { return "(" + left + " - " + right + ")"; }
}

/**
 * 上下文：保存"变量名 → 数值"映射
 */
class Context {
    private final Map<String, Integer> map = new HashMap<>();
    public void assign(String name, int value) { map.put(name, value); }
    public Integer get(String name) { return map.get(name); }
}

/**
 * 客户端：手工构造 AST 并求值
 */
public class InterpreterDemo {
    public static void main(String[] args) {
        Context context = new Context();
        context.assign("a", 1);
        context.assign("b", 2);
        context.assign("c", 4);

        // 表达式: a + (c - a)  →  1 + (4 - 1) = 4
        AbstractExpression expr = new Plus(
            new Variable("a"),
            new Minus(new Variable("c"), new Variable("a"))
        );

        System.out.println(expr + " = " + expr.interpret(context));
        // 输出: (a + (c - a)) = 4
    }
}
```

## 额外内容

- 解释器模式**几乎从来不是首选**。 当文法变复杂时， 维护成本会远超收益。 实际工程里， 你更可能用 ANTLR、JavaCC 这样的**解析器生成器**来自动构造 AST， 再写 visitor 解释。
- 当你只想"动态求值"一个小表达式时， 很多语言自带 `eval()` 或表达式库（如 Java 的 SpEL、JavaScript 的 `eval()`）， 没必要为它专门实现解释器模式。
```

**注意**：内容末尾留一个空行（与 visitor.md 风格一致）。

- [ ] **Step 2: 验证 build 通过（markdown 解析无错）**

Run: `npm run build`
Expected: 通过。`import.meta.glob` 在构建时把 `theory/interpreter.md` 打包进 `markdownBySlug['interpreter']`，markdown-it 渲染无报错。

- [ ] **Step 3: 验证测试仍然全过**

Run: `npm run test`
Expected: 全部通过。

- [ ] **Step 4: 提交**

```bash
git add theory/interpreter.md
git commit -m "docs(theory): rewrite interpreter pattern in RefactoringGuru style"
```

---

## Task 7: 最终端到端验证

**Files:** （仅验证，不修改文件）

**Why:** 综合所有 6 个任务的变更， 跑 build + test + 关键回归 grep + 手动 smoke， 确认设计稿 §6 验证方式全部满足。

- [ ] **Step 1: 跑 build**

Run: `npm run build`
Expected: 通过。`dist/` 产物生成。

- [ ] **Step 2: 跑全套测试**

Run: `npm run test`
Expected: 全部通过。`tests/patterns.test.ts` 中所有 23 patterns 相关断言全过；`tests/useMarkdown.test.ts` 现有 8 个用例仍然全过（图片路径重写逻辑未被破坏）。

- [ ] **Step 3: 关键回归检查（spec §6）**

Run:

```bash
grep -rn "slug !== 'interpreter'" src/ || echo "PASS: no hardcoded interpreter filter"
grep -rn "excludes interpreter" tests/ || echo "PASS: no obsolete exclusion test"
```

Expected: 两个 echo 都打印（说明 grep 无匹配）。如有匹配，**不要提交** — 回去检查 Task 1 / Task 2 是否漏改。

- [ ] **Step 4: 验证 `markdownBySlug['interpreter']` 非空**

Run: `npm run dev`（后台启动 dev server），然后在浏览器 DevTools Console 执行：

```js
const m = await import('/src/data/markdown.ts')
console.log(m.markdownBySlug.interpreter?.slice(0, 30))
```

Expected: 输出 `# 解释器模式`（或前 30 字符包含此字符串）。如为 `undefined`，**停止**：Task 1 / Task 6 之一未完成。验证后用 `TaskStop` 关闭 dev server。

- [ ] **Step 5: 手动 smoke test**

Run: `npm run dev`
Expected: Vite dev server 启动。 浏览器访问 `http://localhost:5173/#/pattern/interpreter`， 确认：

- 标题渲染"解释器模式"
- 11 章节（意图/问题/解决方案/真实世界类比/解释器模式结构/伪代码/适合应用场景/实现方式/优缺点/与其他模式的关系/代码示例）全部可见
- 3 张图片正常显示， 带圆角白底黏土阴影
- TOC 正确生成（不出现"段落分隔"导致的 h2 污染， 这正是 `useMarkdown.ts` 预处理要解决的）
- 底部"上一篇"链接到 `/#/pattern/iterator`， "下一篇"链接到 `/#/pattern/mediator`
- 首页行为型分类下能看到 11 张卡片， 解释器位于迭代器与中介者之间

- [ ] **Step 6: 检查 git 历史**

Run: `git log --oneline -8`
Expected: 看到 6 个 commit（Task 1-6 各一个）， 主题清晰、 各自独立。

- [ ] **Step 7: 收尾（无需 commit， 仅口头确认）**

确认 Task 6 中 7 个 commit 全部 push 到 main 后， GitHub Actions `deploy.yml` 会自动 build + deploy 到 GitHub Pages， `https://moon-knight1.github.io/DesignPatterns/#/pattern/interpreter` 上线。
```

---

## Self-Review Notes

**Spec coverage**:
- §1 背景与现状 → Task 1 (markdown.ts) + Task 2-3 (patterns.ts)
- §2 设计目标 → 全文 6 个 Task 合力
- §3.1 理论稿风格 → Task 6
- §3.2 章节结构（11 章节）→ Task 6 完整对应
- §3.3 图片（3 张 + 黏土包装）→ Task 4 + Task 5
- §4 元数据注册 → Task 2-3
- §5 影响的文件清单 → 7 个 Task 全部对应
- §6 验证方式 → Task 7（build/test/grep/smoke/log）

**Placeholder scan**: 无 "TBD" / "TODO" / "implement later"。

**Type consistency**: `interpreter` slug 在 Task 2（断言）、Task 3（注册）、Task 4（imgs 路径）、Task 5（CSS selector）、Task 6（md 引用）一致。
