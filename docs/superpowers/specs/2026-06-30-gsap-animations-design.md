# GSAP 动画集成 — 设计稿

日期：2026-06-30
项目：DesignPatterns（Vue 3 + Vite + TS 单页应用，中文 GoF 设计模式学习手册）
状态：已获用户口头批准（2026-06-30 三节设计逐节确认；用户二轮反馈 9 处修订后落定），待用户审阅本文档后进入实施计划阶段

## 1. 背景与现状

- 站点目前**没有任何 JS 动画库**，`package.json` 仅含 `vue / vue-router / markdown-it / lucide-vue-next / @vueuse/head`。
- `src/components/ui/ClayCard.vue`、`ClayButton.vue`、`CategoryChip.vue` 已使用"橡皮泥拟物"（claymorphism）风格——圆角 + 内/外阴影 + 轻微交互反馈。CSS 中已有少量 `transition` 切换 `transform`，但**没有入场动画、没有路由过渡、没有滚动驱动**。
- 路由使用 **hash 模式**（`createWebHashHistory`），GitHub Pages 静态托管。
- 关键渲染入口：
  - **HomeView** → `HeroSection` + `PatternCatalog`（3 个 `CategorySection`，共 23 张 `PatternCard`）
  - **PatternView** → `PatternHeader` + `MarkdownRenderer`（含 `h2/h3/img/pre`）+ `PatternToc` + `PatternFooterNav`
  - **AboutView**（静态页）
- 首屏体感问题：刷新即"啪"地出现，没有层次与节奏；详情页滚动时正文静止，缺少引导感；微交互仅靠 CSS 简单位移，回弹缺失。

## 2. 设计目标

引入 GSAP（核心 + ScrollTrigger 免费插件），为整站补足四类动效：

1. **HomeView 进场**：Hero 标题/CTA 与 23 张卡片的错位浮入（soft + bouncy）。
2. **PatternView 进场**：Header → Markdown → TOC 的依次淡入。
3. **页间过渡**：Home ↔ Pattern ↔ About 切换时一个统一的退-进时间线。
4. **滚动驱动**：PatternView 长文内 `h2/h3/img/pre` 进入视口时浮现。
5. **微交互**：ClayCard / ClayButton 的 hover 抬升、按下陷落。

气质统一：**柔软活泼，像橡皮泥揉动**——具体为 `back.out(1.1 ~ 1.6)` 小幅 overshoot + 40-50ms stagger 步距 + 360-520ms 单次时长。

必须支持 **`prefers-reduced-motion: reduce`**，系统在用户偏好降效时短路为 0 透明度变化的瞬时显示。

## 3. 架构选择

### 3.1 选定方案：A — Vue `<Transition>` + `gsap.context()` + Composable

GSAP 官方对 Vue 的推荐范式：

- Vue 原生 `<Transition>` 处理路由进出 DOM 卸载/挂载的边界
- 每个组件在 `onMounted` 用 `gsap.context(fn, scopeEl)` 注册所有 tweens / ScrollTrigger
- `onBeforeUnmount` 调 `ctx.revert()` 一键 revert 该作用域内所有 GSAP 内部记录
- 用 composable 把"挂载→注册→清理"封装成一行调用，避免在每个组件重复样板

放弃方案 B（全局动画管理器单例）与方案 C（CSS 主导 + GSAP 补位）的理由：

- B 增加与 Vue 组件边界脱节的心智负担；单页面应用不需要跨组件"接力"动画
- C 在 CSS 里表达回弹 stagger 代价高且两套体系并存维护成本反而高

### 3.2 生命周期对齐

```
组件 onMounted
  ├─ 取 root.value（须非空）
  ├─ const ctx = gsap.context(fn, root.value)
  ├─ fn 内可见 build(timeline, reducedMotion)
  │     ├─ reducedMotion.value === true → gsap.set(el, { opacity: 1 }) 短路终态
  │     └─ reducedMotion.value === false → 正常 timeline
  └─ 注册 ctx 以便 revert
组件 onBeforeUnmount
  └─ ctx.revert()  // 自动 kill 所有 tweens 与 ScrollTrigger 实例
```

### 3.3 关键契约：`useGsapScene`

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

**运行期偏好变化的处理**:本契约**不在场景内 watch `rm` 变化**——一旦场景开始，`on/off` 状态在 mount 这一刻定型。运行中用户切换 `prefers-reduced-motion` 不会中断已开始的动画，下一次新挂载的组件读取最新值。这是行业主流做法，可避免运行中突变带来的卡顿。

### 3.4 路由过渡

`src/App.vue` 改造：

```vue
<RouterView v-slot="{ Component, route }">
  <Transition name="route" mode="out-in"
              @enter="onEnter" @leave="onLeave">
    <component :is="Component" :key="route.fullPath" />
  </Transition>
</RouterView>
```

实现模板（路线 A 清理，参数读自 `useMotionTokens()`，**不放任何裸数字**）：

```vue
<script setup lang="ts">
import { gsap } from 'gsap'
import { useMotionTokens } from '@/composables/useMotionTokens'

const { value: tokens } = useMotionTokens()
const { leaveQuick, enterPage } = tokens

function onLeave(el: Element, done: () => void) {
  gsap.killTweensOf(el)                                       // 兜底杀掉该节点上残留 tween
  gsap.to(el as gsap.TweenTarget, {
    y: leaveQuick.fromY,
    opacity: 0,
    duration: leaveQuick.duration,
    ease: leaveQuick.ease,
    onComplete: done,
  })
}

function onEnter(el: Element, done: () => void) {
  gsap.killTweensOf(el)
  gsap.fromTo(el as gsap.TweenTarget,
    { y: enterPage.fromY, opacity: 0, scale: enterPage.fromScale },
    { y: 0, opacity: 1, scale: 1, duration: enterPage.duration, ease: enterPage.ease, onComplete: done },
  )
}
</script>
```

> 注：`scale: 0.96 → 1` 提供肉眼可感的"页面入场"层级；`scale: 0.985` 在 340ms 内体感等同纯 fade，弃用。
> token 形态（`duration` 数值、`fromY` / `fromScale`）由 `useMotionTokens()` 把 CSS 变量字符串解析成结构化对象返回——具体结构见 §4.4。

**route 钩子的清理**：本钩子位于 `App.vue`，不归任何 `useGsapScene` 的 `ctx.revert()` 管辖。需要做两件事之一：
- **A 推荐**：在 `onLeave` / `onEnter` 开头各加 `gsap.killTweensOf(el)`，扼杀可能挂在该节点上的旧 tween（同一 `key` 切换场景下尤其有用）。
- **B**：在 `App.vue` 的 `onBeforeUnmount` 维护一个 `Set<gsap.Context>`，每个路由钩子创建一个 `gsap.context()` 并 push 进去；卸载时一并 `revert()`。

实施时选 A 路线——A 是 stateless 的"以节点为中心"清理，比维护 context 集合轻量。

`done` 回调必须调——否则 Vue 卡在过渡态不渲染新页。

## 4. 动画语汇

### 4.1 单一来源表

> **本表是动画参数的单一来源**（single source of truth）。所有编排时间线（§6）只引用语义 token 名，不在时间线里写裸数字。

| 语义 token | duration | translateY | scale | ease | 用途 |
|---|---|---|---|---|---|
| `hero-title` | 600ms | 16px → 0 | 1 | `power2.out` | Hero 主标题入场 |
| `subhead` | 380ms | 12px → 0 | 1 | `back.out(1.4)` | Category 标题、子标题 |
| `entry-soft` | 480ms | 20px → 0 | 0.92 → 1 | `back.out(1.4)` | 卡片入场 |
| `entry-strong` | 520ms | 8px → 0 | 0.92 → 1 | `back.out(1.6)` | Hero CTA 按钮 |
| `fade-only` | 360ms | 12px → 0 | 1 | `power2.out` | Markdown 容器、PatternHeader |
| `fade-only-tight` | 360ms | 8px → 0 | 1 | `power2.out` | TOC 容器（弱位移，整页过渡已含 TOC 主体） |
| `reveal-scroll` | 420ms | 18px → 0 | 1 | `back.out(1.4)` | ScrollTrigger 浮现 |
| `leave-quick` | 200ms | 0 → -10px | 1 | `power2.in` | 路由退场 |
| `enter-page` | 340ms | 14px → 0 | 0.96 → 1 | `back.out(1.1)` | 路由登场 |
| `hover-lift` | 300ms | -4px | 1.02 | `back.out(1.2)` | 卡悬停 |
| `press-squish` | 200ms | 0 | 0.94 → 1 | `power3.out` | 卡/按钮按下（统一） |

**Stagger 步距**（卡片区 50ms / TOC 项 40ms / Hero 多元素间隔 110ms）也在 tokens.css 中按语义命名，见 §4.4。

### 4.2 缓动复用

复用 GSAP 内置缓动，不引入 CustomEase。原因：
- CustomEase 用于表达 GSAP 内置 ease 表达不出的多控制点曲线，本设计的所有曲线（`back.out(1.1~1.6)`、`power2.out/in`、`power3.out`）GSAP 内置完全覆盖
- 无业务价值的多控制点曲线不值得引入新依赖、新 bundle、新的"易名"心智负担

> 一句话：缓动名只用 GSAP 原生字符串，不自己造名字。

### 4.3 与现有 CSS `transition` 的协调

现有 `ClayCard / ClayButton / CategoryChip` 的 `:hover` 已有 `transition: transform ...`。GSAP 接管 `transform` 时，会**瞬时覆盖** CSS——为避免抖动，被 GSAP 接管的属性必须用 `gsap.set` 设初值，确保首帧由 GSAP 决定状态。

### 4.4 motion 值的 source of truth：tokens.css

**所有 motion 数值落在 `src/styles/tokens.css`**（与既有 `--space-*` / `--ink-*` / 圆角/阴影的来源保持一致）。TS 侧提供 `useMotionTokens()` composable 读取：

```ts
// src/composables/useMotionTokens.ts
export function useMotionTokens() {
  return computed(() => {
    const styles = getComputedStyle(document.documentElement)
    return {
      heroTitle: parseMotion(styles.getPropertyValue('--motion-hero-title')),
      entrySoft: parseMotion(styles.getPropertyValue('--motion-entry-soft')),
      // ...
    }
  })
}
```

```
src/styles/tokens.css 新增条目示例：
  --motion-duration-fast: 200ms;
  --motion-duration-base: 360ms;
  --motion-duration-slow: 600ms;
  --motion-stagger-card: 50ms;
  --motion-stagger-toc: 40ms;
  --motion-stagger-hero: 110ms;
```

**为什么选 CSS 单一来源**：
1. 与项目既有 tokens.css 写法一致（CLAUDE.md 强调"颜色/间距/圆角/阴影/字体一律用 tokens.css 的 CSS 自定义变量"）
2. 未来主题切换 / 用户可调（如"动画速度"开关）可直接 CSS 变量覆盖
3. 不存在"TS 改了 CSS 没跟"的双源漂移

## 5. 模块布局

### 5.1 新增依赖

```json
{
  "dependencies": {
    "gsap": "^3.13.0"
  }
}
```

ScrollTrigger 是 GSAP 免费插件，`npm i gsap` 后 `import { ScrollTrigger } from 'gsap/ScrollTrigger'` 即可。

### 5.2 新增文件

```
src/composables/
├── useGsapScene.ts        # 3.3 节契约 + gsap.context 清理
├── useReducedMotion.ts    # matchMedia('(prefers-reduced-motion: reduce)') reactive
├── useStaggerReveal.ts    # "一群子节点依次入场"的薄封装,默认 back.out(1.4) 参数
└── useMotionTokens.ts     # 4.4 节:读取 tokens.css 的 motion 变量(computed)

tests/
├── useGsapScene.test.ts
├── useReducedMotion.test.ts
├── useStaggerReveal.test.ts
├── useMotionTokens.test.ts
└── choreo-smoke.test.ts   # 断言每个 view 的入场动画在 mount 后被调度
```

**`src/anim/` 整个目录不下设立文件**——缓动走 GSAP 内置（§4.2），motion 数值由 tokens.css 单源持有（§4.4），stagger 在 §4.4 的 CSS 变量里。

### 5.3 修改文件

| 文件 | 修改 |
|---|---|
| `src/main.ts` | 入口顶部调 `gsap.registerPlugin(ScrollTrigger)`，早于 `app.mount()` |
| `src/App.vue` | `RouterView` v-slot + `<Transition>` + `onEnter`/`onLeave` 钩子（参考 §3.4 选 A 清理路线） |
| `src/styles/tokens.css` | 增 §4.4 列出的 `--motion-*` 令牌 |
| `src/components/home/HeroSection.vue` | `useStaggerReveal` 应用到标题/CTA，引用 token 名 |
| `src/components/home/CategorySection.vue` | 进入视口时对所属卡片 stagger 入场 |
| `src/components/home/PatternCard.vue` 或 `ClayCard.vue` | hover/click GSAP 接管（移除 CSS transform transition），用 `hover-lift` / `press-squish` token |
| `src/components/pattern/PatternHeader.vue` | 进入视口时入场动画，引用 `fade-only` token |
| `src/components/pattern/MarkdownRenderer.vue` | 内容更新后 `ScrollTrigger.refresh()`；h2/h3/img/pre 入视口浮现，引用 `reveal-scroll` token |
| `src/components/pattern/PatternToc.vue` | TOC 项淡入**仅首次 mount 触发**；路由切换的整页 fade 已包含 TOC 区，TOC 内部不再独立 fade，避免动画叠加 |
| `src/views/HomeView.vue` | 编排"先 Hero 后 Catalog"两段时间线 |
| `src/views/PatternView.vue` | 编排"Header → Markdown → TOC"三段时间线 |

### 5.4 不修改的文件

- `src/composables/useMarkdown.ts` / `useToc.ts`——它们只产数据，不渲染 DOM 动画
- `src/data/*`——纯数据，与动效无关

## 6. 编排时间线

> 所有参数引用 §4.1 token 名，不写裸数字。

### 6.1 HomeView 进场

```
t=0     Hero 标题       应用 hero-title
t=110   Hero CTA 按钮    应用 entry-strong
t=200   Category 1 标题  应用 subhead
t=200   卡片 #1          应用 entry-soft
                       stagger 50ms（--motion-stagger-card）至 #N
                       注册于 gsap.context() 内
```

感知总时长约 1.4s，最后一张卡稳定后封面不再抢戏。

### 6.2 PatternView 进场

```
t=0     PatternHeader 块      应用 fade-only
t=120   Markdown 容器         应用 fade-only
t=200   TOC 容器              应用 fade-only-tight
                              （TOC 项即时可见，不延迟感）
```

### 6.3 滚动驱动（ScrollTrigger）

- 适用节点：`MarkdownRenderer` 内的 `h2`、`h3`、`img`、`pre`
- 触发：节点进入视口 `top 80%` 时启动
  > 阈值选 `top 80%` 而非 `top bottom-=15` / `top 90%`：太晚元素已完全可见，缺"浮现"感；太早（如 `top center`）正文还没读到下一节就出现，喧宾夺主。
- 行为：`reveal-scroll` token，`once: true`
- `markers: false`：默认关闭——一旦忘了关，ScrollTrigger 会在生产页面留下 `start: ...` / `end: ...` 调试浮标，污染 GitHub Pages 视觉。`markers: import.meta.env.DEV` 限定仅开发态开启。
- `ScrollTrigger.refresh()` 必须放在 `MarkdownRenderer` 的 `onUpdated` 钩子里调，确保 markdown 替换内容后锚点重算

### 6.4 页间过渡

`<Transition mode="out-in">` 让出整两段时间，钩子里跑 GSAP（见 §3.4），`leave-quick` / `enter-page` 走对应 token。

### 6.5 微交互

- `ClayCard`：
  - `@pointerenter`：`gsap.to(el, hover-lift)`
  - `@pointerleave`：`gsap.to(el, { duration: hover-lift.duration, y: 0, scale: 1, ease: 'power2.out' })`
  - `@pointerdown`：`gsap.fromTo(el, { scale: 0.94 }, press-squish)`
- `ClayButton`：hover 同卡片，press **共用** `press-squish` token（统一 0.94 → 1）。
- 用 `@pointer*` 不带 delay，避免视觉走样。

## 7. `prefers-reduced-motion` 处理

`useReducedMotion()` 暴露 `Ref<boolean>`，包裹 `matchMedia('(prefers-reduced-motion: reduce)')`，系统设置改变时跟随 reactive 更新。

`useGsapScene` 的 build 回调**拿到 `rm` 标记的瞬时值**（mount 那一刻的快照，下一次重 mount 才重新读取）：

```ts
useGsapScene(root, (tl, rm) => {
  if (rm.value) {
    gsap.set(root.value!, { opacity: 1, y: 0, scale: 1 })
    return
  }
  // 对应 §4.1 token `entry-soft`（y 20→0, scale 0.92→1, 480ms, back.out(1.4)）
  // + §4.4 stagger 变量 `--motion-stagger-card` (50ms)
  tl.from(root.value!.querySelectorAll('.card'), {
    y: 20, scale: 0.92, opacity: 0, duration: 0.48,
    ease: 'back.out(1.4)', stagger: 0.05,
  })
})
```

Hero 退化为纯透明渐变，路由过渡退化为纯不透明切换，滚动驱动禁用 ScrollTrigger。

运行中用户切换 `prefers-reduced-motion`：不会打断当前场景，下一次新挂载生效（与 §3.3 一致）。

## 8. 数据流

```
tokens.css（--motion-* 变量，source of truth）
        │
        ▼  getComputedStyle（mount 时一次性 compute）
useMotionTokens()  →  Ref<{ entrySoft, heroTitle, ... }>
        │
        ▼  read tokens
useGsapScene / useStaggerReveal / App.vue route 钩子
        │
        ▼
系统 prefers-reduced-motion 变化
        │  matchMedia reactive
useReducedMotion()  →  Ref<boolean>
        │
        ├─→ useGsapScene(root, build)  ← 组件 onMounted 读快照
        │       │
        │       ▼  build(tl, rm)  /* rm 在 mount 时定型，不在场景内 watch */
        │           gsap.from(sel, vars) / tl.from()
        │
        ▼  路由变化 → <Transition> 钩子 → gsap.killTweensOf(el) + GSAP tl → done()
```

## 9. 错误处理

| 边界 | 处理 |
|---|---|
| `root.value` 在 `onMounted` 仍未挂上 | `console.warn('[anim] root not ready')` 后 return，不抛错 |
| ScrollTrigger 在 markdown 还没渲染完时计算位置 | MarkdownRenderer 的 `onUpdated` 钩子里调 `ScrollTrigger.refresh()` |
| 路由快速来回切换，前一个过渡未 done | `<Transition mode="out-in">` 由 Vue 序列化 leave→enter，钩子里无需手动 flag；在 `onLeave`/`onEnter` 开头 `gsap.killTweensOf(el)` 兜底杀掉节点上的残留 tween |
| 动画过程中目标元素被卸载 | `gsap.context().revert()` 批量 kill，无悬空监听 |
| 浏览器不支持 `matchMedia` | `useReducedMotion` 直接返回 `ref(false)`，视作可动效 |
| 懒加载 / CodeSplit 下 GSAP 未 ready | 顶层 `main.ts` 在 mount 前 `gsap.registerPlugin(ScrollTrigger)` |
| 滚动触发器监听错乱 | `ctx.revert()` 已含 ScrollTrigger 实例清理 |
| 运行中用户切换 prefers-reduced-motion | 场景内定型不中断；新挂载组件读取最新值（见 §3.3） |

## 10. 测试策略

| 层 | 用例 | 工具 |
|---|---|---|
| Composables | `useGsapScene` 自动 cleanup；`useReducedMotion` mock matchMedia；`useStaggerReveal` 调度顺序；`useMotionTokens` 解析 CSS 变量 | Vitest + jsdom |
| Choreography smoke | 每个 view mount 后断言 `gsap.globalTimeline.getChildren()` 非空 | Vitest + @vue/test-utils |
| `MarkdownRenderer` 滚动 | mock `IntersectionObserver`，断言 ScrollTrigger 实例被创建 | Vitest |
| 视觉回归（独立 PR） | Playwright 截图首页首帧 / 路由切换帧 / 详情页滚动 | Playwright |

重要原则：**测试只断言"动画被调度了"**——不验证 easing 数值是否一致。jsdom 里时序断言不可靠。

## 11. 实现顺序

1. 安装 `gsap` + 配置 `tsconfig.app.json` types；`main.ts` register ScrollTrigger
2. 在 `src/styles/tokens.css` 新增 §4.4 列出的 `--motion-*` 令牌
3. 新建 `useReducedMotion.ts` + 单测
4. 新建 `useMotionTokens.ts` + 单测（读 CSS 变量）
5. 新建 `useGsapScene.ts` + 单测
6. 新建 `useStaggerReveal.ts` + 单测
7. 改 `App.vue`：`<RouterView v-slot>` + `<Transition>` + 钩子（含 `gsap.killTweensOf(el)` 兜底）
8. 改 `HeroSection.vue` 入场（引用 token 名）
9. 改 `HomeView.vue`：编排"先 Hero 后 Catalog"两段时间线
10. 改 `CategorySection.vue` / `PatternCard.vue` 入场 + 微交互
11. 改 `PatternHeader.vue` + `MarkdownRenderer.vue` 入场 + 滚动驱动
12. 改 `PatternToc.vue`：仅首次 mount 触发 TOC 项淡入
13. 改 `PatternView.vue`：编排 Header → Markdown → TOC 三段时间线
14. 跑 `npm test` + `npm run build`，修类型 / 单元 / 视觉

## 12. 风险与权衡

| 风险 | 缓解 |
|---|---|
| GSAP bundle 增量 ~30-40KB gzipped | 可接受；按需 register，不引付费插件 |
| CSS `transition` 与 GSAP `transform` 冲突 | 接管的属性必须 `gsap.set` 设初值，文档里点名 |
| 详情页大量节点注册 ScrollTrigger 影响性能 | `once: true` + `cleanup` 一并降低；按章节 stagger 不按段落 |
| 用户偏好降效时仍走完整时间线 | `useReducedMotion` 短路为 `set` 终态（mount 时刻快照） |
| jsdom 无法测交互动画 | 单元测调度，视觉另起 Playwright |
| `verbatimModuleSyntax` 严格模式下 GSAP 类型导入 | GSAP 的 `gsap` 是值+命名空间合并导出（不是纯类型），`import type { gsap }` 编译会报错。改成两行：<br>`import { gsap } from 'gsap'` 取运行时；<br>`import type { Timeline, Context } from 'gsap'` 取类型 |
| tokens.css 与 TS 双方 motion 漂移 | 单一来源定在 CSS，TS 仅读不解（§4.4） |

## 13. 非目标（明确不做）

- 不引入付费 GSAP 插件（`MorphSVGPlugin`、`DrawSVGPlugin`、`SplitText` 等）
- 不引入 `CustomEase`（内置 back.out 完全覆盖）
- 不重构 `ClayCard` / `ClayButton` 的视觉设计
- 不动 `MarkdownRenderer` 的 markdown 解析逻辑（只在挂载完成后 `refresh`）
- 不改路由结构或 history fallback
- 不引入 `@vueuse/motion` 或 `framer-motion` 之类的多库
- 不在 TS 侧维护独立的 motion / stagger / ease-curves 文件（统一进 tokens.css + GSAP 内置）
