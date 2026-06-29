# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

一个面向中文读者的 GoF 设计模式交互式学习手册。Vue 3 + Vite + TypeScript 单页应用，部署在 GitHub Pages：`https://moon-knight1.github.io/DesignPatterns/`。

## 技术栈

- **构建**：Vite + `@vitejs/plugin-vue`，TypeScript，`vue-tsc`
- **框架**：Vue 3 + `vue-router` 4（**hash 模式**，见下方架构说明）
- **内容渲染**：`markdown-it` + `markdown-it-anchor` + `github-slugger`
- **图标**：`lucide-vue-next`；`@vueuse/head` 处理 SEO
- **测试**：Vitest + `@vue/test-utils` + `jsdom`
- **静态资源**：`vite-plugin-static-copy` 把 `imgs/**/*` 复制到产物根

## 目录结构与职责

```
src/
  main.ts                      # 应用入口：挂载 head 插件、router、加载 4 个 CSS
  App.vue                      # 顶层外壳：skip-link + <RouterView>
  router/index.ts              # hash 模式路由：/, /pattern/:slug, /about
  data/
    patterns.ts                # 22 个模式的元数据（slug/中英文标题/分类/摘要/order）
                              # 以及分类聚合、getPattern/getPrev/getNext 工具
    markdown.ts                # 构建期 import.meta.glob('../../theory/*.md', { eager: true, query: '?raw' })
                              # 把 theory/*.md 编译为 markdownBySlug Record
  composables/
    useMarkdown.ts             # markdown-it 实例化 + 预处理（路径重写、清理空列表项）
    useToc.ts                  # DOMParser 解析 h2/h3，构建 TOC
  views/                       # HomeView / PatternView / AboutView
  components/
    layout/                    # Container / SiteHeader / SiteFooter
    home/                      # HeroSection / CategorySection / PatternCard / PatternCatalog
    pattern/                   # PatternHeader / MarkdownRenderer / PatternToc / PatternFooterNav
    ui/                        # CategoryChip / ClayButton / ClayCard
  styles/
    tokens.css                 # 设计 tokens（CSS 变量）
    reset.css / global.css / prose.css
  types/pattern.ts             # Pattern / PatternCategory 类型
tests/                         # Vitest 单元测试
theory/                        # 22 个模式的 Markdown 原文
imgs/<pattern-slug>/           # 模式示意图
public/                        # 静态资源（favicon 等）
.github/workflows/deploy.yml   # 推 main → build → deploy GitHub Pages
```

路径别名：`@` → `src/`（同时在 `tsconfig.app.json` 与 `vite.config.ts` 声明）。

## 架构要点

### 内容管线

- 模式元数据定义在 `src/data/patterns.ts`，是单一事实来源。
- `src/data/markdown.ts` 在构建期用 `import.meta.glob` 将所有 Markdown 原文以字符串形式打包；运行时无需网络请求。
- `useMarkdown`（`src/composables/useMarkdown.ts`）对每篇 Markdown 做字符串预处理：
  1. 将 `](../imgs/` 替换为 `]({BASE_URL}imgs/`，使图片路径在开发与生产（base 不同）下均有效。
  2. 清理作为段落分隔符的单独 `- `，避免被误判为 setext 标题导致 TOC 污染。
- 然后交给 `markdown-it` 渲染。

### 路由

- 使用 `createWebHashHistory`（配合 GitHub Pages 静态托管）。
- `scrollBehavior` 处理滚动位置保留、锚点平滑滚动。
- 未知路径重定向到 `/`。

### 详情页结构（`PatternView.vue`）

- 布局：`<Container>` → `<PatternHeader>`（面包屑 + 分类 + 标题）→ `<div class="layout">`（CSS Grid：主内容区 + TOC 侧边栏，≥1024px 显示）→ `<MarkdownRenderer>` + `<PatternToc>` → `<PatternFooterNav>`（上一/下一篇）。

### `MarkdownRenderer.vue` 的图片处理

- 使用 `v-html` 渲染，因此用事件委托监听图片加载/错误（`load` 冒泡，`error` 需 capture）。
- 渲染前为每张 `<img>` 注入 `<span class="image-skeleton">` 占位；加载成功移除 skeleton，失败则替换为 fallback 元素。
- 自动添加 `loading="lazy"` 与 `decoding="async"`。
- TOC 锚点点击：阻止默认跳转，改用 `scrollIntoView({ behavior: 'smooth' })` 并更新 URL hash（使用 `replaceState`）。

### 部署与基础路径

- `vite.config.ts`：`base` 在生产环境为 `/DesignPatterns/`，开发为 `/`。
- `vite-plugin-static-copy` 将 `imgs/**/*` 复制到 `dist/imgs/`。
- GitHub Actions：推 `main` 自动构建并部署 `dist/`。

## 代码规范

- TypeScript 严格模式 + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax`。`import type` 需显式标注。
- 组件使用 `<script setup lang="ts">`，props 用 `defineProps<{…}>()`。
- 路径统一 `@/...`，避免相对 `../../`。
- 样式值一律从 `src/styles/tokens.css` 的 CSS 变量获取，禁止硬编码。
- 分类（`creational` / `structural` / `behavioral`）对应的 CSS 变量与图标已在 `src/data/patterns.ts` 中定义。
- 内联锚点点击统一使用 `MarkdownRenderer` 的 `onAnchorClick` 实现平滑滚动。
- 避免引入非必要的第三方库（如 lodash、date-fns）。

## 工作流约束

### 改模式元数据 / 新增 / 移除模式

- 修改 `src/data/patterns.ts` 和对应的 `theory/<slug>.md`，两者 slug 必须一致。
- 新增时：创建 `theory/<slug>.md` → 在 `patterns.ts` 中注册（指定 `category` 与 `order`）。
- 移除时：删除 `patterns.ts` 中的条目、删除 `theory/<slug>.md` 以及 `imgs/<slug>/` 目录。

### 改 Markdown 渲染

- 修改 `markdown-it` 全局配置只应在 `useMarkdown.ts` 中进行。
- 图片路径只能使用 `../imgs/<slug>/<file>` 形式，如有新路径写法需在 `useMarkdown.test.ts` 中添加用例。

### 改静态部署

- 修改 `vite.config.ts` 的 `base` 或 `vite-plugin-static-copy` 目标时，确保 GitHub Pages 路径仍能正确解析。
- 修改 CI 配置前请确认 GitHub Actions 官方推荐的最新 actions 版本。

### 严禁操作

- 不要删除 `theory/` 下的 `.md` 或 `imgs/<slug>/` 下的图片而不更新 `patterns.ts`（会导致 404）。
- 不要修改路径别名而不同步 `vite.config.ts` 与 `tsconfig.app.json`。
- 不要在 `theory/*.md` 中引入新的“段落分隔”语法（应保持现有的 `- ` 约定）。
- 不要将 `import.meta.env.BASE_URL` 替换为硬编码 `/DesignPatterns/`，否则会破坏本地开发环境。
