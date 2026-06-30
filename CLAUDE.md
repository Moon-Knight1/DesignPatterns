# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Project Overview

交互式中文 GoF 23 种设计模式学习手册。基于 Vue 3 + Vite + TypeScript 构建，markdown-it 渲染 `theory/*.md`，部署到 GitHub Pages。源码仓库: `Moon-Knight1/DesignPatterns`。

## 2. Commands

```bash
npm run dev          # 开发服务器 + 打开浏览器 (默认 http://localhost:5173)
npm run build        # vue-tsc 类型检查 + vite build,产出 dist/
npm run typecheck    # 仅类型检查 (vue-tsc -b --noEmit)
npm test             # 单次运行 Vitest (CI 用)
npm run test:watch   # Vitest watch 模式
npm run preview      # 预览 dist 产物
```

**单测**: `npx vitest run tests/useMarkdown.test.ts` (Vitest 支持按文件过滤)
**新增 pattern 后必跑**: `npm test` + `npm run build`(构建会校验类型与构建完整性)

## 3. Architecture

路由采用 **hash 模式**(`createWebHashHistory`),因为 GitHub Pages 不支持 SPA 的 history fallback。

```
src/
├── main.ts                  # 入口,按 tokens → reset → global → prose 顺序加载 CSS
├── App.vue                  # 根布局(skip-link + RouterView)
├── router/index.ts          # 3 条路由: / · /pattern/:slug · /about,未匹配回退到 /
├── views/                   # 页面级组件: HomeView / PatternView / AboutView
├── components/
│   ├── layout/              # Container · SiteHeader · SiteFooter
│   ├── home/                # HeroSection · PatternCatalog · CategorySection · PatternCard
│   ├── pattern/             # PatternHeader · MarkdownRenderer · PatternToc · PatternFooterNav
│   └── ui/                  # CategoryChip · ClayButton · ClayCard(橡皮泥拟物风格原子组件)
├── composables/
│   ├── useMarkdown.ts       # markdown-it + anchor + GithubSlugger;支持响应式源
│   └── useToc.ts            # DOMParser 抽取 h2/h3 作为目录
├── data/
│   ├── patterns.ts          # 23 条 pattern 的清单 + 分类元数据 + getPrev/getNext 链
│   └── markdown.ts          # 构建期 import.meta.glob 预加载 theory/*.md 为 raw 字符串
├── types/pattern.ts         # PatternCategory + Pattern 类型契约
└── styles/                  # tokens.css (CSS 变量) · reset.css · global.css · prose.css

theory/*.md                 # 23 篇 pattern 长文,Refactoring Guru 中文版风格
imgs/                       # pattern 配图,构建期被 vite-plugin-static-copy 拷到 dist/imgs/
tests/                      # Vitest 用例,覆盖 patterns 清单 · useMarkdown · useToc · 响应式
```

**关键数据流**: `PatternView` → `markdownBySlug[slug]` (data/markdown.ts) → `useMarkdown(source)` (响应式) → `MarkdownRenderer` 渲染 + `PatternToc` 抽目录。

## 4. Conventions

- **TypeScript 严格模式**: `strict` + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax`(必须用 `import type { ... }` 导入纯类型)。
- **路径别名**: `@/` → `src/`(配置见 `tsconfig.app.json` 与 `vite.config.ts`)。
- **样式**: 颜色/间距/圆角/阴影/字体一律用 `src/styles/tokens.css` 的 CSS 自定义变量,**禁止硬编码**。
- **CSS 顺序** (main.ts 决定): `tokens.css` → `reset.css` → `global.css` → `prose.css`,新增全局样式需插入到正确位置。
- **路由 hash**: 永远不要切换到 `createWebHistory` — GitHub Pages 静态托管下非 hash 路由会 404。
- **新增 pattern**: 在 `theory/<slug>.md` 写文章 → 在 `src/data/patterns.ts` 的 `patterns` 数组追加条目(注意 order 与 category)→ `getPrev/getNext` 自动连入上一/下一篇。
- **类目配额**: 创建型 5 / 结构型 7 / 行为型 11,共 23;测试 `patterns.test.ts` 会硬约束数量与分布。
- **Markdown 配图**: 相对路径写 `](../imgs/<pattern>/xxx.png)`,`useMarkdown` 会自动改写为 `<BASE_URL>imgs/...`。
- **响应式源**: `useMarkdown(source)` / `useToc(html)` 调用时**必须传 `Ref<string>`**(如 `toRef(props, 'source')`),否则路由切换时内容会冻结。详见 `tests/markdown-renderer-reactivity.test.ts` 根因注释。

## 5. Hard Constraints

- **`vite.config.ts` 的 `base`**: production 为 `/DesignPatterns/`,开发为 `/`。修改后所有 `BASE_URL` 派生链接会变。
- **Theory 文件命名**: 必须落在 `theory/<slug>.md` 且 slug 与 `data/patterns.ts` 中完全一致,否则 `data/markdown.ts` 的 `import.meta.glob` 抓不到 → 详情页空白。
- **`imgs/` 通过 `vite-plugin-static-copy` 拷贝**: 不要改成 `public/imgs/`,否则 `useMarkdown` 的路径改写会错位。
- **GitHub Pages 部署**: 推 `main` 即触发 `.github/workflows/deploy.yml`(Node 24、configure-pages v6、upload-pages-artifact v5)。**不要在 PR 触发部署**,workflow 只监听 push 与 workflow_dispatch。
- **`.gitignore` 已忽略**: `node_modules/`、`dist/`、`*.tsbuildinfo`、`__pycache__/`(本地 `download_images.py` 运行时产物)、`.vscode/`、`.idea/`。**不要把这些加回来**。

## 6. Gotchas

- **`theory/*.md` 的段落分隔符** 是 `- \n**bold** text` 这种空列表项写法。`useMarkdown` 内部已经把行首独立 `- ` 折叠成空行,**否则 markdown-it 会把前一段提升为 `<h2>`**(setext heading 下划线),目录会被污染。改 Markdown 内容时务必验证 `tests/useMarkdown.test.ts` 的 "does not promote paragraphs to h2" 用例。
- **`useMarkdown` 的 `GithubSlugger` 每次调用都新建**:`slugger` 是有状态的(`occurrences` 记录重名),跨页面复用会让相同标题共用同一个 id,锚点错位。
- **路由切换 + 响应式丢失**: `MarkdownRenderer.vue` 与 `PatternToc.vue` 已用 `toRef(props, '...')` 修复响应式 — 任何新增的组件**只要把 `useMarkdown`/`useToc` 输出绑到模板上,同样必须用 `toRef`**。直接传字符串 props 会让首屏内容冻在路由切换后的旧页。
- **`imgs/` 路径大小写**: 在 Windows 上开发时大小写不敏感,但 GitHub Pages 是 Linux,引用务必与文件名完全一致(参见 `vite-plugin-static-copy` 行为)。
- **`MarkdownRenderer` 的图片 fallback**: `@error.capture` 监听图片加载失败并替换为 clay 拟物 span。新增图片处理逻辑前看一遍这块的事件委托 — 不要在子组件再绑 `@load`,会重复触发骨架移除。
- **`verbatimModuleSyntax` 陷阱**: `import { type Foo } from '...'` 与 `import type { Foo } from '...'` 是两种合法写法,但**默认值与类型混在同一行会报错**。如不确定,用单独 `import type` 行。