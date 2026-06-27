# GoF Design Patterns Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese-language Vue 3 + Vite static site that renders the 23 GoF design pattern Markdown files in `theory/` with a claymorphism UI, deployed to GitHub Pages at `https://moon-knight1.github.io/DesignPatterns/`.

**Architecture:** Single-page application with hash routing (no 404 fallback needed on GH Pages). Markdown is bundled at build time via `import.meta.glob`, rendered at runtime with `markdown-it` + `markdown-it-anchor`. A hardcoded `patterns.ts` manifest maps each slug to category/title/order; `interpreter.md` is excluded (empty file). Image assets in `imgs/` are copied to `dist/imgs/` at build time via `vite-plugin-static-copy` (Vite's `publicDir` does not accept arrays). `@vueuse/head` is installed as a Vue plugin in `main.ts` to drive per-route SEO metadata.

**Tech Stack:** Vue 3.5 + TypeScript 5.5 + Vite 5.4 + vue-router 4.4 (hash mode) + markdown-it 14 + markdown-it-anchor 9 + github-slugger 2 + lucide-vue-next 0.460 + @vueuse/head 2 + vite-plugin-static-copy 1.0.6 + Vitest 2 for unit tests.

---

## Global Constraints

These apply to every task below. Read this list once — every later requirement implicitly assumes it.

- **Repo root:** `D:\Projects\DesignPatterns\` (Windows, Git Bash shell). Working directory is the repo root unless stated otherwise.
- **Python for scripts:** `D:\Developer\Anaconda3\python.exe` (not bare `python`).
- **Node version:** 20 LTS (matches CI workflow).
- **npm scripts:** `dev`, `build` (runs `vue-tsc --noEmit && vite build`), `preview`, `typecheck`, `test` (Vitest).
- **No emoji as icons.** Use `lucide-vue-next`.
- **No fabricated content.** `theory/interpreter.md` is empty and must not be invented. The site shows 22 patterns.
- **Image references in `theory/*.md`** use the literal pattern `](../imgs/<pattern>/<file>.png)`. The renderer rewrites this to `${import.meta.env.BASE_URL}imgs/<pattern>/<file>.png` at runtime.
- **All UI copy is Chinese.** English appears only as pattern subtitles (e.g., "Singleton") and in code blocks.
- **Routing:** `createWebHashHistory(import.meta.env.BASE_URL)`. URLs look like `/#/pattern/observer`.
- **Vite `base`:** `/DesignPatterns/` in production, `/` in dev.
- **Hash routing advantage:** No `404.html` fallback needed on GH Pages; refresh on any deep link works natively.
- **Pastel cream background:** `#FFF7F0` (`--bg-cream`). No dark mode.
- **WCAG AA contrast required:** ≥4.5:1 for body text, ≥3:1 for icons/UI.
- **All dependencies installed via `npm install`.** Lockfile committed.
- **Commit after every task.** Use Conventional Commits (`feat:`, `chore:`, `test:`, `fix:`, `docs:`).
- **No tests required for presentational Vue components.** Unit tests are required only for `useMarkdown`, `useToc`, and the `patterns.ts` manifest logic (these have meaningful pure logic worth testing). Manual verification (per the spec's §11 checklist) covers the rest.

---

## File Structure

Files this plan creates or touches. Each task lists only its own files; this is the full map for context.

```
D:\Projects\DesignPatterns\
├── .github/
│   └── workflows/
│       └── deploy.yml                         (Task 16)
├── public/
│   └── favicon.svg                            (Task 1)
├── src/
│   ├── main.ts                                (Task 7)
│   ├── App.vue                                (Task 7)
│   ├── router/
│   │   └── index.ts                           (Task 6)
│   ├── views/
│   │   ├── HomeView.vue                       (Task 6 shell, Task 9 fill)
│   │   ├── PatternView.vue                    (Task 6 shell, Task 10 fill)
│   │   └── AboutView.vue                      (Task 6 shell, Task 11 fill)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SiteHeader.vue                 (Task 8)
│   │   │   ├── SiteFooter.vue                 (Task 8)
│   │   │   └── Container.vue                  (Task 8)
│   │   ├── home/
│   │   │   ├── HeroSection.vue                (Task 9)
│   │   │   ├── PatternCatalog.vue             (Task 9)
│   │   │   ├── CategorySection.vue            (Task 9)
│   │   │   ├── PatternCard.vue                (Task 9)
│   │   │   ├── ProgressDemo.vue               (Task 9)
│   │   │   └── CtaBanner.vue                  (Task 9)
│   │   ├── pattern/
│   │   │   ├── PatternHeader.vue              (Task 10)
│   │   │   ├── MarkdownRenderer.vue           (Task 10)
│   │   │   ├── PatternToc.vue                 (Task 10)
│   │   │   └── PatternFooterNav.vue           (Task 10)
│   │   └── ui/
│   │       ├── ClayButton.vue                 (Task 8)
│   │       ├── ClayCard.vue                   (Task 8)
│   │       └── CategoryChip.vue               (Task 8)
│   ├── composables/
│   │   ├── useMarkdown.ts                     (Task 4)
│   │   └── useToc.ts                          (Task 5)
│   ├── data/
│   │   ├── patterns.ts                        (Task 3)
│   │   └── markdown.ts                        (Task 4)
│   ├── types/
│   │   └── pattern.ts                         (Task 3)
│   └── styles/
│       ├── tokens.css                         (Task 2)
│       ├── reset.css                          (Task 2)
│       ├── prose.css                          (Task 10)
│       └── global.css                         (Task 2)
├── tests/
│   ├── patterns.test.ts                       (Task 3)
│   ├── useMarkdown.test.ts                    (Task 4)
│   └── useToc.test.ts                         (Task 5)
├── vite.config.ts                             (Task 1)
├── tsconfig.json                              (Task 1)
├── tsconfig.app.json                          (Task 1)
├── tsconfig.node.json                         (Task 1)
├── vitest.config.ts                           (Task 3)
├── index.html                                 (Task 1)
├── package.json                               (Task 1)
├── package-lock.json                          (generated by npm)
└── .gitignore                                 (modified, Task 1)
```

**Boundaries enforced by this plan:**

- `data/` is the single source of truth for pattern metadata; components never hardcode pattern lists.
- `composables/` contain pure logic; no DOM access outside `useToc` (which uses `DOMParser`, browser-only by design — guarded by `if (typeof window !== 'undefined')`).
- `views/` are thin shells composing `components/`; each view owns its `useHead()` call.
- `styles/tokens.css` defines all design tokens (colors, shadows, radii). Component styles reference these via `var(--token-name)`. No hardcoded hex/spacing in components.

---

## Task 1: Project scaffolding (Vite + Vue 3 + TS + Vitest)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts` (placeholder; final wiring in Task 7)
- Create: `src/App.vue` (placeholder; final in Task 7)
- Create: `public/favicon.svg`
- Create: `.gitignore` additions
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `npm run dev` that boots a Vue 3 page at `http://localhost:5173/` showing "scaffold ok". A working `npm test` and `npm run build`.

- [ ] **Step 1: Write `.gitignore` additions**

Append to the existing `.gitignore` (do not overwrite — it already exists per the repo). Read the current `.gitignore` first; then ensure these lines exist (add missing ones):

```
node_modules/
dist/
*.local
.DS_Store
coverage/
.vite/
```

Run `cat .gitignore` to verify, then proceed.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "design-patterns-site",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev":       "vite",
    "build":     "vue-tsc --noEmit && vite build",
    "preview":   "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "test":      "vitest run",
    "test:watch":"vitest"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "markdown-it": "^14.1.0",
    "markdown-it-anchor": "^9.2.0",
    "github-slugger": "^2.0.0",
    "lucide-vue-next": "^0.460.0",
    "@vueuse/head": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-vue": "^5.1.0",
    "vite-plugin-static-copy": "^1.0.6",
    "typescript": "^5.5.0",
    "vue-tsc": "^2.1.0",
    "vitest": "^2.1.0",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.0",
    "@types/markdown-it": "^14.1.2",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json` (root, solution-style)**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 4: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue", "tests/**/*"]
}
```

- [ ] **Step 5: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 6: Create `vite.config.ts` (minimal — full version in Task 12)**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/DesignPatterns/' : '/',
  plugins: [vue()],
  publicDir: 'public',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
}))
```

- [ ] **Step 7: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 8: Create `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="一份面向中文读者的交互式设计模式学习手册" />
    <title>23 种 GoF 设计模式 · 学习手册</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&family=Noto+Serif+SC:wght@600;700&family=Plus+Jakarta+Sans:wght@700&family=ZCOOL+KuaiLe&family=JetBrains+Mono&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 9: Create `public/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#FB923C"/>
  <text x="16" y="22" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#FFF7F0">23</text>
</svg>
```

- [ ] **Step 10: Create `src/main.ts` (scaffold placeholder)**

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

(Final wiring with router + head plugin comes in Task 7. For now this boots the placeholder.)

- [ ] **Step 11: Create `src/App.vue` (scaffold placeholder)**

```vue
<script setup lang="ts">
</script>

<template>
  <main>
    <h1>scaffold ok</h1>
  </main>
</template>
```

- [ ] **Step 12: Install dependencies**

Run from repo root:

```bash
cd D:/Projects/DesignPatterns && npm install
```

Expected: completes without errors. Generates `node_modules/` and `package-lock.json`.

- [ ] **Step 13: Verify dev server boots**

```bash
cd D:/Projects/DesignPatterns && timeout 8 npm run dev || true
```

Expected: Vite reports `Local: http://localhost:5173/` before the 8-second timeout kills it. No errors in output.

- [ ] **Step 14: Verify build works**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

Expected: builds `dist/` with `dist/index.html`, exits 0. No TypeScript errors.

- [ ] **Step 15: Verify test runner works**

Create a placeholder test file `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Then run:

```bash
cd D:/Projects/DesignPatterns && npm test
```

Expected: 1 test passes. Delete `tests/smoke.test.ts` after.

- [ ] **Step 16: Commit**

```bash
cd D:/Projects/DesignPatterns && git add .gitignore package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts index.html public/ src/
git commit -m "chore: scaffold Vue 3 + Vite + TS + Vitest project"
```

---

## Task 2: Design tokens & global styles

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/reset.css`
- Create: `src/styles/global.css`
- Modify: `src/main.ts` to import the stylesheets

**Interfaces:**
- Consumes: nothing
- Produces: design tokens (CSS custom properties) available app-wide via `:root` selector. Components reference `var(--token-name)`.

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  /* Surface */
  --bg-cream: #FFF7F0;
  --surface-card: #FFFFFF;

  /* Ink (text) — verified WCAG AA on --bg-cream */
  --ink-900: #1F2937;   /* primary text — 14.5:1 on cream */
  --ink-600: #4B5563;   /* secondary text — 7.5:1 on cream */
  --ink-400: #9CA3AF;   /* tertiary text / placeholder — 3.5:1, UI only */

  /* Categories */
  --cat-creational: #7DD3C0;
  --cat-creational-soft: #D4F1EA;
  --cat-structural: #A78BFA;
  --cat-structural-soft: #E5DDFB;
  --cat-behavioral: #FB923C;
  --cat-behavioral-soft: #FCE4CF;

  /* CTA */
  --cta-coral: #F97316;
  --cta-coral-soft: #FED7AA;
  --cta-coral-ink: #FFFFFF;

  /* Accents */
  --accent-yellow: #FCD34D;

  /* Radii */
  --radius-card: 24px;
  --radius-pill: 999px;
  --radius-soft: 16px;
  --radius-xs: 8px;

  /* Clay shadows */
  --shadow-clay-out: 8px 8px 16px rgba(0, 0, 0, 0.10), -8px -8px 16px rgba(255, 255, 255, 0.85);
  --shadow-clay-out-lg: 12px 12px 28px rgba(0, 0, 0, 0.12), -10px -10px 22px rgba(255, 255, 255, 0.9);
  --shadow-clay-in: inset 4px 4px 10px rgba(0, 0, 0, 0.08), inset -4px -4px 10px rgba(255, 255, 255, 0.9);
  --shadow-clay-press: inset 6px 6px 12px rgba(0, 0, 0, 0.12), inset -6px -6px 12px rgba(255, 255, 255, 0.95);
  --shadow-focus: 0 0 0 2px var(--cta-coral);

  /* Spacing scale (4pt / 8pt rhythm) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Typography */
  --font-display: 'ZCOOL KuaiLe', 'Noto Serif SC', serif;
  --font-heading: 'Noto Serif SC', serif;
  --font-body: 'Noto Sans SC', system-ui, -apple-system, sans-serif;
  --font-latin: 'Plus Jakarta Sans', sans-serif;
  --font-code: 'JetBrains Mono', ui-monospace, monospace;

  /* Container */
  --container-max: 1200px;
  --container-padding: 16px;

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 180ms;
  --duration-normal: 240ms;
  --duration-slow: 360ms;
}

@media (min-width: 768px) {
  :root {
    --container-padding: 24px;
  }
}

@media (min-width: 1024px) {
  :root {
    --container-padding: 32px;
  }
}
```

- [ ] **Step 2: Create `src/styles/reset.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img, picture, svg, video {
  display: block;
  max-width: 100%;
}

button, input, textarea, select {
  font: inherit;
  color: inherit;
}

button {
  background: none;
  border: none;
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

ul, ol {
  list-style: none;
}

:focus-visible {
  outline: 2px solid var(--cta-coral);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Create `src/styles/global.css`**

```css
body {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--ink-900);
  background-color: var(--bg-cream);
  background-image:
    radial-gradient(circle at 10% 10%, var(--cat-creational-soft) 0%, transparent 25%),
    radial-gradient(circle at 90% 30%, var(--cat-structural-soft) 0%, transparent 30%),
    radial-gradient(circle at 50% 90%, var(--cat-behavioral-soft) 0%, transparent 30%);
  background-attachment: fixed;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: var(--space-4);
  z-index: 1000;
  padding: var(--space-3) var(--space-5);
  background: var(--surface-card);
  color: var(--ink-900);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-clay-out);
  font-weight: 600;
  transition: top var(--duration-fast) var(--ease-out);
}

.skip-link:focus {
  top: var(--space-4);
}

@media (prefers-reduced-motion: no-preference) {
  body {
    transition: background-color var(--duration-normal) var(--ease-out);
  }
}
```

- [ ] **Step 4: Wire stylesheets into `src/main.ts`**

Replace the contents of `src/main.ts` with:

```ts
import { createApp } from 'vue'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 5: Update `src/App.vue` to include the skip link**

Replace `src/App.vue`:

```vue
<script setup lang="ts">
</script>

<template>
  <a class="skip-link" href="#main">跳转到主要内容</a>
  <main id="main">
    <h1>scaffold ok</h1>
  </main>
</template>
```

- [ ] **Step 6: Verify dev server renders with cream background**

```bash
cd D:/Projects/DesignPatterns && timeout 8 npm run dev || true
```

Expected: still boots at `http://localhost:5173/`. No CSS errors in console output.

- [ ] **Step 7: Verify TypeScript still passes**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/styles/ src/main.ts src/App.vue
git commit -m "feat(styles): add claymorphism design tokens and global styles"
```

---

## Task 3: Pattern data manifest + types

**Files:**
- Create: `src/types/pattern.ts`
- Create: `src/data/patterns.ts`
- Create: `tests/patterns.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `Pattern` TypeScript interface (consumed by composables, views, components)
  - `patterns: Pattern[]` — 22 entries, sorted within category by `order`
  - `categories: Record<PatternCategory, { zh, color, icon, items }>` — derived from `patterns`
  - `getPattern(slug)`, `getPrev(slug)`, `getNext(slug)` helpers (consumed by `PatternView`)

- [ ] **Step 1: Create `src/types/pattern.ts`**

```ts
export type PatternCategory = 'creational' | 'structural' | 'behavioral'

export interface Pattern {
  slug: string
  titleZh: string
  titleEn: string
  category: PatternCategory
  summary: string
  order: number
}
```

- [ ] **Step 2: Create `src/data/patterns.ts` (22 entries)**

```ts
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
  { slug: 'bridge',            titleZh: '桥接模式',         titleEn: 'Bridge',             category: 'structural', summary: '将抽象与实现分离，使二者可以独立变化。',                 order: 2 },
  { slug: 'composite',         titleZh: '组合模式',         titleEn: 'Composite',          category: 'structural', summary: '将对象组合成树形结构以表示部分-整体的层次结构。',       order: 3 },
  { slug: 'decorator',         titleZh: '装饰模式',         titleEn: 'Decorator',          category: 'structural', summary: '动态地给对象添加职责，比继承更灵活。',                   order: 4 },
  { slug: 'facade',            titleZh: '外观模式',         titleEn: 'Facade',             category: 'structural', summary: '为子系统中的一组接口提供一个统一的高层接口。',           order: 5 },
  { slug: 'flyweight',         titleZh: '享元模式',         titleEn: 'Flyweight',          category: 'structural', summary: '通过共享技术有效支持大量细粒度对象的复用。',             order: 6 },
  { slug: 'proxy',             titleZh: '代理模式',         titleEn: 'Proxy',              category: 'structural', summary: '为其他对象提供一种代理以控制对这个对象的访问。',         order: 7 },

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

// Linear chain across all 22 in category-then-order sequence (Creational 1→5, Structural 1→7, Behavioral 1→10)
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
```

- [ ] **Step 3: Write failing test `tests/patterns.test.ts`**

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
```

- [ ] **Step 4: Run tests — verify pass**

```bash
cd D:/Projects/DesignPatterns && npm test
```

Expected: 9 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/types/ src/data/ tests/patterns.test.ts
git commit -m "feat(data): add pattern manifest with 22 entries and unit tests"
```

---

## Task 4: Markdown loader & rendering composable

**Files:**
- Create: `src/data/markdown.ts`
- Create: `src/composables/useMarkdown.ts`
- Create: `tests/useMarkdown.test.ts`

**Interfaces:**
- Consumes: `Pattern` (for slug lookup), `import.meta.glob` Vite feature, `markdown-it` API
- Produces:
  - `markdownBySlug: Record<string, string>` — slug → raw MD source (consumed by `PatternView`)
  - `useMarkdown(source)` — composable returning `ComputedRef<string>` of rendered HTML (consumed by `MarkdownRenderer.vue`)

- [ ] **Step 1: Create `src/data/markdown.ts`**

```ts
// Build-time eager import of all theory/*.md as raw strings.
// Relative path (../../theory/) is canonical Vite form and robust across versions.
const raw = import.meta.glob('../../theory/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface SlugPath {
  path: string
  slug: string
  source: string
}

const allEntries: SlugPath[] = Object.entries(raw).map(([path, source]) => {
  const match = path.match(/\/([^/]+)\.md$/)
  if (!match) throw new Error(`Cannot extract slug from path: ${path}`)
  return { path, slug: match[1], source }
})

// Filter out the empty interpreter.md so the catalog shows 22 patterns.
export const markdownBySlug: Record<string, string> = Object.fromEntries(
  allEntries
    .filter(({ slug }) => slug !== 'interpreter')
    .map(({ slug, source }) => [slug, source])
)
```

- [ ] **Step 2: Create `src/composables/useMarkdown.ts`**

```ts
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import slugger from 'github-slugger'
import { computed, isRef, type ComputedRef, type Ref } from 'vue'

export function useMarkdown(source: string | Ref<string>): ComputedRef<string> {
  const src = isRef(source) ? source : { value: source } as Ref<string>

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
  }).use(anchor, {
    slugify: (s: string) => slugger.slug(s),
  })

  return computed(() => {
    const base = import.meta.env.BASE_URL || '/'
    const rewritten = src.value.replaceAll(
      '](../imgs/',
      `](${base}imgs/`,
    )
    return md.render(rewritten)
  })
}
```

- [ ] **Step 3: Write failing test `tests/useMarkdown.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useMarkdown } from '@/composables/useMarkdown'

describe('useMarkdown', () => {
  it('renders plain markdown to HTML', () => {
    const html = useMarkdown('# Hello').value
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
  })

  it('escapes raw HTML (no script injection)', () => {
    const html = useMarkdown('Hello <script>alert(1)</script>').value
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('adds slug ids to headings (preserves CJK verbatim)', () => {
    const html = useMarkdown('## 意图\n\n## 解决方案').value
    expect(html).toMatch(/id="意图"/)
    expect(html).toMatch(/id="解决方案"/)
  })

  it('rewrites relative imgs paths to BASE_URL-prefixed paths', () => {
    const md = '![observer](../imgs/observer/observer.png)'
    const html = useMarkdown(md).value
    // base is '/' in test env (vitest uses default import.meta.env)
    expect(html).toContain('src="/imgs/observer/observer.png"')
    expect(html).not.toContain('../imgs/')
  })

  it('rewrites every img reference, not just the first', () => {
    const md = '![a](../imgs/a/x.png) and ![b](../imgs/b/y.png)'
    const html = useMarkdown(md).value
    expect(html).toContain('src="/imgs/a/x.png"')
    expect(html).toContain('src="/imgs/b/y.png"')
  })

  it('preserves code fences', () => {
    const md = '```\nclass Foo\n```'
    const html = useMarkdown(md).value
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('class Foo')
  })

  it('auto-links bare URLs', () => {
    const html = useMarkdown('Visit https://example.com today.').value
    expect(html).toContain('href="https://example.com"')
  })

  it('responds to reactive source changes', () => {
    const src = ref('# First')
    const html = useMarkdown(src)
    expect(html.value).toContain('First')
    src.value = '# Second'
    expect(html.value).toContain('Second')
  })
})
```

- [ ] **Step 4: Run tests — verify pass**

```bash
cd D:/Projects/DesignPatterns && npm test
```

Expected: all 8 new tests pass, plus the 9 from Task 3 (17 total).

- [ ] **Step 5: Verify typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/data/markdown.ts src/composables/useMarkdown.ts tests/useMarkdown.test.ts
git commit -m "feat(markdown): add markdown loader and rendering composable with tests"
```

---

## Task 5: TOC extraction composable

**Files:**
- Create: `src/composables/useToc.ts`
- Create: `tests/useToc.test.ts`

**Interfaces:**
- Consumes: rendered HTML string
- Produces: `useToc(html)` returning `ComputedRef<Array<{ level: 2 | 3, id: string, text: string }>>` (consumed by `PatternToc.vue`)

- [ ] **Step 1: Create `src/composables/useToc.ts`**

```ts
import { computed, isRef, type ComputedRef, type Ref } from 'vue'

export interface TocEntry {
  level: 2 | 3
  id: string
  text: string
}

export function useToc(html: string | Ref<string>): ComputedRef<TocEntry[]> {
  const src = isRef(html) ? html : { value: html } as Ref<string>

  return computed<TocEntry[]>(() => {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return []
    }
    const doc = new DOMParser().parseFromString(src.value, 'text/html')
    const headings = doc.querySelectorAll('h2, h3')
    const out: TocEntry[] = []
    headings.forEach((h) => {
      const id = h.getAttribute('id')
      if (!id) return
      out.push({
        level: h.tagName === 'H2' ? 2 : 3,
        id,
        text: (h.textContent || '').trim(),
      })
    })
    return out
  })
}
```

- [ ] **Step 2: Write failing test `tests/useToc.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { useToc } from '@/composables/useToc'

const SAMPLE_HTML = `
  <h2 id="意图">意图</h2>
  <p>...</p>
  <h2 id="解决方案">解决方案</h2>
  <h3 id="步骤一">步骤一</h3>
  <h3 id="步骤二">步骤二</h3>
  <h2 id="结构">结构</h2>
  <h4 id="ignored">ignored</h4>
`

describe('useToc', () => {
  it('extracts h2 and h3 with their ids and text', () => {
    const toc = useToc(SAMPLE_HTML).value
    expect(toc).toHaveLength(5)
    expect(toc[0]).toEqual({ level: 2, id: '意图',    text: '意图' })
    expect(toc[1]).toEqual({ level: 2, id: '解决方案', text: '解决方案' })
    expect(toc[2]).toEqual({ level: 3, id: '步骤一',   text: '步骤一' })
  })

  it('ignores headings without an id', () => {
    const toc = useToc('<h2>no id</h2><h2 id="x">x</h2>').value
    expect(toc).toHaveLength(1)
    expect(toc[0].id).toBe('x')
  })

  it('ignores h1, h4, h5, h6', () => {
    const toc = useToc('<h1 id="a">a</h1><h4 id="b">b</h4><h6 id="c">c</h6>').value
    expect(toc).toHaveLength(0)
  })

  it('returns empty array for empty html', () => {
    expect(useToc('').value).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests — verify pass**

```bash
cd D:/Projects/DesignPatterns && npm test
```

Expected: 4 new tests pass (21 total).

- [ ] **Step 4: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/composables/useToc.ts tests/useToc.test.ts
git commit -m "feat(composables): add useToc with tests"
```

---

## Task 6: Vue Router setup + empty view shells

**Files:**
- Create: `src/router/index.ts`
- Create: `src/views/HomeView.vue` (placeholder)
- Create: `src/views/PatternView.vue` (placeholder)
- Create: `src/views/AboutView.vue` (placeholder)

**Interfaces:**
- Consumes: nothing (Task 7 wires router into app)
- Produces: `router` instance (consumed by `main.ts` in Task 7). Three route components (placeholders filled by Tasks 9, 10, 11).

- [ ] **Step 1: Create `src/router/index.ts`**

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    { path: '/',              component: () => import('@/views/HomeView.vue'),   name: 'home' },
    { path: '/pattern/:slug', component: () => import('@/views/PatternView.vue'), name: 'pattern', props: true },
    { path: '/about',         component: () => import('@/views/AboutView.vue'),   name: 'about' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
```

- [ ] **Step 2: Create placeholder views**

`src/views/HomeView.vue`:

```vue
<script setup lang="ts">
</script>

<template>
  <div>home placeholder</div>
</template>
```

`src/views/PatternView.vue`:

```vue
<script setup lang="ts">
defineProps<{ slug: string }>()
</script>

<template>
  <div>pattern placeholder: {{ slug }}</div>
</template>
```

`src/views/AboutView.vue`:

```vue
<script setup lang="ts">
</script>

<template>
  <div>about placeholder</div>
</template>
```

- [ ] **Step 3: Typecheck**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/router/ src/views/
git commit -m "feat(router): add vue-router with hash history and three route shells"
```

---

## Task 7: main.ts + App.vue — wire router and @vueuse/head

**Files:**
- Modify: `src/main.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `router` (from Task 6), `createHead` from `@vueuse/head`
- Produces: a fully booted Vue app with router + head plugin installed, mounted to `#app`

- [ ] **Step 1: Replace `src/main.ts`**

```ts
import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
const head = createHead()

app.use(head)
app.use(router)
app.mount('#app')
```

- [ ] **Step 2: Replace `src/App.vue`**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#main">跳转到主要内容</a>
  <RouterView />
</template>
```

- [ ] **Step 3: Verify dev server + navigation**

```bash
cd D:/Projects/DesignPatterns && timeout 10 npm run dev || true
```

In another terminal (or manually in a browser if running locally): visit `http://localhost:5173/#/` → "home placeholder". Visit `http://localhost:5173/#/pattern/observer` → "pattern placeholder: observer". Visit `http://localhost:5173/#/about` → "about placeholder". Visit `http://localhost:5173/#/nonsense` → redirected to `/`.

- [ ] **Step 4: Typecheck + build**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck && npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/main.ts src/App.vue
git commit -m "feat(app): wire router and @vueuse/head in main.ts"
```

---

## Task 8: Layout primitives + UI components

**Files:**
- Create: `src/components/ui/ClayButton.vue`
- Create: `src/components/ui/ClayCard.vue`
- Create: `src/components/ui/CategoryChip.vue`
- Create: `src/components/layout/Container.vue`
- Create: `src/components/layout/SiteHeader.vue`
- Create: `src/components/layout/SiteFooter.vue`

**Interfaces:**
- Consumes: design tokens from `src/styles/tokens.css`, Lucide icons
- Produces: 6 reusable components consumed by views in Tasks 9–11

- [ ] **Step 1: Create `src/components/ui/ClayButton.vue`**

```vue
<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  to?: string
  href?: string
  type?: 'button' | 'submit'
}>()
</script>

<template>
  <RouterLink v-if="to" :to="to" class="clay-button" :data-variant="variant ?? 'primary'">
    <slot />
  </RouterLink>
  <a v-else-if="href" :href="href" class="clay-button" :data-variant="variant ?? 'primary'" target="_blank" rel="noopener">
    <slot />
  </a>
  <button v-else :type="type ?? 'button'" class="clay-button" :data-variant="variant ?? 'primary'">
    <slot />
  </button>
</template>

<style scoped>
.clay-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  line-height: 1;
  box-shadow: var(--shadow-clay-out);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
  cursor: pointer;
  user-select: none;
}

.clay-button[data-variant='primary'] {
  background: var(--cta-coral);
  color: var(--cta-coral-ink);
}

.clay-button[data-variant='secondary'] {
  background: var(--surface-card);
  color: var(--ink-900);
}

.clay-button[data-variant='ghost'] {
  background: transparent;
  box-shadow: none;
  color: var(--ink-900);
}

.clay-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-clay-out-lg);
}

.clay-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-clay-press);
}

.clay-button:focus-visible {
  outline: 2px solid var(--cta-coral);
  outline-offset: 2px;
}
</style>
```

- [ ] **Step 2: Create `src/components/ui/ClayCard.vue`**

```vue
<script setup lang="ts">
defineProps<{
  interactive?: boolean
  accentColor?: string
}>()
</script>

<template>
  <article
    class="clay-card"
    :class="{ 'clay-card--interactive': interactive }"
    :style="accentColor ? { borderTopColor: accentColor } : undefined"
  >
    <slot />
  </article>
</template>

<style scoped>
.clay-card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  border-top: 4px solid transparent;
  padding: var(--space-5);
  box-shadow: var(--shadow-clay-out);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.clay-card--interactive {
  cursor: pointer;
}

.clay-card--interactive:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-clay-out-lg);
}

.clay-card--interactive:active {
  transform: translateY(0) scale(0.98);
  box-shadow: var(--shadow-clay-press);
}

.clay-card--interactive:focus-visible {
  outline: 2px solid var(--cta-coral);
  outline-offset: 4px;
}
</style>
```

- [ ] **Step 3: Create `src/components/ui/CategoryChip.vue`**

```vue
<script setup lang="ts">
import { PackagePlus, Blocks, Workflow } from 'lucide-vue-next'
import type { PatternCategory } from '@/types/pattern'

const props = defineProps<{ category: PatternCategory }>()

const iconMap = {
  creational: PackagePlus,
  structural: Blocks,
  behavioral: Workflow,
} as const

const labelMap = {
  creational: '创建型',
  structural: '结构型',
  behavioral: '行为型',
} as const
</script>

<template>
  <span class="chip" :data-category="props.category">
    <component :is="iconMap[props.category]" :size="18" aria-hidden="true" />
    <span>{{ labelMap[props.category] }}</span>
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-clay-out);
  color: var(--ink-900);
}

.chip[data-category='creational'] { background: var(--cat-creational-soft); }
.chip[data-category='structural'] { background: var(--cat-structural-soft); }
.chip[data-category='behavioral'] { background: var(--cat-behavioral-soft); }
</style>
```

- [ ] **Step 4: Create `src/components/layout/Container.vue`**

```vue
<template>
  <div class="container">
    <slot />
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}
</style>
```

- [ ] **Step 5: Create `src/components/layout/SiteHeader.vue`**

```vue
<script setup lang="ts">
import { House, CircleHelp, Github } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Container from './Container.vue'
</script>

<template>
  <header class="site-header">
    <Container>
      <div class="bar">
        <RouterLink to="/" class="brand">
          <span class="brand-mark">23</span>
          <span class="brand-name">设计模式</span>
        </RouterLink>
        <nav aria-label="主导航">
          <ul class="links">
            <li>
              <RouterLink to="/" class="link">
                <House :size="18" aria-hidden="true" />
                <span>首页</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/about" class="link">
                <CircleHelp :size="18" aria-hidden="true" />
                <span>关于</span>
              </RouterLink>
            </li>
            <li>
              <a
                href="https://github.com/Moon-Knight1/DesignPatterns"
                class="link"
                target="_blank"
                rel="noopener"
                aria-label="GitHub 仓库"
              >
                <Github :size="18" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </Container>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 247, 240, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 20px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  background: var(--cta-coral);
  color: var(--cta-coral-ink);
  font-family: var(--font-display);
  font-size: 18px;
}

.links {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  color: var(--ink-900);
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.link:hover {
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-out);
}

.link.router-link-active {
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-in);
}

@media (max-width: 640px) {
  .link span:not([aria-label]) {
    display: none;
  }
}
</style>
```

- [ ] **Step 6: Create `src/components/layout/SiteFooter.vue`**

```vue
<script setup lang="ts">
import Container from './Container.vue'
</script>

<template>
  <footer class="site-footer">
    <Container>
      <div class="inner">
        <p>
          内容整理自 Refactoring.Guru 中文版 ·
          <a
            href="https://github.com/Moon-Knight1/DesignPatterns"
            target="_blank"
            rel="noopener"
          >源码仓库</a>
        </p>
        <p class="meta">部署于 GitHub Pages · MIT License</p>
      </div>
    </Container>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--space-8);
  padding: var(--space-6) 0;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  color: var(--ink-600);
  font-size: 14px;
}

.inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  text-align: center;
}

.inner a {
  color: var(--cta-coral);
  text-decoration: underline;
}

.meta {
  font-size: 12px;
  color: var(--ink-400);
}
</style>
```

- [ ] **Step 7: Verify build**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 8: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/components/
git commit -m "feat(components): add layout primitives and UI atoms"
```

---

## Task 9: Home page components

**Files:**
- Create: `src/components/home/HeroSection.vue`
- Create: `src/components/home/PatternCatalog.vue`
- Create: `src/components/home/CategorySection.vue`
- Create: `src/components/home/PatternCard.vue`
- Create: `src/components/home/ProgressDemo.vue`
- Create: `src/components/home/CtaBanner.vue`
- Replace: `src/views/HomeView.vue`

**Interfaces:**
- Consumes: `categories`, `patterns` from `@/data/patterns`; `ClayButton`, `ClayCard`, `CategoryChip`, `Container`
- Produces: composed home page view at `/`

- [ ] **Step 1: Create `src/components/home/PatternCard.vue`**

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import type { Pattern } from '@/types/pattern'

const props = defineProps<{
  pattern: Pattern
  accentColor: string
}>()

const categoryColorVar: Record<Pattern['category'], string> = {
  creational: 'var(--cat-creational)',
  structural: 'var(--cat-structural)',
  behavioral: 'var(--cat-behavioral)',
}
</script>

<template>
  <RouterLink :to="`/pattern/${props.pattern.slug}`" class="link">
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

.row {
  margin-bottom: var(--space-3);
}

.category {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.title-zh {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink-900);
  margin-bottom: var(--space-1);
}

.title-en {
  font-family: var(--font-latin);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-400);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.summary {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-600);
}
</style>
```

- [ ] **Step 2: Create `src/components/home/CategorySection.vue`**

```vue
<script setup lang="ts">
import CategoryChip from '@/components/ui/CategoryChip.vue'
import PatternCard from './PatternCard.vue'
import type { CategoryMeta } from '@/data/patterns'

defineProps<{ category: CategoryMeta }>()
</script>

<template>
  <section class="section" :id="`cat-${category.items[0]?.category}`">
    <div class="header">
      <CategoryChip :category="category.items[0]?.category ?? 'creational'" />
      <h2 class="title">{{ category.zh }}</h2>
      <span class="count">{{ category.items.length }} 个模式</span>
    </div>
    <div class="grid">
      <PatternCard
        v-for="p in category.items"
        :key="p.slug"
        :pattern="p"
        :accent-color="category.color"
      />
    </div>
  </section>
</template>

<style scoped>
.section {
  scroll-margin-top: 80px;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
}

.count {
  font-size: 14px;
  color: var(--ink-600);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
</style>
```

- [ ] **Step 3: Create `src/components/home/PatternCatalog.vue`**

```vue
<script setup lang="ts">
import { categories } from '@/data/patterns'
import CategorySection from './CategorySection.vue'
</script>

<template>
  <div class="catalog">
    <CategorySection :category="categories.creational" />
    <CategorySection :category="categories.structural" />
    <CategorySection :category="categories.behavioral" />
  </div>
</template>

<style scoped>
.catalog {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
</style>
```

- [ ] **Step 4: Create `src/components/home/HeroSection.vue`**

```vue
<script setup lang="ts">
import ClayButton from '@/components/ui/ClayButton.vue'
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <p class="eyebrow">面向中文读者的交互式学习手册</p>
      <h1 class="title">23 种 GoF 设计模式</h1>
      <p class="subtitle">
        经典 Gang of Four 设计模式的中文详解,涵盖创建型、结构型、行为型三大类,共 22 个模式。
      </p>
      <div class="actions">
        <ClayButton to="/pattern/singleton" variant="primary">开始学习 →</ClayButton>
        <ClayButton href="#cat-creational" variant="secondary">浏览全部模式</ClayButton>
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

.eyebrow {
  font-size: 14px;
  color: var(--ink-600);
  font-weight: 500;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 48px);
  font-weight: 400;
  color: var(--ink-900);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--ink-600);
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

- [ ] **Step 5: Create `src/components/home/ProgressDemo.vue`**

```vue
<template>
  <section class="progress-demo" aria-label="学习路径示意">
    <h2 class="heading">学习路径</h2>
    <p class="caption">由浅入深,逐步掌握所有模式</p>
    <div class="track">
      <div class="dot filled" aria-label="已完成">
        <span class="dot-label">单例</span>
      </div>
      <div class="tube"></div>
      <div class="dot filled" aria-label="已完成">
        <span class="dot-label">工厂</span>
      </div>
      <div class="tube"></div>
      <div class="dot in-progress" aria-label="学习中">
        <span class="dot-label">观察者</span>
      </div>
      <div class="tube"></div>
      <div class="dot" aria-label="未开始">
        <span class="dot-label">策略</span>
      </div>
      <div class="tube"></div>
      <div class="dot" aria-label="未开始">
        <span class="dot-label">访问者</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress-demo {
  text-align: center;
  padding: var(--space-7) 0;
}

.heading {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
  margin-bottom: var(--space-2);
}

.caption {
  font-size: 14px;
  color: var(--ink-600);
  margin-bottom: var(--space-6);
}

.track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0 var(--space-4);
}

.dot {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-out);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.dot.filled {
  background: var(--cat-creational);
  box-shadow: var(--shadow-clay-out-lg);
}

.dot.in-progress {
  background: var(--accent-yellow);
  box-shadow: var(--shadow-clay-out-lg);
  position: relative;
}

.dot.in-progress::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: var(--radius-pill);
  border: 2px dashed var(--cta-coral);
  animation: spin 6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dot-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-900);
  text-align: center;
  line-height: 1.1;
  padding: 0 4px;
}

.dot.filled .dot-label,
.dot.in-progress .dot-label {
  color: var(--ink-900);
}

.tube {
  height: 8px;
  width: clamp(24px, 4vw, 48px);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-in);
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dot.in-progress::after { animation: none; }
}
</style>
```

- [ ] **Step 6: Create `src/components/home/CtaBanner.vue`**

```vue
<script setup lang="ts">
import ClayButton from '@/components/ui/ClayButton.vue'
</script>

<template>
  <section class="cta">
    <div class="card">
      <h2 class="title">准备好开始了吗?</h2>
      <p class="text">从最简单的单例模式开始,逐步掌握 22 个经典模式。</p>
      <ClayButton to="/pattern/singleton" variant="primary">从单例模式开始 →</ClayButton>
    </div>
  </section>
</template>

<style scoped>
.cta {
  padding: var(--space-7) 0;
}

.card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  padding: var(--space-7);
  text-align: center;
  box-shadow: var(--shadow-clay-out-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink-900);
}

.text {
  font-size: 16px;
  color: var(--ink-600);
  margin-bottom: var(--space-2);
}
</style>
```

- [ ] **Step 7: Replace `src/views/HomeView.vue`**

```vue
<script setup lang="ts">
import { useHead } from '@vueuse/head'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import PatternCatalog from '@/components/home/PatternCatalog.vue'
import ProgressDemo from '@/components/home/ProgressDemo.vue'
import CtaBanner from '@/components/home/CtaBanner.vue'

useHead({
  title: '23 种 GoF 设计模式 · 学习手册',
  meta: [
    { name: 'description', content: '一份面向中文读者的交互式设计模式学习手册,涵盖 22 个 GoF 经典模式。' },
    { property: 'og:title', content: '23 种 GoF 设计模式 · 学习手册' },
    { property: 'og:description', content: '一份面向中文读者的交互式设计模式学习手册。' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/' }],
})
</script>

<template>
  <Container>
    <HeroSection />
    <PatternCatalog />
    <ProgressDemo />
    <CtaBanner />
  </Container>
  <SiteFooter />
</template>
```

- [ ] **Step 8: Verify build + dev render**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

Expected: build succeeds.

```bash
cd D:/Projects/DesignPatterns && timeout 10 npm run dev || true
```

Open `http://localhost:5173/#/` in browser: hero shows, three category sections render 22 cards, progress demo visible, CTA banner at bottom.

- [ ] **Step 9: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/components/home/ src/views/HomeView.vue
git commit -m "feat(home): build hero, catalog, progress demo, and CTA banner"
```

---

## Task 10: Pattern detail page (MarkdownRenderer, PatternToc, PatternHeader, PatternFooterNav, prose.css)

**Files:**
- Create: `src/styles/prose.css`
- Create: `src/components/pattern/MarkdownRenderer.vue`
- Create: `src/components/pattern/PatternToc.vue`
- Create: `src/components/pattern/PatternHeader.vue`
- Create: `src/components/pattern/PatternFooterNav.vue`
- Modify: `src/main.ts` (add prose.css import)
- Replace: `src/views/PatternView.vue`

**Interfaces:**
- Consumes: `markdownBySlug`, `getPattern`, `getPrev`, `getNext`, `useMarkdown`, `useToc`, `Pattern`
- Produces: working pattern detail page at `/#/pattern/<slug>`

- [ ] **Step 1: Create `src/styles/prose.css`**

```css
.prose {
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.85;
  color: var(--ink-900);
  max-width: 70ch;
}

.prose h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  margin: var(--space-7) 0 var(--space-4);
  scroll-margin-top: 100px;
}

.prose h2 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 26px;
  margin: var(--space-6) 0 var(--space-3);
  scroll-margin-top: 100px;
}

.prose h3 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 20px;
  margin: var(--space-5) 0 var(--space-2);
  scroll-margin-top: 100px;
}

.prose h4 {
  font-weight: 600;
  font-size: 18px;
  margin: var(--space-4) 0 var(--space-2);
}

.prose p {
  margin-bottom: var(--space-4);
}

.prose ul,
.prose ol {
  margin: 0 0 var(--space-4) var(--space-5);
  padding-left: var(--space-4);
  list-style: disc;
}

.prose ol {
  list-style: decimal;
}

.prose li {
  margin-bottom: var(--space-2);
}

.prose li > ul,
.prose li > ol {
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
}

.prose strong {
  font-weight: 700;
  color: var(--ink-900);
}

.prose a {
  color: var(--cta-coral);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: var(--space-5) auto;
  border-radius: var(--radius-soft);
  box-shadow: var(--shadow-clay-out);
  background: var(--surface-card);
  min-height: 80px;
}

.prose img.error-fallback {
  display: none;
}

.prose figure {
  margin: var(--space-5) 0;
  text-align: center;
}

.prose figure img {
  margin: 0 auto;
}

.prose figcaption {
  font-size: 14px;
  color: var(--ink-600);
  margin-top: var(--space-2);
  font-style: italic;
}

.prose blockquote {
  border-left: 4px solid var(--cta-coral);
  padding: var(--space-2) var(--space-4);
  margin: var(--space-4) 0;
  color: var(--ink-600);
  background: rgba(249, 115, 22, 0.04);
  border-radius: 0 var(--radius-soft) var(--radius-soft) 0;
}

.prose code {
  font-family: var(--font-code);
  font-size: 0.92em;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 6px;
}

.prose pre {
  font-family: var(--font-code);
  background: #1f2937;
  color: #f9fafb;
  padding: var(--space-4);
  border-radius: var(--radius-soft);
  overflow-x: auto;
  margin: var(--space-4) 0;
  font-size: 14px;
  line-height: 1.6;
}

.prose pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

.prose hr {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: var(--space-6) 0;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-4) 0;
}

.prose th,
.prose td {
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: var(--space-2) var(--space-3);
  text-align: left;
}

.prose th {
  background: var(--surface-card);
  font-weight: 600;
}

.prose .image-skeleton {
  display: block;
  width: 100%;
  height: 200px;
  margin: var(--space-5) auto;
  border-radius: var(--radius-soft);
  background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.prose .image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 160px;
  margin: var(--space-5) auto;
  border-radius: var(--radius-soft);
  background: var(--surface-card);
  box-shadow: var(--shadow-clay-in);
  color: var(--ink-600);
  font-style: italic;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .prose .image-skeleton { animation: none; }
}
```

- [ ] **Step 2: Import prose.css in `src/main.ts`**

Replace the imports block at the top of `src/main.ts`:

```ts
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import './styles/prose.css'
```

(Keep everything else from Task 7 intact.)

- [ ] **Step 3: Create `src/components/pattern/MarkdownRenderer.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdown } from '@/composables/useMarkdown'

const props = defineProps<{ source: string }>()
const html = useMarkdown(props.source)

// Wrap every <img> with a preceding skeleton span and add lazy loading.
const wrappedHtml = computed(() =>
  html.value.replace(
    /<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g,
    (_, before, src, after) => {
      const altMatch = (before + after).match(/alt="([^"]*)"/)
      const alt = altMatch ? altMatch[1] : '示意图'
      return `<span class="image-skeleton" aria-hidden="true"></span><img ${before} src="${src}" ${after} loading="lazy" decoding="async" alt="${alt.replace(/"/g, '&quot;')}">`
    },
  ),
)

// Anchor link smooth-scroll: TOC and inline # links share this handler.
function onAnchorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName !== 'A') return
  const href = target.getAttribute('href')
  if (!href || !href.startsWith('#') || href === '#') return
  const id = href.slice(1)
  const el = document.getElementById(id)
  if (el) {
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }
}

// Image event delegation. `load` and `error` events fire on <img> elements
// rendered via v-html. `load` bubbles; `error` does not — we use capture to
// catch both. The skeleton is shown while loading; on error we replace the
// <img> with a claymorphism-styled fallback span.
function onImgLoad(e: Event) {
  const img = e.target as HTMLElement
  if (img.tagName !== 'IMG') return
  const prev = img.previousElementSibling
  if (prev && prev.classList.contains('image-skeleton')) prev.remove()
}

function onImgError(e: Event) {
  const img = e.target as HTMLElement
  if (img.tagName !== 'IMG') return
  const prev = img.previousElementSibling
  if (prev && prev.classList.contains('image-skeleton')) prev.remove()
  const alt = img.getAttribute('alt') || '示意图不可用'
  const fallback = document.createElement('span')
  fallback.className = 'image-fallback'
  fallback.setAttribute('role', 'img')
  fallback.setAttribute('aria-label', alt)
  fallback.textContent = '示意图'
  img.replaceWith(fallback)
}
</script>

<template>
  <article
    class="prose"
    @click="onAnchorClick"
    @load.capture="onImgLoad"
    @error.capture="onImgError"
    v-html="wrappedHtml"
  />
</template>
```

- [ ] **Step 4: Create `src/components/pattern/PatternToc.vue`**

```vue
<script setup lang="ts">
import { useToc } from '@/composables/useToc'
import type { TocEntry } from '@/composables/useToc'

const props = defineProps<{ html: string }>()
const entries = useToc(props.html)

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
    <ul v-if="entries.length">
      <li v-for="(entry: TocEntry) in entries" :key="entry.id" :data-level="entry.level">
        <a :href="`#${entry.id}`" @click="scrollTo(entry.id, $event)">{{ entry.text }}</a>
      </li>
    </ul>
    <p v-else class="empty">暂无章节</p>
  </aside>
</template>

<style scoped>
.toc {
  position: sticky;
  top: 96px;
  padding: var(--space-4);
  background: var(--surface-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-clay-out);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  font-size: 14px;
}

.heading {
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: var(--space-3);
  font-size: 14px;
}

ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

li[data-level='3'] {
  padding-left: var(--space-4);
  font-size: 13px;
}

a {
  display: block;
  padding: var(--space-1) var(--space-2);
  color: var(--ink-600);
  border-radius: var(--radius-xs);
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

a:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--cta-coral);
}

.empty {
  color: var(--ink-400);
  font-size: 13px;
}

@media (max-width: 1023px) {
  .toc {
    position: static;
    max-height: none;
    margin-top: var(--space-5);
  }
}
</style>
```

- [ ] **Step 5: Create `src/components/pattern/PatternHeader.vue`**

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import CategoryChip from '@/components/ui/CategoryChip.vue'
import type { Pattern } from '@/types/pattern'

const props = defineProps<{ pattern: Pattern }>()

const categoryZh = {
  creational: '创建型',
  structural: '结构型',
  behavioral: '行为型',
}[props.pattern.category]
</script>

<template>
  <div class="header">
    <nav aria-label="面包屑" class="breadcrumb">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ categoryZh }}</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ pattern.titleZh }}</span>
    </nav>
    <CategoryChip :category="pattern.category" />
    <h1 class="title">{{ pattern.titleZh }} <span class="title-en">/ {{ pattern.titleEn }}</span></h1>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  color: var(--ink-600);
}

.breadcrumb a {
  color: var(--ink-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.breadcrumb a:hover {
  color: var(--cta-coral);
}

.breadcrumb [aria-current='page'] {
  color: var(--ink-900);
  font-weight: 600;
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(28px, 4vw, 36px);
  color: var(--ink-900);
  line-height: 1.3;
}

.title-en {
  font-family: var(--font-latin);
  font-weight: 700;
  font-size: 0.5em;
  letter-spacing: 0.05em;
  color: var(--ink-400);
  text-transform: uppercase;
}
</style>
```

- [ ] **Step 6: Create `src/components/pattern/PatternFooterNav.vue`**

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClayCard from '@/components/ui/ClayCard.vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import type { Pattern } from '@/types/pattern'

defineProps<{
  prev: Pattern | null
  next: Pattern | null
}>()
</script>

<template>
  <nav class="nav" aria-label="模式导航">
    <div v-if="prev" class="cell prev">
      <RouterLink :to="`/pattern/${prev.slug}`" class="link">
        <ClayCard interactive>
          <ArrowLeft :size="20" aria-hidden="true" />
          <span class="label">上一篇</span>
          <span class="title">{{ prev.titleZh }}</span>
        </ClayCard>
      </RouterLink>
    </div>
    <div v-if="next" class="cell next">
      <RouterLink :to="`/pattern/${next.slug}`" class="link">
        <ClayCard interactive>
          <span class="label">下一篇</span>
          <span class="title">{{ next.titleZh }}</span>
          <ArrowRight :size="20" aria-hidden="true" />
        </ClayCard>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.cell.next {
  grid-column: 2;
}

.cell.prev {
  grid-column: 1;
}

/* When only one of prev/next is present, it occupies its own column
   and is left-aligned (not centered). The CSS Grid above already does this
   because the empty cell takes the other column but renders nothing. */

.link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.label {
  font-size: 12px;
  color: var(--ink-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--space-1);
}

.cell.next :deep(.clay-card),
.cell.prev :deep(.clay-card) {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cell.next :deep(.clay-card) {
  justify-content: flex-end;
  text-align: right;
  flex-direction: row;
}

.cell.prev :deep(.clay-card) {
  flex-direction: row;
}

.title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
}

@media (max-width: 640px) {
  .nav { grid-template-columns: 1fr; }
  .cell.next { grid-column: 1; }
}
</style>
```

- [ ] **Step 7: Replace `src/views/PatternView.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import PatternHeader from '@/components/pattern/PatternHeader.vue'
import MarkdownRenderer from '@/components/pattern/MarkdownRenderer.vue'
import PatternToc from '@/components/pattern/PatternToc.vue'
import PatternFooterNav from '@/components/pattern/PatternFooterNav.vue'
import { getPattern, getPrev, getNext } from '@/data/patterns'
import { markdownBySlug } from '@/data/markdown'
import { useMarkdown } from '@/composables/useMarkdown'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const pattern = computed(() => getPattern(slug.value))
const source = computed(() => (pattern.value ? markdownBySlug[slug.value] : ''))
const html = useMarkdown(source)
const prev = computed(() => getPrev(slug.value))
const next = computed(() => getNext(slug.value))

useHead(() => ({
  title: pattern.value
    ? `${pattern.value.titleZh} · 23 种设计模式`
    : '未找到模式 · 23 种设计模式',
  meta: pattern.value
    ? [
        { name: 'description', content: pattern.value.summary },
        { property: 'og:title', content: `${pattern.value.titleZh} · 23 种设计模式` },
        { property: 'og:description', content: pattern.value.summary },
        { property: 'og:type', content: 'article' },
      ]
    : [],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/' }],
}))
</script>

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

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: start;
  }
}

.not-found {
  text-align: center;
  padding: var(--space-8) 0;
}

.not-found h1 {
  font-family: var(--font-heading);
  font-size: 28px;
  margin-bottom: var(--space-3);
}

.back {
  display: inline-block;
  margin-top: var(--space-4);
  color: var(--cta-coral);
  text-decoration: underline;
}
</style>
```

- [ ] **Step 8: Verify build**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

Expected: build succeeds.

- [ ] **Step 9: Manually verify in dev**

```bash
cd D:/Projects/DesignPatterns && timeout 15 npm run dev || true
```

Open `http://localhost:5173/#/pattern/observer`. Verify:
- Title shows "观察者模式 / OBSERVER"
- Breadcrumb shows 首页 / 行为型 / 观察者模式
- Markdown renders with images
- TOC list appears on the right
- "上一篇" links to strategy, "下一篇" links to state
- Open `http://localhost:5173/#/pattern/singleton` — no "上一篇" card
- Open `http://localhost:5173/#/pattern/visitor` — no "下一篇" card
- Open `http://localhost:5173/#/pattern/notreal` — "未找到该模式" message

- [ ] **Step 10: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/styles/prose.css src/components/pattern/ src/views/PatternView.vue src/main.ts
git commit -m "feat(pattern): build pattern detail view with markdown rendering, TOC, prev/next nav"
```

---

## Task 11: About view + per-view SEO

**Files:**
- Replace: `src/views/AboutView.vue`

- [ ] **Step 1: Replace `src/views/AboutView.vue`**

```vue
<script setup lang="ts">
import { useHead } from '@vueuse/head'
import Container from '@/components/layout/Container.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

useHead({
  title: '关于 · 23 种设计模式',
  meta: [
    { name: 'description', content: '关于本网站的来源、技术栈与贡献方式。' },
    { property: 'og:title', content: '关于 · 23 种设计模式' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://moon-knight1.github.io/DesignPatterns/#/about' }],
})
</script>

<template>
  <Container>
    <article class="about">
      <h1>关于本网站</h1>

      <section>
        <h2>内容来源</h2>
        <p>
          本站内容整理自 <a href="https://refactoringguru.cn" target="_blank" rel="noopener">Refactoring Guru</a>
          中文版的 23 种 GoF 设计模式文档。原始内容以 Markdown 形式存放在
          <a href="https://github.com/Moon-Knight1/DesignPatterns/tree/main/theory" target="_blank" rel="noopener"><code>theory/</code></a>
          目录下,本站直接渲染这些 Markdown 文件,不做二次创作。
        </p>
      </section>

      <section>
        <h2>技术栈</h2>
        <p>
          本站使用 Vue 3 + Vite + TypeScript 构建,Markdown 通过
          <a href="https://github.com/markdown-it/markdown-it" target="_blank" rel="noopener">markdown-it</a>
          渲染,使用 vue-router 的 hash 模式路由,部署于 GitHub Pages。
        </p>
      </section>

      <section>
        <h2>贡献</h2>
        <p>
          内容纠错与改进请通过
          <a href="https://github.com/Moon-Knight1/DesignPatterns/issues" target="_blank" rel="noopener">Issue</a>
          或 Pull Request 提交至
          <a href="https://github.com/Moon-Knight1/DesignPatterns" target="_blank" rel="noopener">源码仓库</a>。
        </p>
      </section>

      <section>
        <h2>许可</h2>
        <p>本站采用 MIT 许可证。</p>
      </section>
    </article>
  </Container>
  <SiteFooter />
</template>

<style scoped>
.about {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) 0;
}

.about h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  margin-bottom: var(--space-5);
}

.about h2 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 20px;
  margin: var(--space-5) 0 var(--space-2);
}

.about p {
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink-900);
}

.about a {
  color: var(--cta-coral);
  text-decoration: underline;
}

.about code {
  font-family: var(--font-code);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: Verify build**

```bash
cd D:/Projects/DesignPatterns && npm run build
```

Expected: exit 0.

- [ ] **Step 3: Manually verify in dev**

Open `http://localhost:5173/#/about`. Verify it renders with proper Chinese typography and all four sections.

- [ ] **Step 4: Commit**

```bash
cd D:/Projects/DesignPatterns && git add src/views/AboutView.vue
git commit -m "feat(about): build about page with per-view SEO"
```

---

## Task 12: vite-plugin-static-copy + image pipeline

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run build` outputs `dist/imgs/<pattern>/*.png`, so images are served at `/DesignPatterns/imgs/...` at runtime.

- [ ] **Step 1: Update `vite.config.ts` to add the static-copy plugin**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/DesignPatterns/' : '/',
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'imgs/**/*', dest: 'imgs' },
      ],
    }),
  ],
  publicDir: 'public',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
}))
```

- [ ] **Step 2: Run build and verify images copied**

```bash
cd D:/Projects/DesignPatterns && npm run build && ls dist/imgs/observer/
```

Expected: build succeeds; `dist/imgs/observer/` contains `observer.png`, `observer-comic-1-zh.png`, `observer-comic-2-zh.png`, etc.

- [ ] **Step 3: Run preview and verify image loads in browser**

```bash
cd D:/Projects/DesignPatterns && (npm run preview &) && sleep 4 && curl -sI http://localhost:4173/imgs/observer/observer.png | head -1
```

Expected: `HTTP/1.1 200 OK`. Then kill the preview server.

- [ ] **Step 4: Commit**

```bash
cd D:/Projects/DesignPatterns && git add vite.config.ts
git commit -m "build: copy imgs/ to dist/imgs/ via vite-plugin-static-copy"
```

---

## Task 13: Accessibility + reduced-motion verification

**Files:**
- Modify (if needed): skip link and focus styles are already in `reset.css` / `global.css`; no new files unless gaps found

- [ ] **Step 1: Verify skip link works in dev**

```bash
cd D:/Projects/DesignPatterns && timeout 10 npm run dev || true
```

Visit `http://localhost:5173/#/`. Press Tab — the "跳转到主要内容" link should appear at the top-left with a visible focus ring. Press Enter — focus moves to the `<main>` element.

- [ ] **Step 2: Verify focus rings on all interactive elements**

On every page (`/`, `/pattern/<slug>`, `/about`), Tab through all links and buttons. Each must show a 2px coral outline with 2px offset.

- [ ] **Step 3: Verify image alt text**

Open DevTools → Elements panel on a pattern detail page. Every `<img>` must have a non-empty `alt` attribute. (Vite dev server shows the actual rendered HTML.)

- [ ] **Step 4: Verify heading hierarchy**

On every page, the heading levels must not skip (no `h1 → h3` jumps). Home: one `h1` per page (the hero title). Pattern detail: one `h1` in `PatternHeader`, then `h2/h3` in markdown body.

- [ ] **Step 5: Verify color contrast**

Open DevTools → Inspect any body text on cream background. Compute contrast vs `#FFF7F0`:

- `--ink-900 #1F2937` on `#FFF7F0` → expect ≥14:1 ✓
- `--ink-600 #4B5563` on `#FFF7F0` → expect ≥7:1 ✓

- [ ] **Step 6: Verify reduced-motion**

DevTools → Rendering panel → Emulate CSS `prefers-reduced-motion: reduce`. Reload any page. No transforms animate; only opacity transitions play (or none).

- [ ] **Step 7: If any verification step failed, file a fix task**

If any check above failed, write a follow-up commit in this task:

```bash
cd D:/Projects/DesignPatterns && git add <fix-targets>
git commit -m "fix(a11y): <describe the fix>"
```

If everything passes, no commit is needed; mark the task done.

---

## Task 14: Responsive verification

**Files:** none (verification only)

- [ ] **Step 1: Boot dev server**

```bash
cd D:/Projects/DesignPatterns && timeout 60 npm run dev || true
```

- [ ] **Step 2: Test at 375px**

Open DevTools → device emulation → iPhone SE (375 × 667). On every page:
- No horizontal scroll
- Header links collapse to icon-only
- Catalog grid is 1 column
- TOC moves below content (not sticky)
- Pattern card content fits without overflow

- [ ] **Step 3: Test at 768px**

DevTools → iPad (768 × 1024). Catalog grid is 2 columns. Header shows full labels.

- [ ] **Step 4: Test at 1280px**

DevTools → 1280 × 800. Catalog grid is 4 columns. Pattern detail has 2-column layout with sticky TOC.

- [ ] **Step 5: Test at 1440px**

DevTools → 1440 × 900. Container max-width clamps; layout is balanced.

- [ ] **Step 6: If responsive issues found, fix them**

If horizontal scroll, overflow, or broken layouts appear at any breakpoint, fix the offending component and commit:

```bash
cd D:/Projects/DesignPatterns && git add <fix-targets>
git commit -m "fix(responsive): <describe the fix>"
```

If everything passes, no commit needed; mark the task done.

---

## Task 15: Final local build + preview verification

- [ ] **Step 1: Clean install**

```bash
cd D:/Projects/DesignPatterns && rm -rf node_modules dist && npm install
```

Expected: completes without errors.

- [ ] **Step 2: Run typecheck + tests + build**

```bash
cd D:/Projects/DesignPatterns && npm run typecheck && npm test && npm run build
```

Expected: all three succeed. `dist/` exists with `dist/index.html`, `dist/imgs/`, `dist/assets/`.

- [ ] **Step 3: Inspect dist size**

```bash
cd D:/Projects/DesignPatterns && du -sh dist/ && find dist -type f | wc -l
```

Expected: total size < 5 MB (most of it is image PNGs). File count < 200.

- [ ] **Step 4: Run preview server**

```bash
cd D:/Projects/DesignPatterns && (npm run preview &) && sleep 4
```

- [ ] **Step 5: Verify all routes via curl**

```bash
curl -s http://localhost:4173/ | grep -o '<title>.*</title>'
curl -s http://localhost:4173/ | grep -o 'href="/DesignPatterns/imgs/observer/observer.png"' | head -1
```

Expected: title is `23 种 GoF 设计模式 · 学习手册`. Image reference uses BASE_URL.

- [ ] **Step 6: Kill preview server**

```bash
cd D:/Projects/DesignPatterns && pkill -f "vite preview" || true
```

- [ ] **Step 7: If any verification step failed, fix**

If size exceeds 5 MB, or build fails, fix and re-run from Step 2.

If everything passes, no commit needed.

---

## Task 16: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NODE_ENV: production
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify workflow YAML syntax**

```bash
cd D:/Projects/DesignPatterns && D:/Developer/Anaconda3/python.exe -c "
import yaml, sys
with open('.github/workflows/deploy.yml') as f:
    yaml.safe_load(f)
print('YAML is valid')
"
```

Expected: prints `YAML is valid`. (We use the Anaconda Python per CLAUDE.md.)

- [ ] **Step 3: Commit**

```bash
cd D:/Projects/DesignPatterns && git add .github/
git commit -m "ci: add GitHub Pages deployment workflow"
```

---

## Task 17: Repo settings (one-time) + first deploy + verification

**Files:** none — manual UI steps + push

- [ ] **Step 1: Confirm repo settings**

In a browser, open `https://github.com/Moon-Knight1/DesignPatterns/settings/pages`. Set:
- **Source:** GitHub Actions

In `https://github.com/Moon-Knight1/DesignPatterns/settings/actions`:
- **Workflow permissions:** Read and write permissions
- **Allow GitHub Actions to create and approve pull requests:** checked

- [ ] **Step 2: Push to main**

```bash
cd D:/Projects/DesignPatterns && git push origin main
```

Expected: push succeeds. Workflow run starts within ~10 seconds.

- [ ] **Step 3: Watch the workflow run**

Open `https://github.com/Moon-Knight1/DesignPatterns/actions`. The "Deploy to GitHub Pages" workflow should run and turn green within ~2 minutes. If it fails with a permissions error, revisit Step 1.

- [ ] **Step 4: Verify the live site**

Open `https://moon-knight1.github.io/DesignPatterns/`:
- Home renders with hero, 22 cards in 3 sections, progress demo, CTA
- Click any card → navigates to its detail page
- Detail page renders markdown with images
- TOC works
- Prev/next nav works
- Visit `https://moon-knight1.github.io/DesignPatterns/#/about` → about page
- Reload on `https://moon-knight1.github.io/DesignPatterns/#/pattern/observer` → still loads (hash mode survives)

- [ ] **Step 5: Verify SEO metadata**

In a browser DevTools on a pattern detail page, inspect `<head>`:
- `<title>` shows the pattern name
- `<meta name="description">` shows the pattern summary
- `<meta property="og:title">` and `og:description` present

- [ ] **Step 6: If deploy failed**

If the workflow failed:
1. Read the failed step's log in the Actions tab.
2. Most common cause: permissions (revisit Step 1).
3. Second most common: build error (run `npm run build` locally to reproduce).
4. Fix, commit, push — workflow re-runs automatically.

If everything passes, the implementation is complete. The spec's §11 verification checklist is now satisfied.

---

## Self-Review Checklist (run before handing off)

Before considering this plan complete, verify each item. The implementation phase should produce a site that satisfies all spec sections.

| Spec § | Requirement | Task |
|---|---|---|
| §1, D1 | Chinese UI throughout | Tasks 2 (tokens), 8–11 (all components/views) |
| §1, D2 | Decorative progress demo | Task 9 (ProgressDemo) |
| §1, D3 | No testimonials block | (omitted by design) |
| §1, D4 | Three GoF sections | Task 3 (categories), Task 9 (CategorySection) |
| §1, D5 | No search/sort/filter | (omitted by design) |
| D6 | Vue 3 + Vite + TS + markdown-it + hash router | Tasks 1, 4, 6, 7 |
| D7 | createWebHashHistory | Task 6 |
| D8 | vite-plugin-static-copy | Task 12 |
| §4.2 | Prev/next boundary rules | Task 10 (PatternFooterNav) |
| §5.1–5.3 | Claymorphism tokens | Task 2 |
| §5.3 | Font loading with subsetting | Task 1 (index.html) — future improvement: add `&text=` after char-set extraction |
| §5.6 | A11y (focus rings, skip link, alt) | Task 2 (reset/global), Task 13 (verification) |
| §5.7 | Responsive breakpoints | Task 14 (verification) |
| §5.8 | SEO via @vueuse/head | Tasks 7 (mount), 9/10/11 (per-view useHead) |
| §6 | Component list (6 home + 4 pattern + 3 UI + 3 layout) | Tasks 8, 9, 10 |
| §7.3 | import.meta.glob relative path | Task 4 |
| §8.1 | markdown-it config + image src rewrite | Task 4 |
| §8.2 | useToc | Task 5 |
| §9 | Hash router + lazy routes | Task 6 |
| §9.2 | @vueuse/head in main.ts | Task 7 |
| §10.1 | vite-plugin-static-copy | Task 12 |
| §10.2 | package.json scripts | Task 1 |
| §10.4 | deploy.yml | Task 16 |
| §10.5 | One-time repo settings | Task 17 |
| §11 | Verification checklist | Tasks 13, 14, 15, 17 |
| §12 | Edge cases (interpreter, missing image, bogus slug) | Tasks 3 (filter), 10 (skeleton + fallback + not-found), 12 (image src) |