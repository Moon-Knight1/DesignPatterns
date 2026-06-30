# GSAP 动画集成 — 设计稿

日期：2026-06-30
项目：DesignPatterns（Vue 3 + Vite + TS 单页应用，中文 GoF 设计模式学习手册）
状态：已获用户口头批准（2026-06-30 三节设计逐节确认），待用户审阅本文档后进入实施计划阶段

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

`onLeave(el, done)`：`gsap.to(el, { y: -10, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: done })`
`onEnter(el, done)`：`gsap.fromTo(el, { y: 14, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.34, ease: 'back.out(1.1)', onComplete: done })`

`done` 回调必须调——否则 Vue 卡在过渡态不渲染新页。

## 4. 动画语汇

集中在 `src/anim/motion-tokens.ts`、`src/anim/ease-curves.ts`、`src/anim/stagger-config.ts`，UI 层只引用不散落 magic number。

### 4.1 时长 / 距离 / 缓动

| 语义 | duration | translateY | scale | ease |
|---|---|---|---|---|
| `entry-soft`（卡片入场） | 480ms | 20px → 0 | 0.92 → 1 | `back.out(1.4)` |
| `entry-strong`（Hero CTA） | 520ms | 8px → 0 | 0.92 → 1 | `back.out(1.6)` |
| `fade-only`（Markdown 容器） | 360ms | 12px → 0 | 1 | `power2.out` |
| `leave-quick`（路由退场） | 200ms | 0 → -10px | 1 | `power2.in` |
| `enter-page`（路由登场） | 340ms | 14px → 0 | 0.985 → 1 | `back.out(1.1)` |
| `hover-lift`（卡悬停） | 300ms | -4px | 1.02 | `back.out(1.2)` |
| `press-squish`（卡按下） | 200ms | 0 | 0.94 → 1 | `power3.out` |

Stagger：卡片区 50ms，TOC 项 40ms，Hero 多元素间隔 110ms。

### 4.2 自定义缓动

`src/anim/ease-curves.ts` 用 GSAP `CustomEase.create()` 注册：

- `softBack` ≈ `back.out(1.4)` 输出表
- `softBackStrong` ≈ `back.out(1.6)` 输出表

在多场景复用同一份曲线，避免 magic number 散落。

### 4.3 与现有 CSS `transition` 的协调

现有 `ClayCard / ClayButton / CategoryChip` 的 `:hover` 已有 `transition: transform ...`。GSAP 接管 `transform` 时，会**瞬时覆盖** CSS——为避免抖动，被 GSAP 接管的属性必须用 `gsap.set` 设初值，确保首帧由 GSAP 决定状态。

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
src/anim/
├── motion-tokens.ts       # 4.1 节那张表 + stagger 表的 TS 常量
├── ease-curves.ts         # softBack / softBackStrong 的 CustomEase 注册
└── stagger-config.ts      # 集中 stagger 步距与起点延迟

src/composables/
├── useGsapScene.ts        # 3.3 节契约 + gsap.context 清理
├── useReducedMotion.ts    # matchMedia('(prefers-reduced-motion: reduce)') reactive
└── useStaggerReveal.ts    # "一群子节点依次入场"的薄封装,默认 softBack 参数

tests/
├── useGsapScene.test.ts
├── useReducedMotion.test.ts
├── useStaggerReveal.test.ts
└── choreo-smoke.test.ts   # 断言每个 view 的入场动画在 mount 后被调度
```

### 5.3 修改文件

| 文件 | 修改 |
|---|---|
| `src/main.ts` | 入口顶部调 `gsap.registerPlugin(ScrollTrigger)`，早于 `app.mount()` |
| `src/App.vue` | `RouterView` v-slot + `<Transition>` + `onEnter`/`onLeave` 钩子 |
| `src/styles/tokens.css` | 增 `--motion-duration-fast/base/slow` 等令牌，未来可由 JS 同步读 |
| `src/components/home/HeroSection.vue` | `useStaggerReveal` 应用到标题/CTA |
| `src/components/home/CategorySection.vue` | 进入视口时对所属卡片 stagger 入场 |
| `src/components/home/PatternCard.vue` 或 `ClayCard.vue` | hover/click GSAP 接管（移除 CSS transform transition） |
| `src/components/pattern/PatternHeader.vue` | 进入视口时入场动画 |
| `src/components/pattern/MarkdownRenderer.vue` | 内容更新后 `ScrollTrigger.refresh()`；h2/h3/img/pre 入视口浮现 |
| `src/components/pattern/PatternToc.vue` | TOC 项淡入**仅首次 mount 触发**；路由切换的整页 fade 已包含 TOC 区，TOC 内部不再独立 fade，避免动画叠加 |
| `src/views/HomeView.vue` | 编排"先 Hero 后 Catalog"两段时间线 |
| `src/views/PatternView.vue` | 编排"Header → Markdown → TOC"三段时间线 |

### 5.4 不修改的文件

- `src/composables/useMarkdown.ts` / `useToc.ts`——它们只产数据，不渲染 DOM 动画
- `src/data/*`——纯数据，与动效无关

## 6. 编排时间线

### 6.1 HomeView 进场

```
t=0     Hero 标题       y 16→0, opacity 0→1, 600ms power2.out
t=120   Hero CTA 按钮    scale 0.92→1, 520ms back.out(1.6)
t=200   Category 1 标题  y 12→0, 380ms softBack
t=200   卡片 #1          y 20→0, scale 0.92→1, 480ms softBack
                       stagger 50ms 至 #N
                       由 gsap.context().add() 注册
```

感知总时长约 1.4s，最后一张卡稳定后封面不再抢戏。

### 6.2 PatternView 进场

```
t=0     PatternHeader 块      fade+y, 360ms power2.out
t=120   Markdown 容器         fade+y, 360ms power2.out
t=200   TOC 容器              fade only, 260ms power2.out
                              （TOC 项即时可见，不延迟感）
```

### 6.3 滚动驱动（ScrollTrigger）

- 适用节点：`MarkdownRenderer` 内的 `h2`、`h3`、`img`、`pre`
- 触发：节点进入视口 `top 88%` 时启动
- 行为：`y 18px → 0` + `opacity 0 → 1`，420ms，`softBack`，`once: true`
- `ScrollTrigger.refresh()` 必须放在 `MarkdownRenderer` 的 `onUpdated` 钩子里调，确保 markdown 替换内容后锚点重算

### 6.4 页间过渡

`<Transition mode="out-in">` 让出整两段时间，钩子里跑 GSAP（见 3.4）。

### 6.5 微交互

- `ClayCard`：
  - `@pointerenter`：`gsap.to(el, { y: -4, scale: 1.02, duration: 0.3, ease: 'back.out(1.2)' })`
  - `@pointerleave`：`gsap.to(el, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })`
  - `@pointerdown`：`gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.2, ease: 'power3.out' })`
- `ClayButton`：hover 同卡片，press 缩 0.96。
- 用 `@pointer*` 不带 delay，避免视觉走样。

## 7. `prefers-reduced-motion` 处理

`useReducedMotion()` 暴露 `Ref<boolean>`，包裹 `matchMedia('(prefers-reduced-motion: reduce)')`，系统设置改变时跟随 reactive 更新。

`useGsapScene` 的 build 回调**同时拿到 `rm` 标记**，动画作者做一次性短路：

```ts
useGsapScene(root, (tl, rm) => {
  if (rm.value) {
    gsap.set(root.value!, { opacity: 1, y: 0, scale: 1 })
    return
  }
  tl.from(root.value!.querySelectorAll('.card'), {
    y: 20, scale: 0.92, opacity: 0, duration: 0.48,
    ease: 'back.out(1.4)', stagger: 0.05,
  })
})
```

Hero 退化为纯透明渐变，路由过渡退化为纯不透明切换，滚动驱动禁用 ScrollTrigger。

## 8. 数据流

```
系统 prefers-reduced-motion 变化
        │
        ▼  matchMedia reactive
useReducedMotion()  →  Ref<boolean>
        │
        ├─→ useGsapScene(root, build)  ← 组件 onMounted
        │       │
        │       ▼  build(tl, rm)
        │           gsap.from(sel, vars) / tl.from()
        │
        ▼  路由变化 → <Transition> 钩子 → GSAP tl → done()
```

## 9. 错误处理

| 边界 | 处理 |
|---|---|
| `root.value` 在 `onMounted` 仍未挂上 | `console.warn('[anim] root not ready')` 后 return，不抛错 |
| ScrollTrigger 在 markdown 还没渲染完时计算位置 | MarkdownRenderer 的 `onUpdated` 钩子里调 `ScrollTrigger.refresh()` |
| 路由快速来回切换，前一个过渡未 done | 过渡钩子用 `isLeaving` flag 防重入；GSAP 同名 timeline 默认覆盖 |
| 动画过程中目标元素被卸载 | `gsap.context().revert()` 批量 kill，无悬空监听 |
| 浏览器不支持 `matchMedia` | `useReducedMotion` 直接返回 `ref(false)`，视作可动效 |
| 懒加载 / CodeSplit 下 GSAP 未 ready | 顶层 `main.ts` 在 mount 前 `gsap.registerPlugin(ScrollTrigger)` |
| 滚动触发器监听错乱 | `ctx.revert()` 已含 ScrollTrigger 实例清理 |
| 用户 prefers-reduced-motion 切换中触发动画 | `useGsapScene` 内部 watch rm.value，在重 mount 或新事件触发时短路 |

## 10. 测试策略

| 层 | 用例 | 工具 |
|---|---|---|
| Composables | `useGsapScene` 自动 cleanup；`useReducedMotion` mock matchMedia；`useStaggerReveal` 调度顺序 | Vitest + jsdom |
| Choreography smoke | 每个 view mount 后断言 `gsap.globalTimeline.getChildren()` 非空 | Vitest + @vue/test-utils |
| `MarkdownRenderer` 滚动 | mock `IntersectionObserver`，断言 ScrollTrigger 实例被创建 | Vitest |
| 视觉回归（独立 PR） | Playwright 截图首页首帧 / 路由切换帧 / 详情页滚动 | Playwright |

重要原则：**测试只断言"动画被调度了"**——不验证 easing 数值是否一致。jsdom 里时序断言不可靠。

## 11. 实现顺序

1. 安装 `gsap` + 配置 `tsconfig.app.json` types；`main.ts` register ScrollTrigger
2. 新建 `motion-tokens.ts` / `ease-curves.ts` / `stagger-config.ts`
3. 新建 `useReducedMotion.ts` + 单测
4. 新建 `useGsapScene.ts` + 单测
5. 新建 `useStaggerReveal.ts` + 单测
6. 改 `App.vue`：`<RouterView v-slot>` + `<Transition>` + 钩子
   - 在 `<script setup>` 里维护 `isLeaving = ref(false)`；`onLeave` 设置为 `true`、`onComplete` 重置 `false`；`onEnter` 仅在 `!isLeaving.value` 时执行
7. 改 `HeroSection.vue` 入场
8. 改 `CategorySection.vue` / `PatternCard.vue` 入场 + 微交互
9. 改 `PatternHeader.vue` + `MarkdownRenderer.vue` 入场 + 滚动驱动
10. 跑 `npm test` + `npm run build`，修类型 / 单元 / 视觉

## 12. 风险与权衡

| 风险 | 缓解 |
|---|---|
| GSAP bundle 增量 ~30-40KB gzipped | 可接受；按需 register，不引付费插件 |
| CSS `transition` 与 GSAP `transform` 冲突 | 接管的属性必须 `gsap.set` 设初值，文档里点名 |
| 详情页大量节点注册 ScrollTrigger 影响性能 | `once: true` + `cleanup` 一并降低；按章节 stagger 不按段落 |
| 用户偏好降效时仍走完整时间线 | `useReducedMotion` 短路为 `set` 终态 |
| jsdom 无法测交互动画 | 单元测调度，视觉另起 Playwright |
| `verbatimModuleSyntax` 严格模式下 GSAP 类型导入 | `import type { gsap }` 单独行 |

## 13. 非目标（明确不做）

- 不引入付费 GSAP 插件（`MorphSVGPlugin`、`DrawSVGPlugin`、`SplitText` 等）
- 不重构 `ClayCard` / `ClayButton` 的视觉设计
- 不动 `MarkdownRenderer` 的 markdown 解析逻辑（只在挂载完成后 `refresh`）
- 不改路由结构或 history fallback
- 不引入 `@vueuse/motion` 或 `framer-motion` 之类的多库
