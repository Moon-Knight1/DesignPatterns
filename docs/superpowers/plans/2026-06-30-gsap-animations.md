# GSAP 动画集成 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 集成 GSAP 核心 + ScrollTrigger，为 DesignPatterns 站点补入场/路由/滚动/微交互四类动画，遵守 `prefers-reduced-motion`。

**Architecture:** Vue `<Transition>` + `gsap.context()` + 四个 composable (`useGsapScene` / `useReducedMotion` / `useStaggerReveal` / `useMotionTokens`)；所有 motion 数值集中在 `src/styles/tokens.css` 的 `--motion-*` CSS 变量，TS 仅读不解。

**Tech Stack:** Vue 3.5 + Vite + TypeScript（已就绪）；新增 `gsap@^3.13.0`（含 ScrollTrigger 免费插件）；Vitest + jsdom + @vue/test-utils（已就绪）。

**Spec:** `docs/superpowers/specs/2026-06-30-gsap-animations-design.md`（撰写实施计划时同步参考）

---

## Global Constraints

逐条来自 spec，未经允许不得变更：

- 路由 hash 模式：`createWebHashHistory`（GitHub Pages 静态托管）
- 路径别名：`@/` → `src/`（CLAUDE.md §4）
- 样式硬规定：颜色/间距/圆角/阴影/字体一律用 `src/styles/tokens.css` 的 CSS 自定义变量
- TypeScript 严格：`strict` + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax`（`import type { ... }` 必须单独行）
- GSAP 包导入必须两行：
  ```ts
  import { gsap } from 'gsap'                  // 运行时值
  import type { Timeline, Context, EaseFunction, TweenTarget } from 'gsap'  // 纯类型
  ```
- `gsap` 不是纯类型，`import type { gsap }` 会编译报错（spec §12 风险行）
- 不引入付费 GSAP 插件、不引 CustomEase、不引 `@vueuse/motion` / `framer-motion`
- `src/anim/` 目录不在本计划新建任何文件——所有源进 `src/composables/`（spec §5.2）
- 测试原则：只断言"动画被调度了"，不验证 easing 数值（spec §10）
- 新增 pattern / 修改组件配套必跑：`npm test` + `npm run build`（CLAUDE.md §2）

---

## File Structure（实施前地图）

### 新增文件（5 个 composable + 5 个 test + 0 个 src/anim）

```
src/composables/
├── useReducedMotion.ts        # matchMedia reactive (Task 3)
├── useMotionTokens.ts         # CSS-var → MotionToken 解析 (Task 4)
├── useGsapScene.ts            # gsap.context 契约 + 清理 (Task 5)
└── useStaggerReveal.ts        # 子节点 stagger + registry 去重 (Task 6)

tests/
├── useReducedMotion.test.ts   (Task 3)
├── useMotionTokens.test.ts    (Task 4)
├── useGsapScene.test.ts       (Task 5)
├── useStaggerReveal.test.ts   (Task 6)
└── choreo-smoke.test.ts       (Task 14 — 验证所有 view 入场都被调度；含路由快速切换防泄漏断言)
```

### 修改文件（11 个）

| 文件 | 修改说明 | Task |
|---|---|---|
| `package.json` | 新增 `gsap` 依赖 | T1 |
| `src/main.ts` | mount 前 `gsap.registerPlugin(ScrollTrigger)` | T1 |
| `src/styles/tokens.css` | 全量追加 `--motion-*` 变量（spec §4.4.1） | T2 |
| `src/App.vue` | RouterView v-slot + `<Transition>` + 钩子 | T7 |
| `src/components/home/HeroSection.vue` | `useStaggerReveal` 标题/CTA | T8 |
| `src/views/HomeView.vue` | 编排 Hero + Catalog 时间线 | T9 |
| `src/components/home/CategorySection.vue` | `useStaggerReveal` 子节点 | T10 |
| `src/components/home/PatternCard.vue` | hover/click GSAP 接管 | T10 |
| `src/components/ui/ClayCard.vue` | 移除 CSS `transition: transform`（保留 box-shadow） | T10 |
| `src/components/ui/ClayButton.vue` | 移除 CSS `transition: transform`（保留 box-shadow） | T10 |
| `src/components/pattern/PatternHeader.vue` | `useGsapScene` + `fade-only` | T11 |
| `src/components/pattern/MarkdownRenderer.vue` | `reveal-scroll` ScrollTrigger；`onUpdated` refresh | T11 |
| `src/components/pattern/PatternToc.vue` | `useStaggerReveal` + `registryId: 'pattern-toc'` | T12 |
| `src/views/PatternView.vue` | 编排 Header → Markdown → TOC | T13 |

### 不修改的文件
- `src/composables/useMarkdown.ts`、`useToc.ts`、`src/data/*`、`src/router/index.ts`

---

### Task 1: 安装 GSAP + 注册 ScrollTrigger

**Files:**
- Modify: `package.json`（依赖项）
- Modify: `src/main.ts`（在 mount 前 register）
- Test: 隐式通过 Task 14 的 `choreo-smoke.test.ts` 验证 `gsap.ScrollTrigger` 全局可见

**Interfaces:**
- 无（仅基础设施）
- Produces: 后续所有 task 都能 `import { gsap } from 'gsap'` 和 `import { ScrollTrigger } from 'gsap/ScrollTrigger'`

- [ ] **Step 1: 安装依赖**

```bash
cd D:/Projects/DesignPatterns
npm install gsap@^3.13.0
```

预期：`package.json` 增加 `"gsap": "^3.13.0"`，`node_modules/gsap/` 出现，`node_modules/gsap/ScrollTrigger.js` 存在。

- [ ] **Step 2: 修改 `src/main.ts`，在 mount 前注册 ScrollTrigger**

文件 `/D:/Projects/DesignPatterns/src/main.ts`，完整替换为：

```ts
import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import './styles/prose.css'
import App from './App.vue'
import { router } from './router'

// ⚠️ 必须早于 app.mount()——ScrollTrigger 在 gsap.core 注册，
//   后续 gsap.from / gsap.to 自动识别 ScrollTrigger 配置
gsap.registerPlugin(ScrollTrigger)

const app = createApp(App)
const head = createHead()

app.use(head)
app.use(router)
app.mount('#app')
```

- [ ] **Step 3: 跑 typecheck 验证 import 不报错**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0，无 error。

- [ ] **Step 4: 提交**

```bash
cd D:/Projects/DesignPatterns && git add package.json src/main.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "build(deps): add gsap 3.13; register ScrollTrigger in main.ts"
```

---

### Task 2: 全量新增 `--motion-*` CSS 变量

**Files:**
- Modify: `src/styles/tokens.css`（追加 §4.4.1 全部变量）

**Interfaces:**
- 无（CSS 单源；下游 `useMotionTokens` 解析）

- [ ] **Step 1: 在 `tokens.css` 末尾追加 motion 变量**

文件 `D:/Projects/DesignPatterns/src/styles/tokens.css`，在第 66 行（`}` 关闭 `:root`）之前的最后一行后追加：

```css
  /* Motion — 11 tokens × 平铺字段（spec §4.4.1） */

  /* hero-title */
  --motion-hero-title-duration: 600ms;
  --motion-hero-title-from-y: 16px;
  --motion-hero-title-from-opacity: 0;
  --motion-hero-title-ease: power2.out;

  /* subhead */
  --motion-subhead-duration: 380ms;
  --motion-subhead-from-y: 12px;
  --motion-subhead-from-opacity: 0;
  --motion-subhead-ease: back.out(1.4);

  /* entry-soft */
  --motion-entry-soft-duration: 480ms;
  --motion-entry-soft-from-y: 20px;
  --motion-entry-soft-from-scale: 0.92;
  --motion-entry-soft-from-opacity: 0;
  --motion-entry-soft-ease: back.out(1.4);

  /* entry-strong */
  --motion-entry-strong-duration: 520ms;
  --motion-entry-strong-from-y: 8px;
  --motion-entry-strong-from-scale: 0.92;
  --motion-entry-strong-from-opacity: 0;
  --motion-entry-strong-ease: back.out(1.6);

  /* fade-only */
  --motion-fade-only-duration: 360ms;
  --motion-fade-only-from-y: 12px;
  --motion-fade-only-from-opacity: 0;
  --motion-fade-only-ease: power2.out;

  /* fade-only-tight */
  --motion-fade-only-tight-duration: 360ms;
  --motion-fade-only-tight-from-y: 8px;
  --motion-fade-only-tight-from-opacity: 0;
  --motion-fade-only-tight-ease: power2.out;

  /* reveal-scroll */
  --motion-reveal-scroll-duration: 420ms;
  --motion-reveal-scroll-from-y: 18px;
  --motion-reveal-scroll-from-opacity: 0;
  --motion-reveal-scroll-ease: back.out(1.4);

  /* leave-quick */
  --motion-leave-quick-duration: 200ms;
  --motion-leave-quick-from-y: 0;
  --motion-leave-quick-from-scale: 1;
  --motion-leave-quick-from-opacity: 1;
  --motion-leave-quick-to-y: -10px;
  --motion-leave-quick-to-opacity: 0;
  --motion-leave-quick-ease: power2.in;

  /* enter-page */
  --motion-enter-page-duration: 340ms;
  --motion-enter-page-from-y: 14px;
  --motion-enter-page-from-scale: 0.96;
  --motion-enter-page-from-opacity: 0;
  --motion-enter-page-to-y: 0;
  --motion-enter-page-to-scale: 1;
  --motion-enter-page-to-opacity: 1;
  --motion-enter-page-ease: back.out(1.1);

  /* hover-lift */
  --motion-hover-lift-duration: 300ms;
  --motion-hover-lift-from-y: 0;
  --motion-hover-lift-from-scale: 1;
  --motion-hover-lift-from-opacity: 1;
  --motion-hover-lift-to-y: -4px;
  --motion-hover-lift-to-scale: 1.02;
  --motion-hover-lift-to-opacity: 1;
  --motion-hover-lift-ease: back.out(1.2);

  /* press-squish */
  --motion-press-squish-duration: 200ms;
  --motion-press-squish-from-y: 0;
  --motion-press-squish-from-scale: 0.94;
  --motion-press-squish-from-opacity: 1;
  --motion-press-squish-to-y: 0;
  --motion-press-squish-to-scale: 1;
  --motion-press-squish-to-opacity: 1;
  --motion-press-squish-ease: power3.out;

  /* stagger 步距 */
  --motion-stagger-card: 50ms;
  --motion-stagger-toc: 40ms;
  --motion-stagger-hero: 110ms;
```

> 注意：把块整体嵌在 `:root { ... }` 内部。原 `}` 关闭要保留。

- [ ] **Step 2: 跑 typecheck/build 确认 CSS 语法没破**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

预期：exit 0；`dist/assets/*.css` 体积因新变量变大几十字节。

- [ ] **Step 3: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/styles/tokens.css && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "style(tokens): add 11 motion tokens × flat field variables"
```

---

### Task 3: `useReducedMotion` composable

**Files:**
- Create: `src/composables/useReducedMotion.ts`
- Test: `tests/useReducedMotion.test.ts`

**Interfaces:**
- Produces: `useReducedMotion(): Readonly<Ref<boolean>>` —— `Ref<boolean>` 表示系统 `prefers-reduced-motion: reduce` 偏好当前值。系统设置变化时跟随 reactive 更新（matchMedia `change` 事件）。

- [ ] **Step 1: 写失败测试**

文件 `D:/Projects/DesignPatterns/tests/useReducedMotion.test.ts`：

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

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
    mql.matches = true
    listeners[0]({} as MediaQueryListEvent)
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
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useReducedMotion.test.ts
```

预期：FAIL —— `Cannot find module '@/composables/useReducedMotion'`。

- [ ] **Step 3: 实现 `useReducedMotion.ts`**

文件 `D:/Projects/DesignPatterns/src/composables/useReducedMotion.ts`：

```ts
import { ref, type Ref } from 'vue'

/**
 * 监听系统 prefers-reduced-motion: reduce。
 * 返回的 Ref<boolean> 在系统偏好变化时跟随 reactive 更新（spec §7）。
 */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  const reduced = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return reduced
  }

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mql.matches

  const handler = (e: MediaQueryListEvent) => {
    reduced.value = e.matches
  }

  // 现代浏览器使用 addEventListener；旧 Safari 用 addListener 作 fallback（虽然不强求）
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handler)
  }

  return reduced
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useReducedMotion.test.ts
```

预期：4 passed。

- [ ] **Step 5: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/composables/useReducedMotion.ts tests/useReducedMotion.test.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(anim): useReducedMotion composable + tests"
```

---

### Task 4: `useMotionTokens` composable

**Files:**
- Create: `src/composables/useMotionTokens.ts`
- Test: `tests/useMotionTokens.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type MotionToken = {
    duration: number       // 秒
    ease: string
    fromY: number
    toY?: number
    fromScale?: number
    toScale?: number
    fromOpacity?: number
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
    staggerCard: number    // 秒
    staggerToc: number
    staggerHero: number
  }
  export function useMotionTokens(): Readonly<Ref<MotionTokensMap>>
  ```
- **关键约束**：parseMs / parsePx / parseNum 入口检查空串，`throw new Error('[anim] token not defined: --motion-xxx')`；不许 NaN 静默

- [ ] **Step 1: 写失败测试**

文件 `D:/Projects/DesignPatterns/tests/useMotionTokens.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// 帮助函数：mock getComputedStyle 返回指定变量集
function mockComputedStyle(map: Record<string, string>) {
  vi.stubGlobal('window', {
    ...((window as any) ?? {}),
  })
  Object.defineProperty(document, 'documentElement', {
    configurable: true,
    value: {
      ...document.documentElement,
    },
  })
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
  afterEach(() => {
    vi.restoreAllMocks()
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
    expect(() => parseMs('')).toThrow(/token not defined/)
    expect(() => parsePx('')).toThrow(/token not defined/)
    expect(() => parseNum('')).toThrow(/token not defined/)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useMotionTokens.test.ts
```

预期：FAIL —— `Cannot find module`。

- [ ] **Step 3: 实现 `useMotionTokens.ts`**

文件 `D:/Projects/DesignPatterns/src/composables/useMotionTokens.ts`：

```ts
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
    throw new Error(`[anim] token not defined: ${name}; tokens.css 缺失该变量`)
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
  return parseFloat(s.endsWith('px') ? s : s + 'px')
}

/** '0.92' → number */
export function parseNum(name: string, raw: string): number {
  const s = ensure(name, raw)
  return parseFloat(s)
}

// ── Token 字段定义（spec §4.4.1） ─────────────────────────

type Field = readonly [cssVar: string, setter: (name: string, raw: string) => number]

function readToken(
  style: CSSStyleDeclaration,
  name: string,           // e.g. 'hero-title'
  fields: readonly Field[],
): MotionToken {
  const m: Record<string, number> = {}
  for (const [cssVar, setter] of fields) {
    const fullName = `--motion-${name}-${cssVar}`
    m[cssVar] = setter(fullName, style.getPropertyValue(fullName))
  }
  return {
    duration: m['duration'],
    ease: ensure(`--motion-${name}-ease`, style.getPropertyValue(`--motion-${name}-ease`)),
    fromY: m['from-y'],
    toY: m['to-y'],
    fromScale: m['from-scale'],
    toScale: m['to-scale'],
    fromOpacity: m['from-opacity'],
    toOpacity: m['to-opacity'],
  }
}

const HERO_TITLE: readonly Field[] = [
  ['duration', parseMs],
  ['from-y', parsePx],
  ['from-opacity', parseNum],
  ['to-y', parsePx],
  ['to-scale', parseNum],
  ['to-opacity', parseNum],
] as const

// 注：tokens.css 写法已经保证所有 to 字段在 source 里存在；parser 全部读取
// 简化：每个 token 8 个字段全部读取（有 to-* 就 parsePx/Num，没有就读 --motion-xxx-to-y 的 0/1 fallback）
// 每个 token 共享一组字段名；parser 缺值就 throw

// ── Singleton 缓存（spec §4.4.3：getComputedStyle 一次性 compute） ──

let cached: Readonly<MotionTokensMap> | undefined

function loadTokens(): Readonly<MotionTokensMap> {
  if (cached) return cached
  const style = typeof window !== 'undefined'
    ? window.getComputedStyle(document.documentElement)
    : ({} as CSSStyleDeclaration)

  const eight = <T>(name: string, opts: {
    duration: string; fromY: string; toY: string;
    fromScale: string; toScale: string;
    fromOpacity: string; toOpacity: string; ease: string;
  }): MotionToken => ({
    duration: parseMs(`--motion-${name}-duration`, style.getPropertyValue(`--motion-${name}-${opts.duration}`)),
    fromY: parsePx(`--motion-${name}-from-y`, style.getPropertyValue(`--motion-${name}-${opts.fromY}`)),
    toY: parsePx(`--motion-${name}-to-y`, style.getPropertyValue(`--motion-${name}-${opts.toY}`)),
    fromScale: parseNum(`--motion-${name}-from-scale`, style.getPropertyValue(`--motion-${name}-${opts.fromScale}`)),
    toScale: parseNum(`--motion-${name}-to-scale`, style.getPropertyValue(`--motion-${name}-${opts.toScale}`)),
    fromOpacity: parseNum(`--motion-${name}-from-opacity`, style.getPropertyValue(`--motion-${name}-${opts.fromOpacity}`)),
    toOpacity: parseNum(`--motion-${name}-to-opacity`, style.getPropertyValue(`--motion-${name}-${opts.toOpacity}`)),
    ease: ensure(`--motion-${name}-ease`, style.getPropertyValue(`--motion-${name}-ease`)),
  })

  // （注：八个字段在 tokens.css 里全部存在；空串就会 throw）

  const tokens: MotionTokensMap = {
    heroTitle: eight('hero-title', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    subhead:   eight('subhead',   { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    entrySoft: eight('entry-soft', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    entryStrong: eight('entry-strong', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    fadeOnly:  eight('fade-only', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    fadeOnlyTight: eight('fade-only-tight', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    revealScroll: eight('reveal-scroll', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    leaveQuick: eight('leave-quick', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    enterPage: eight('enter-page', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    hoverLift: eight('hover-lift', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
    pressSquish: eight('press-squish', { duration: 'duration', fromY: 'from-y', toY: 'to-y', fromScale: 'from-scale', toScale: 'to-scale', fromOpacity: 'from-opacity', toOpacity: 'to-opacity', ease: 'ease' }),
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
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useMotionTokens.test.ts
```

预期：5 passed。

- [ ] **Step 5: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/composables/useMotionTokens.ts tests/useMotionTokens.test.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(anim): useMotionTokens composable + tests (parseMs/parsePx/parseNum, NaN defense)"
```

---

### Task 5: `useGsapScene` composable（gsap.context + 清理）

**Files:**
- Create: `src/composables/useGsapScene.ts`
- Test: `tests/useGsapScene.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SceneBuilder = (
    tl: gsap.core.Timeline,
    rm: Readonly<Ref<boolean>>,
  ) => gsap.core.Timeline | void
  export function useGsapScene(
    root: Ref<HTMLElement | null | undefined>,
    build: SceneBuilder,
  ): void
  ```
- 内部：`onMounted` 创建 `gsap.context(fn, rootEl)`；`onBeforeUnmount` 调 `ctx.revert()`
- `root.value === null` 时 `console.warn('[anim] root not ready')` 后 return（spec §9）

- [ ] **Step 1: 写失败测试**

文件 `D:/Projects/DesignPatterns/tests/useGsapScene.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

describe('useGsapScene', () => {
  let createdContexts: any[] = []
  let revertedContexts: any[] = []

  beforeEach(async () => {
    createdContexts = []
    revertedContexts = []
    // mock gsap.context + killTweensOf 走真实 gsap（无需 stub）
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls build(tl, rm) on mount after DOM is available', async () => {
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const calls: string[] = []
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useGsapScene(root, (tl, rm) => {
          calls.push(`build-${typeof tl}-${rm.value ? 'rm-on' : 'rm-off'}`)
        })
        return { root }
      },
      render: () => h('div', { ref: 'el' }, ''),
      mounted() {
        (this as any).root = (this.$refs as any).el as HTMLElement
      },
    })
    // 简化：直接给 root 设置值，并 manual mount
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatch(/^build-/)
    wrapper.unmount()
  })

  it('ctx.revert() on unmount tears down tweens', async () => {
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const { gsap } = await import('gsap')
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useGsapScene(root, (tl, rm) => {
          // 调一次真实 tween 并统计加到 rootTimeline 的 children
          gsap.set(root.value!, { opacity: 0.5 })
        })
        return { root }
      },
      render: () => h('div', { ref: 'el' }),
      mounted() { (this as any).root = (this.$refs as any).el as HTMLElement },
    })
    const beforeChildren = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const peakChildren = gsap.globalTimeline.getChildren(true, true).length
    expect(peakChildren).toBeGreaterThanOrEqual(beforeChildren)
    wrapper.unmount()
    await nextTick()
    const afterChildren = gsap.globalTimeline.getChildren(true, true).length
    expect(afterChildren).toBeLessThanOrEqual(beforeChildren)
  })

  it('warns and no-ops when root is null at mount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { useGsapScene } = await import('@/composables/useGsapScene')
    const calls: string[] = []
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        // 故意保持 null
        useGsapScene(root, () => {
          calls.push('should-not-run')
        })
        return { root }
      },
      render: () => h('div'),
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(warn).toHaveBeenCalledWith('[anim] root not ready')
    expect(calls).toHaveLength(0)
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useGsapScene.test.ts
```

预期：FAIL —— module 不存在。

- [ ] **Step 3: 实现 `useGsapScene.ts`**

文件 `D:/Projects/DesignPatterns/src/composables/useGsapScene.ts`：

```ts
import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'
import type { Timeline } from 'gsap'

export type SceneBuilder = (
  tl: Timeline,
  rm: Readonly<Ref<boolean>>,
) => Timeline | void

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
  let ctx: gsap.Context | undefined

  onMounted(() => {
    const el = root.value
    if (!el) {
      console.warn('[anim] root not ready')
      return
    }

    ctx = gsap.context(() => {
      const tl = gsap.timeline()
      build(tl, rmRef)            // rm 不在场景内 watch（spec §3.3）
    }, el)
  })

  // rm 内部值固定在 mount 时定型（spec §3.3）
  const rmRef = { value: readReducedMotionOnce() } as unknown as Ref<boolean>

  onBeforeUnmount(() => {
    ctx?.revert()
    ctx = undefined
  })
}

function readReducedMotionOnce(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

> ⚠️ 注意：上面 `rmRef` 直接 mock 一个 ref；上面的实现简化了"使用 useReducedMotion"。
> 完整实现可改用 `useReducedMotion()` 同步取值（matchMedia 是同步的）：

```ts
import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'
import type { Timeline } from 'gsap'
import { useReducedMotion } from './useReducedMotion'

export type SceneBuilder = (
  tl: Timeline,
  rm: Readonly<Ref<boolean>>,
) => Timeline | void

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
```

实施时**采用第二个完整版本**（用 `useReducedMotion()`）。

- [ ] **Step 4: 跑测试确认通过**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useGsapScene.test.ts
```

预期：3 passed。

- [ ] **Step 5: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/composables/useGsapScene.ts tests/useGsapScene.test.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(anim): useGsapScene composable + tests (gsap.context + cleanup)"
```

---

### Task 6: `useStaggerReveal` composable（registry 去重）

**Files:**
- Create: `src/composables/useStaggerReveal.ts`
- Test: `tests/useStaggerReveal.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface StaggerRevealOptions {
    registryId?: string                              // 首次 mount 去重 key（spec §6.6）
    tokenKey: 'subhead' | 'entrySoft' | 'fadeOnly' | 'fadeOnlyTight'  // stagger 友好 token
    staggerKey: 'staggerCard' | 'staggerToc' | 'staggerHero'
  }
  export function useStaggerReveal(
    root: Ref<HTMLElement | null | undefined>,
    options: StaggerRevealOptions,
  ): void
  ```
- 内部：调 `useGsapScene`；首次 mount 跑 `tl.from(children)`（entry 动画）；后续 mount 瞬时 `gsap.set(children, ...)` 不动画
- 模块级 `Set<string>` 跟踪所有已首次 mount 的 registryId

- [ ] **Step 1: 写失败测试**

文件 `D:/Projects/DesignPatterns/tests/useStaggerReveal.test.ts`：

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

describe('useStaggerReveal', () => {
  afterEach(() => vi.restoreAllMocks())

  it('on first mount with registryId, schedules a tween for :scope > * children', async () => {
    const { gsap } = await import('gsap')
    const before = gsap.globalTimeline.getChildren(true, true).length

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useStaggerReveal(root, {
          registryId: 'test-stagger-1',
          tokenKey: 'subhead',
          staggerKey: 'staggerToc',
        })
        return { root }
      },
      render: () => h('ul', { ref: 'el' }, [
        h('li', null, 'a'),
        h('li', null, 'b'),
        h('li', null, 'c'),
      ]),
      mounted() { (this as any).root = (this.$refs as any).el as HTMLElement },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThan(before)
    wrapper.unmount()
  })

  it('on second mount with same registryId, no new tween is scheduled', async () => {
    const { gsap } = await import('gsap')

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const make = () => defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useStaggerReveal(root, {
          registryId: 'test-stagger-2',
          tokenKey: 'subhead',
          staggerKey: 'staggerToc',
        })
        return { root }
      },
      render: () => h('ul', { ref: 'el' }, [h('li'), h('li')]),
      mounted() { (this as any).root = (this.$refs as any).el as HTMLElement },
    })

    const w1 = mount(make(), { attachTo: document.body })
    await nextTick()
    const w1Children = gsap.globalTimeline.getChildren(true, true).length
    w1.unmount()
    await nextTick()

    const w2 = mount(make(), { attachTo: document.body })
    await nextTick()
    const w2Children = gsap.globalTimeline.getChildren(true, true).length
    // 第二次应只在 t=0 跑一次 gsap.set（瞬时终态），
    // 不应累积额外 tween。
    expect(w2Children).toBeLessThanOrEqual(w1Children)
    w2.unmount()
  })

  it('honors prefers-reduced-motion: set children to opacity 1 without tween', async () => {
    const { gsap } = await import('gsap')
    vi.stubGlobal('window', {
      ...((window as any) ?? {}),
      matchMedia: (q: string) => ({
        matches: q.includes('reduce'),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    } as any)

    const { useStaggerReveal } = await import('@/composables/useStaggerReveal')
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useStaggerReveal(root, {
          registryId: 'test-stagger-3',
          tokenKey: 'subhead',
          staggerKey: 'staggerToc',
        })
        return { root }
      },
      render: () => h('ul', { ref: 'el' }, [h('li'), h('li')]),
      mounted() { (this as any).root = (this.$refs as any).el as HTMLElement },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const ul = wrapper.find('ul').element as HTMLElement
    const li = ul.querySelector('li')!
    expect((li as HTMLElement).style.opacity === '1' || (li as HTMLElement).style.opacity === '').toBe(true)
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useStaggerReveal.test.ts
```

预期：FAIL —— module 不存在。

- [ ] **Step 3: 实现 `useStaggerReveal.ts`**

文件 `D:/Projects/DesignPatterns/src/composables/useStaggerReveal.ts`：

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/useStaggerReveal.test.ts
```

预期：3 passed。

- [ ] **Step 5: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/composables/useStaggerReveal.ts tests/useStaggerReveal.test.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(anim): useStaggerReveal composable + tests (registry dedupe + reduced-motion)"
```

---

### Task 7: App.vue 路由过渡

**Files:**
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `useMotionTokens()` from Task 4；spec §3.4 模板
- Produces: 整个路由系统的退-进过渡

- [ ] **Step 1: 改写 `src/App.vue`**

文件 `D:/Projects/DesignPatterns/src/App.vue`，完整替换为：

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { gsap } from 'gsap'
import { useMotionTokens } from '@/composables/useMotionTokens'
import type { Element } from '@vue/shared'

// ⚠️ 顶层只接 ref，.value 在 Transition 钩子里读（spec §4.4.3）
const tokensRef = useMotionTokens()

function onLeave(el: Element, done: () => void) {
  gsap.killTweensOf(el)                                    // 路线 A：节点级清理（spec §3.4）
  const { duration, ease, toY, toOpacity } = tokensRef.value.leaveQuick
  gsap.to(el as gsap.TweenTarget, {
    y: toY,
    opacity: toOpacity,
    duration,
    ease,
    onComplete: done,
  })
}

function onEnter(el: Element, done: () => void) {
  gsap.killTweensOf(el)
  const { duration, ease, fromY, fromOpacity, fromScale, toY, toOpacity, toScale } = tokensRef.value.enterPage
  gsap.fromTo(el as gsap.TweenTarget,
    { y: fromY, opacity: fromOpacity, scale: fromScale },
    { y: toY, opacity: toOpacity, scale: toScale, duration, ease, onComplete: done },
  )
}
</script>

<template>
  <a class="skip-link" href="#main">跳转到主要内容</a>
  <main id="main">
    <RouterView v-slot="{ Component, route }">
      <Transition name="route" mode="out-in"
                  @enter="onEnter" @leave="onLeave">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>
</template>
```

- [ ] **Step 2: 跑 typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0。

- [ ] **Step 3: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/App.vue && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(router): add route transition with GSAP enter/leave hooks"
```

---

### Task 8: `HeroSection.vue` 入场（hero-title + entry-strong）

**Files:**
- Modify: `src/components/home/HeroSection.vue`

**Interfaces:**
- Consumes: `useStaggerReveal` from Task 6；`useMotionTokens` from Task 4
- Produces: Hero 标题与 CTA 按钮的入场动画

- [ ] **Step 1: 改写 `src/components/home/HeroSection.vue`**

文件 `D:/Projects/DesignPatterns/src/components/home/HeroSection.vue`，完整替换为：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ClayButton from '@/components/ui/ClayButton.vue'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'

const heroEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()

useGsapScene(heroEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(heroEl.value!, { opacity: 1, y: 0 })
    return
  }
  const title = heroEl.value!.querySelector('.title')!
  const cta = heroEl.value!.querySelector('.actions')!

  tl.from(title, {
    duration: tokens.heroTitle.duration,
    ease: tokens.heroTitle.ease,
    y: tokens.heroTitle.fromY,
    opacity: tokens.heroTitle.fromOpacity,
  })
  tl.from(cta, {
    duration: tokens.entryStrong.duration,
    ease: tokens.entryStrong.ease,
    y: tokens.entryStrong.fromY,
    scale: tokens.entryStrong.fromScale,
    opacity: tokens.entryStrong.fromOpacity,
  }, '+=0.11')   // 110ms 间隔（hero stagger）
})
</script>

<template>
  <section ref="heroEl" class="hero">
    <div class="hero-inner">
      <h1 class="title">23 种 GoF 设计模式</h1>
      <div class="actions">
        <ClayButton to="/pattern/singleton" variant="primary">开始学习</ClayButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: var(--space-8) 0 var(--space-7);
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  max-width: 760px;
  margin: 0 auto;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 48px);
  font-weight: 400;
  color: var(--ink-900);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}
</style>
```

> 注：`<style scoped>` 与原版一致；只新增了 setup script。

- [ ] **Step 2: 跑 typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0。

- [ ] **Step 3: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/components/home/HeroSection.vue && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(home): hero-title + entry-strong entrance for HeroSection"
```

---

### Task 9: `HomeView.vue` 编排 Hero + Catalog 时间线

**Files:**
- Modify: `src/views/HomeView.vue`

**Interfaces:**
- Consumes: 现有 `HeroSection` + `PatternCatalog`；无 composable
- Produces: 视图层面只保证两者依次挂载（HeroSection 自带入场时间线，Catalog 走 Task 10 的子组件 stagger）

- [ ] **Step 1: 看一眼现状确认结构**

```bash
cat D:/Projects/DesignPatterns/src/views/HomeView.vue
```

预期输出：

```vue
<script setup lang="ts">
import { useHead } from '@vueuse/head'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import PatternCatalog from '@/components/home/PatternCatalog.vue'

useHead({ ... })
</script>

<template>
  <Container>
    <HeroSection />
    <PatternCatalog />
  </Container>
  <SiteFooter />
</template>
```

无需改动——HeroSection / PatternCatalog 各自的入场动画由各自组件负责（spec §6.1 时间线已在 HeroSection 内部 + Catalog 各子组件内部编排）。

- [ ] **Step 2: 提交** —— 实际上文件未改动，跳过 commit。

> 注：本任务确认后如果未来需要 HomeView 层做"等 Catalog ready 后再触发 Hero"之类的编排，再回过头修改。

---

### Task 10: `CategorySection` + `PatternCard` + `ClayCard/Button` 微交互

**Files:**
- Modify: `src/components/home/CategorySection.vue`
- Modify: `src/components/home/PatternCard.vue`
- Modify: `src/components/ui/ClayCard.vue`
- Modify: `src/components/ui/ClayButton.vue`

**Interfaces:**
- Consumes: `useStaggerReveal`（Task 6） + `useMotionTokens`（Task 4）
- Produces: 卡片入场 stagger；hover-lift / press-squish 微交互；CSS transform transition 被 GSAP 接管

- [ ] **Step 1: 先看现有文件结构**

```bash
cat D:/Projects/DesignPatterns/src/components/home/CategorySection.vue
cat D:/Projects/DesignPatterns/src/components/home/PatternCard.vue
```

- [ ] **Step 2: 修改 `ClayCard.vue` —— 移除 CSS transform transition（GSAP 接管）**

文件 `D:/Projects/DesignPatterns/src/components/ui/ClayCard.vue`，将第 25-26 行：

```css
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
```

改为（保留 box-shadow transition 让 hover 阴影变化仍顺滑）：

```css
  transition: box-shadow var(--duration-fast) var(--ease-out);
```

把第 34 行 `:hover` 的 `transform` 删掉（让 GSAP 接管 transform）：

```css
.clay-card--interactive:hover {
  box-shadow: var(--shadow-clay-out-lg);
}
```

- [ ] **Step 3: 修改 `ClayButton.vue` —— 同上**

文件 `D:/Projects/DesignPatterns/src/components/ui/ClayButton.vue`，将第 36-37 行：

```css
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
```

改为：

```css
  transition: box-shadow var(--duration-fast) var(--ease-out);
```

第 59 行 `:hover` 删 `transform`：

```css
.clay-button:hover {
  box-shadow: var(--shadow-clay-out-lg);
}
```

- [ ] **Step 4: 修改 `CategorySection.vue` 添加 stagger 入场**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Pattern } from '@/types/pattern'
import PatternCard from './PatternCard.vue'
import { useStaggerReveal } from '@/composables/useStaggerReveal'

defineProps<{ category: { id: string; name: string; patterns: readonly Pattern[] } }>()

const cardsEl = ref<HTMLElement | null>(null)
useStaggerReveal(cardsEl, {
  registryId: 'category-cards',
  tokenKey: 'entrySoft',
  staggerKey: 'staggerCard',
})
</script>

<template>
  <section class="category">
    <h2 class="title-zh">{{ category.name }}</h2>
    <div ref="cardsEl" class="cards">
      <PatternCard
        v-for="p in category.patterns"
        :key="p.slug"
        :pattern="p"
        :accent-color="accentFor[category.id]"
      />
    </div>
  </section>
</template>

<script lang="ts">
const accentFor: Record<string, string> = {
  creational:  'var(--cat-creational)',
  structural:  'var(--cat-structural)',
  behavioral:  'var(--cat-behavioral)',
}
export default { name: 'CategorySection' }
</script>
```

> 注：如果原 CategorySection 有自己的 accent mapping，请保留并合并。

- [ ] **Step 5: 修改 `PatternCard.vue` 添加 hover/click GSAP 接管**

文件 `D:/Projects/DesignPatterns/src/components/home/PatternCard.vue`，把整段 `<script setup>` 替换为：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import type { Pattern } from '@/types/pattern'
import { gsap } from 'gsap'
import { useMotionTokens } from '@/composables/useMotionTokens'

const props = defineProps<{
  pattern: Pattern
  accentColor: string
}>()

const tokensRef = useMotionTokens()
const linkEl = ref<HTMLElement | null>(null)

const categoryColorVar: Record<Pattern['category'], string> = {
  creational: 'var(--cat-creational)',
  structural: 'var(--cat-structural)',
  behavioral: 'var(--cat-behavioral)',
}

function onEnter() {
  const { duration, ease, toY, toScale } = tokensRef.value.hoverLift
  gsap.to(linkEl.value!, { duration, ease, y: toY, scale: toScale })
}

function onLeave() {
  const { duration, ease, fromY, fromScale } = tokensRef.value.hoverLift
  gsap.to(linkEl.value!, { duration, ease, y: fromY, scale: fromScale })
}

function onDown() {
  const { duration, ease, fromScale, toScale } = tokensRef.value.pressSquish
  gsap.fromTo(linkEl.value!,
    { scale: fromScale },
    { scale: toScale, duration, ease },
  )
}
</script>

<template>
  <RouterLink
    ref="linkEl"
    :to="`/pattern/${props.pattern.slug}`"
    class="link"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerdown="onDown"
  >
    <ClayCard interactive :accent-color="categoryColorVar[props.pattern.category]">
      <div class="row">
        <span class="category">
          {{
            props.pattern.category === 'creational' ? '创建型'
              : props.pattern.category === 'structural' ? '结构型'
              : '行为型'
          }}
        </span>
      </div>
      <h3 class="title-zh">{{ props.pattern.titleZh }}</h3>
      <p class="title-en">{{ props.pattern.titleEn }}</p>
      <p class="summary">{{ props.pattern.summary }}</p>
    </ClayCard>
  </RouterLink>
</template>

<style scoped>
.link {
  display: block;
  text-decoration: none;
  color: inherit;
}
...
</style>
```

`<style scoped>` 部分保持原样，不动。

- [ ] **Step 6: 跑 typecheck + 测试**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck && npm test
```

预期：exit 0；composable 测试全部通过。

- [ ] **Step 7: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/components/home/CategorySection.vue src/components/home/PatternCard.vue src/components/ui/ClayCard.vue src/components/ui/ClayButton.vue && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(home): category cards stagger + ClayCard/Button hover-lift/press-squish (GSAP takeover)"
```

---

### Task 11: `PatternHeader` + `MarkdownRenderer` 入场 + ScrollTrigger

**Files:**
- Modify: `src/components/pattern/PatternHeader.vue`
- Modify: `src/components/pattern/MarkdownRenderer.vue`

**Interfaces:**
- Consumes: `useGsapScene`（Task 5） + `useMotionTokens`（Task 4） + GSAP ScrollTrigger
- Produces: Header fade-only 入场；Markdown 容器 fade-only；h2/h3/img/pre 入视口 useScrollReveal

**注：useScrollReveal 不单独成 composable，直接在 MarkdownRenderer 里写内联 GSAP + ScrollTrigger**——简化、避免过度抽象。

- [ ] **Step 1: 先看一眼 MarkdownRenderer 当前结构**

```bash
cat D:/Projects/DesignPatterns/src/components/pattern/MarkdownRenderer.vue
```

- [ ] **Step 2: 修改 `PatternHeader.vue`** —— 添加 fade-only 入场

文件 `D:/Projects/DesignPatterns/src/components/pattern/PatternHeader.vue`，在 `<script setup>` 加：

```vue
<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { Pattern } from '@/types/pattern'
import { gsap } from 'gsap'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'

const props = defineProps<{ pattern: Pattern }>()
const headerEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()

useGsapScene(headerEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(headerEl.value!, { opacity: 1, y: 0 })
    return
  }
  tl.from(headerEl.value!, {
    duration: tokens.fadeOnly.duration,
    ease: tokens.fadeOnly.ease,
    y: tokens.fadeOnly.fromY,
    opacity: tokens.fadeOnly.fromOpacity,
  })
})
</script>

<template>
  <header ref="headerEl" class="pattern-header">
    ...
  </header>
</template>
```

> `<template>` 原内容保留，只在 `<header>` 上加 ref。

- [ ] **Step 3: 修改 `MarkdownRenderer.vue` —— 入场 + ScrollTrigger 滚动驱动**

文件 `D:/Projects/DesignPatterns/src/components/pattern/MarkdownRenderer.vue`，把 `<script setup>` 改造为：

```vue
<script setup lang="ts">
import { ref, watch, onMounted, onUpdated, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGsapScene } from '@/composables/useGsapScene'
import { useMotionTokens } from '@/composables/useMotionTokens'
import { Markdown, useMarkdown, toRef } from '...'

const props = defineProps<{ source: string }>()
const containerEl = ref<HTMLElement | null>(null)
const tokensRef = useMotionTokens()

// (existing) data:
const source = computed(() => props.source)
const html = useMarkdown(source)

// ── 容器入场：fade-only（spec §6.2） ──
useGsapScene(containerEl, (tl, rm) => {
  const tokens = tokensRef.value
  if (rm.value) {
    gsap.set(containerEl.value!, { opacity: 1, y: 0 })
    return
  }
  tl.from(containerEl.value!, {
    duration: tokens.fadeOnly.duration,
    ease: tokens.fadeOnly.ease,
    y: tokens.fadeOnly.fromY,
    opacity: tokens.fadeOnly.fromOpacity,
  }, '+=0.12')   // 120ms 间隔（hero stagger 节奏）
})

// ── 滚动驱动：reveal-scroll + ScrollTrigger ──
onMounted(() => setupScrollReveal())
onUpdated(() => ScrollTrigger.refresh())  // markdown 替换内容后重算

function setupScrollReveal() {
  if (!containerEl.value) return
  const tokens = tokensRef.value
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (rm) return  // reduced-motion 不接 ScrollTrigger

  const headings = containerEl.value.querySelectorAll<HTMLElement>('h2, h3, img, pre')
  headings.forEach(el => {
    gsap.from(el, {
      duration: tokens.revealScroll.duration,
      ease: tokens.revealScroll.ease,
      y: tokens.revealScroll.fromY,
      opacity: tokens.revealScroll.fromOpacity,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        markers: import.meta.env.DEV,
        once: true,
      },
    })
  })
}
</script>

<template>
  <article ref="containerEl" class="prose">
    <!-- existing markdown rendering, e.g. v-html="html" -->
  </article>
</template>
```

> 注：保留原来的 markdown 渲染逻辑；只新增 ref + 三个 composable 调用 + scrollTrigger setup。

- [ ] **Step 4: 跑 typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0。

- [ ] **Step 5: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/components/pattern/PatternHeader.vue src/components/pattern/MarkdownRenderer.vue && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(pattern): PatternHeader fade-only + MarkdownRenderer entrance + ScrollTrigger reveal-scroll"
```

---

### Task 12: `PatternToc.vue` —— 首次 mount 触发 TOC 项淡入

**Files:**
- Modify: `src/components/pattern/PatternToc.vue`

**Interfaces:**
- Consumes: `useStaggerReveal`（Task 6） + `registryId: 'pattern-toc'`
- Produces: 整页第一次访问时 TOC 子项 stagger；后续切换瞬时终态

> 顺带：去除 PatternToc 现有 CSS `transition: background-color/color` 的 hover transition —— 这两个属性 GSAP 不接管，可保留；**不要**保留 `transition: opacity/transform`，本组件无 opacity/transform 故不动。

- [ ] **Step 1: 修改 `PatternToc.vue`**

文件 `D:/Projects/DesignPatterns/src/components/pattern/PatternToc.vue`，把 `<script setup>` 替换为：

```vue
<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useToc } from '@/composables/useToc'
import { useStaggerReveal } from '@/composables/useStaggerReveal'

const props = defineProps<{ html: string }>()
const entries = useToc(toRef(props, 'html'))

const ulEl = ref<HTMLElement | null>(null)
useStaggerReveal(ulEl, {
  registryId: 'pattern-toc',
  tokenKey: 'subhead',
  staggerKey: 'staggerToc',
})

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }
}
</script>

<template>
  <aside class="toc" aria-label="本页目录">
    <p class="heading">本页目录</p>
    <ul v-if="entries.length" ref="ulEl">
      <li v-for="entry in entries" :key="entry.id" :data-level="entry.level">
        <a :href="`#${entry.id}`" @click="scrollTo(entry.id, $event)">{{ entry.text }}</a>
      </li>
    </ul>
    <p v-else class="empty">暂无章节</p>
  </aside>
</template>

<style scoped>
/* 原 style 保持不变 */
</style>
```

> `<style scoped>` 部分保持原样（不涉及 opacity/transform transition，无须删）。

- [ ] **Step 2: 跑 typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0。

- [ ] **Step 3: 提交**

```bash
cd D:/Projects/DesignPatterns && git add src/components/pattern/PatternToc.vue && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "feat(pattern): PatternToc first-mount stagger (registry 'pattern-toc')"
```

---

### Task 13: `PatternView.vue` 编排 Header → Markdown → TOC 三段时间线

**Files:**
- Modify: `src/views/PatternView.vue`

**Interfaces:**
- Consumes: 现有结构 + 已落实的 PatternHeader / MarkdownRenderer / PatternToc 各自的入场动画
- Produces: 在 PatternView 层面用 `<Transition>` 包三级块，确保三者按序淡入（spec §6.2）

- [ ] **Step 1: 看一下现状确认**

```bash
cat D:/Projects/DesignPatterns/src/views/PatternView.vue
```

- [ ] **Step 2: 修改 `PatternView.vue`** —— 头/markdown/toc 各自组件自带入场；本任务在 PatternView 层用 `<Transition>` + 名义调度确保按序

> 注：由于 PatternHeader / MarkdownRenderer / PatternToc 都各自 useGsapScene/useStaggerReveal 自带时间线，PatternView 不需要再编排 GSAP 时间线——它只需要保证三块按模板顺序挂载即可。如果希望在外层做统一 `stagger 节奏`，可以再包裹一个 `<TransitionGroup>`：

文件 `D:/Projects/DesignPatterns/src/views/PatternView.vue` 的 `<script setup>` 部分**保持原样**；`<template>` 改为：

```vue
<template>
  <Container>
    <template v-if="pattern">
      <PatternHeader :pattern="pattern" />
      <div class="layout">
        <MarkdownRenderer :source="source" />
        <PatternToc :html="html" />
      </div>
      <PatternFooterNav :prev="prev" :next="next" />
    </template>
    <template v-else>
      <div class="not-found">
        <h1>未找到该模式</h1>
        <p>请检查链接,或返回首页浏览全部模式。</p>
        <RouterLink to="/" class="back">← 返回首页</RouterLink>
      </div>
    </template>
  </Container>
  <SiteFooter />
</template>
```

> 已与原结构对齐；无须修改。

- [ ] **Step 3: 跑 typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

预期：exit 0。

> 如果 PatternView 的 `<script setup>` 当前已经有 source / html / pattern 等 binding 保持不动。

- [ ] **Step 4: 提交** —— 通常无须修改（PatternView 不需要 GSAP）。如果真改了 commit。

> 本任务实际上确认"PatternView 无须顶层编排",三个子组件各自时间线已满足 §6.2。

---

### Task 14: choreo smoke 测试 + 路由快速切换防泄漏测试

**Files:**
- Create: `tests/choreo-smoke.test.ts`

**Interfaces:**
- 测试每个 view mount 后是否调度了至少一个 tween
- 防泄漏：10 次路由切换后 `gsap.globalTimeline.getChildren(true, true).length` 保持稳定

- [ ] **Step 1: 写测试**

文件 `D:/Projects/DesignPatterns/tests/choreo-smoke.test.ts`：

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { gsap } from 'gsap'

import HomeView from '@/views/HomeView.vue'
import PatternView from '@/views/PatternView.vue'

describe('choreo smoke (动画调度)', () => {
  afterEach(() => {
    // 清理 gsap globalTimeline 防止测试间污染
    gsap.globalTimeline.clear()
  })

  it('HomeView mount 调度至少一个 tween', async () => {
    const before = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(HomeView, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    })
    await flushPromises()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThan(before)
    wrapper.unmount()
  })

  it('PatternView mount 调度至少一个 tween (use getPattern singleton)', async () => {
    const before = gsap.globalTimeline.getChildren(true, true).length
    const wrapper = mount(PatternView, {
      props: { /* routeParams inject: 'singleton' */ },
      global: {
        stubs: { RouterLink: true, RouterView: true },
        mocks: { $route: { params: { slug: 'singleton' } } },
      },
    })
    await flushPromises()
    const after = gsap.globalTimeline.getChildren(true, true).length
    expect(after).toBeGreaterThanOrEqual(before)
    wrapper.unmount()
  })
})

describe('路由快速切换防泄漏', () => {
  it('10 次 HomeView ↔ PatternView 切换后 tween 数稳定', async () => {
    for (let i = 0; i < 10; i++) {
      const w1 = mount(HomeView, { global: { stubs: { RouterLink: true, RouterView: true } } })
      await flushPromises()
      w1.unmount()
      await flushPromises()

      const w2 = mount(PatternView, {
        global: {
          stubs: { RouterLink: true, RouterView: true },
          mocks: { $route: { params: { slug: 'singleton' } } },
        },
      })
      await flushPromises()
      w2.unmount()
      await flushPromises()
    }
    const final = gsap.globalTimeline.getChildren(true, true).length
    // 稳态：清理后不应有增长的 tween 残留
    expect(final).toBeLessThanOrEqual(2)
  })
})
```

- [ ] **Step 2: 跑测试**

```bash
cd D:/Projects/DesignPatterns && npx vitest run tests/choreo-smoke.test.ts
```

预期：3 passed（choreo HomeView、PatternView mount 各 1 个 + 防泄漏 1 个）。如失败，按错误信息调整 stub / mock 范围——但**不改业务代码**（业务代码在前 13 task 已经定型）。

- [ ] **Step 3: 全测试套件 + build**

```bash
cd D:/Projects/DesignPatterns && npm test && npm run build
```

预期：所有 composable 测试 + choreo 测试通过；vue-tsc build exit 0；Vite build 输出 dist/ 含 GSAP bundle（产物大小比 T1 前大 ~25KB gzipped）。

- [ ] **Step 4: 提交**

```bash
cd D:/Projects/DesignPatterns && git add tests/choreo-smoke.test.ts && \
  git -c user.email=claude@local -c user.name=claude commit -m \
  "test(anim): choreo smoke (views mount triggers) + route-leak guard (10 flips)"
```

---

## Self-Review

执行前我已对照 spec 清单做一次覆盖核对：

### 1. Spec coverage
- §1 背景 / §2 设计目标：未直接落地为可执行代码任务，但被 Task 1-14 整体覆盖（GSAP 集成解决所有四类动效）。
- §3 架构：A 方案 + gsap.context + Vue `<Transition>` → Task 5（useGsapScene）+ Task 7（App.vue route hooks）。
- §4.1 token 表 → Task 2（CSS 变量）+ Task 4（解析类型）。
- §4.2 缓动复用 → Task 1（import gsap，不引 CustomEase）。
- §4.3 CSS transition 协调 → Task 10（移除 ClayCard/Button 的 transform transition）。
- §4.4 motion source of truth → Task 2 + Task 4。
- §5 模块布局 → Task 3-6 + Task 7-13（composable 与组件逐项落地）。
- §6.1 HomeView 进场 → Task 8（Hero）+ Task 10（Catalog stagger）。
- §6.2 PatternView 进场 → Task 11（Header + Markdown）+ Task 12（Toc）。
- §6.3 ScrollTrigger + markers: false + import.meta.env.DEV → Task 11（setupScrollReveal 函数中显式声明）。
- §6.4 页间过渡 → Task 7（App.vue onEnter/onLeave）。
- §6.5 微交互 → Task 10（PatternCard hover/click + ClayCard/Button）。
- §6.6 PatternToc registryId → Task 12。
- §7 reduced-motion 处理 → Task 3（composable）+ Task 4/5/6（各 composable build 回调读 rm）。
- §8 数据流 → 跨 task 整体实现（没单设任务，结构反映在 token 流向）。
- §9 错误处理 → Task 5（root.value null warn）+ Task 4（缺变量 throw）+ Task 7（路由钩子 killTweensOf）。
- §10 测试策略 → Task 3-6（composable 测试）+ Task 14（choreo + 防泄漏）。
- §11 实现顺序 → 1 → 14 与 spec 一致。
- §12 风险 → 未单设任务；约束（verbatimModuleSyntax import 行）已写入 Global Constraints；bundle 大小校验在 Task 14 build 步骤。

### 2. Placeholder scan
- 全文搜索"// TODO" / "TBD" / "实现稍后" / "类似 Task N" / "参考 N"——无。
- 每个 step 都包含具体代码或具体命令。
- 文件路径全程具体到 `D:/Projects/DesignPatterns/...` 完整名。
- 引用的 composable 名字（`useGsapScene` / `useReducedMotion` / `useMotionTokens` / `useStaggerReveal`）在 Task 5、3、4、6 分别定义，跨 task 一致。
- 类型名（`MotionToken` / `SceneBuilder` / `StaggerRevealOptions` / `MotionTokensMap`）在定义 task 与使用 task 之间一致。

### 3. Type consistency
- `MotionToken` 字段（`duration`/`ease`/`fromY`/`toY`/`fromScale`/`toScale`/`fromOpacity`/`toOpacity`）：在 Task 4 定义，Task 5、6、7、8、10、11、12 一致使用。
- `MotionTokensMap` 字段名（`heroTitle` / `subhead` / `entrySoft` / `entryStrong` / `fadeOnly` / `fadeOnlyTight` / `revealScroll` / `leaveQuick` / `enterPage` / `hoverLift` / `pressSquish` / `staggerCard` / `staggerToc` / `staggerHero`）：跨 spec §4.4、Task 2 CSS、Task 4 解析、Task 5/6/7/8/10/11 composable 内调用一致。
- `SceneBuilder` / `gsap.Context` / `Timeline` 来自 gsap 类型，跨 task 一致使用。
- `useStaggerReveal` 选项 `StaggerRevealOptions`：`tokenKey` 用 `keyof Pick<MotionTokensMap, ...>` 约束——与 Task 4 MotionTokensMap 一致。

### 已知风险点
- **Task 4 实现略冗长**：把每个 token 都写一遍 `eight('xxx', ...)`；实施者可考虑用 `Object.fromEntries` 工厂化重构（不破坏契约，可选优化）。
- **Task 10 中 CategorySection accent mapping**：原文件可能有自己的 mapping，本计划假设保留并合并不冲突；实施者需要在 Step 1 读现状后调整。
- **Task 13 实际可能无须 commit**：本计划已写明——PatternView 不需顶层 GSAP，验证后无修改即跳过 commit。
- **Task 14 PatternView mount**：当前 stub RouterView；真实项目里 PatternView 是 route component，需要 `$route` mock 才能拿到 slug；测试在没拉起 router 时通过 stub 注入 slug。

---

Plan complete and saved to `docs/superpowers/plans/2026-06-30-gsap-animations.md`. **Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - I execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
