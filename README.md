<div align="center">

# 23 种 GoF 设计模式 · 学习手册

**一份面向中文读者的交互式设计模式学习手册**

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#许可证)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?logo=github)](https://moon-knight1.github.io/DesignPatterns/)

在线阅读:[moon-knight1.github.io/DesignPatterns](https://moon-knight1.github.io/DesignPatterns/)

</div>

---

## 📖 项目简介

本项目是一份**交互式中文 GoF 23 种设计模式学习手册**,旨在为中文开发者提供系统化、可阅读、可检索的学习体验。

与传统的 PDF 或静态网页不同,本项目:

- ✍️ **逐篇深度讲解**:每一种模式都配有结构清晰的中文长文,涵盖意图、问题、解决方案、UML 类图、适用场景与权衡等。
- 🎨 **可视化的类目导航**:将 23 种模式按 GoF 经典分类(创建型 / 结构型 / 行为型)组织,首页一目了然。
- 🧭 **智能目录与锚点**:每篇文章自动生成 h2/h3 目录,支持深链跳转与平滑滚动。
- 🌗 **响应式排版**:适配桌面与移动端的阅读体验。
- 🧪 **可信赖的质量**:核心数据契约(composable、patterns 清单)均配备 Vitest 单元测试。

> 适合正在准备面试、希望系统梳理 OOD 设计思路,或希望随时查阅各类模式权衡的开发者。

---

## 🚀 技术栈

| 类别       | 技术                                                | 说明                                |
| ---------- | --------------------------------------------------- | ----------------------------------- |
| 框架       | [Vue 3](https://vuejs.org/)                         | Composition API + `<script setup>` |
| 语言       | [TypeScript](https://www.typescriptlang.org/)       | 严格模式,`verbatimModuleSyntax`   |
| 构建       | [Vite 8](https://vitejs.dev/)                       | 极速冷启动与按需编译                |
| 路由       | Vue Router(Hash 模式)                              | 适配 GitHub Pages 静态托管          |
| 内容渲染   | [markdown-it](https://github.com/markdown-it/markdown-it) + `markdown-it-anchor` + `github-slugger` | Markdown → HTML,带锚点 |
| 动画       | [GSAP](https://gsap.com/) + ScrollTrigger           | 进入动画与滚动联动                  |
| 图标       | [lucide-vue-next](https://lucide.dev/)              | 矢量图标库                          |
| 元信息     | [@vueuse/head](https://github.com/vueuse/head)      | 文档标题与 SEO                      |
| 测试       | [Vitest](https://vitest.dev/) + Vue Test Utils      | 单元测试                            |
| 部署       | GitHub Actions + GitHub Pages                       | 推送 `main` 自动构建并发布          |

---

## 📂 目录结构

```
DesignPatterns/
├── src/
│   ├── main.ts                  # 应用入口,按 tokens → reset → global → prose 加载 CSS
│   ├── App.vue                  # 根布局(skip-link + RouterView)
│   ├── router/index.ts          # 路由表(/ · /pattern/:slug · /about)
│   ├── views/                   # 页面级组件:HomeView · PatternView · AboutView
│   ├── components/
│   │   ├── layout/              # Container · SiteHeader · SiteFooter
│   │   ├── home/                # HeroSection · PatternCatalog · CategorySection · PatternCard
│   │   ├── pattern/             # PatternHeader · MarkdownRenderer · PatternToc · PatternFooterNav
│   │   └── ui/                  # CategoryChip · ClayButton · ClayCard(橡皮泥拟物原子组件)
│   ├── composables/             # useMarkdown / useToc
│   ├── data/                    # patterns 清单 + 构建期预加载的 markdown 文本
│   ├── types/                   # Pattern / PatternCategory 类型契约
│   └── styles/                  # tokens.css · reset.css · global.css · prose.css
├── theory/                      # 23 篇模式长文(Markdown)
├── imgs/                        # 模式配图(构建期拷贝到 dist/imgs/)
├── tests/                       # Vitest 单元测试
├── docs/                        # 项目内部文档
├── .github/workflows/deploy.yml # GitHub Pages 部署流水线
├── vite.config.ts               # 构建配置(GSAP 拆包、静态资源拷贝)
├── tsconfig.app.json            # TypeScript 应用配置
└── vitest.config.ts             # 测试配置
```

---

## 🎯 23 种模式清单

### 创建型(Creational)— 5 种

| #  | 名称        | 英文              | 意图                                                                  |
| -- | ----------- | ----------------- | --------------------------------------------------------------------- |
| 1  | 单例模式    | Singleton         | 保证一个类只有一个实例,并提供全局访问节点。                          |
| 2  | 工厂方法模式 | Factory Method   | 将对象创建的逻辑延迟到子类决定具体实例化哪个类。                      |
| 3  | 抽象工厂模式 | Abstract Factory | 提供一个创建一系列相关对象的接口,无需指定具体类。                    |
| 4  | 建造者模式  | Builder           | 将复杂对象的构建过程与其表示分离,使同样的构建可创建不同表示。        |
| 5  | 原型模式    | Prototype         | 通过复制现有对象来创建新对象,而非通过 `new` 实例化。                |

### 结构型(Structural)— 7 种

| #  | 名称       | 英文        | 意图                                                                |
| -- | ---------- | ----------- | ------------------------------------------------------------------- |
| 6  | 适配器模式 | Adapter     | 将一个类的接口转换成客户端期望的另一种接口。                        |
| 7  | 桥接模式   | Bridge      | 将抽象与实现分离,使二者可以独立变化。                              |
| 8  | 组合模式   | Composite   | 将对象组合成树形结构以表示"部分-整体"的层次结构。                |
| 9  | 装饰模式   | Decorator   | 动态地给对象添加职责,比继承更灵活。                                |
| 10 | 外观模式   | Facade      | 为子系统中的一组接口提供一个统一的高层接口。                        |
| 11 | 享元模式   | Flyweight   | 通过共享技术有效支持大量细粒度对象的复用。                          |
| 12 | 代理模式   | Proxy       | 为其他对象提供一种代理以控制对这个对象的访问。                      |

### 行为型(Behavioral)— 11 种

| #  | 名称           | 英文                    | 意图                                                              |
| -- | -------------- | ----------------------- | ----------------------------------------------------------------- |
| 13 | 责任链模式     | Chain of Responsibility | 将请求沿处理链传递,直到有对象处理它为止。                          |
| 14 | 命令模式       | Command                 | 将请求封装为对象,从而支持可撤销、可排队的操作。                    |
| 15 | 迭代器模式     | Iterator                | 提供一种方法顺序访问聚合对象中的元素,而不暴露其内部表示。          |
| 16 | 解释器模式     | Interpreter             | 给定一种语言,定义它的文法表示,并提供一个解释器。                  |
| 17 | 中介者模式     | Mediator                | 用一个中介对象封装一系列对象之间的交互。                            |
| 18 | 备忘录模式     | Memento                 | 在不破坏封装的前提下捕获对象的内部状态并保存。                      |
| 19 | 观察者模式     | Observer                | 定义对象间一对多的依赖关系,状态变化时通知所有依赖者。              |
| 20 | 状态模式       | State                   | 允许对象在其内部状态改变时改变其行为。                              |
| 21 | 策略模式       | Strategy                | 定义一系列算法,将每个算法封装起来并使它们可互换。                  |
| 22 | 模板方法模式   | Template Method         | 在父类中定义算法骨架,将某些步骤延迟到子类实现。                    |
| 23 | 访问者模式     | Visitor                 | 在不修改元素类的前提下为对象结构增加新操作。                        |

---

## 🛠️ 本地开发

### 环境要求

- **Node.js** ≥ 20(推荐 24,与 CI 一致)
- **npm** ≥ 10

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/Moon-Knight1/DesignPatterns.git
cd DesignPatterns

# 2. 安装依赖
npm install

# 3. 启动开发服务器(默认 http://localhost:5173)
npm run dev
```

### 常用脚本

| 命令                | 说明                                  |
| ------------------- | ------------------------------------- |
| `npm run dev`       | 启动 Vite 开发服务器并自动打开浏览器  |
| `npm run build`     | 类型检查 + 生产构建,产出 `dist/`     |
| `npm run preview`   | 本地预览 `dist/` 产物                |
| `npm run typecheck` | 仅运行 `vue-tsc` 类型检查             |
| `npm test`          | 单次运行 Vitest(CI 用)               |
| `npm run test:watch`| Vitest watch 模式                     |

### 运行单个测试文件

```bash
npx vitest run tests/useMarkdown.test.ts
```

---

## 🧪 测试

项目使用 [Vitest](https://vitest.dev/) 作为测试框架,核心模块均配备单元测试:

- **数据契约**:`tests/patterns.test.ts` 硬约束 23 条模式的类目配额(创建型 5 / 结构型 7 / 行为型 11)。
- **渲染逻辑**:`tests/useMarkdown.test.ts` 校验 markdown-it 配置、行首 `- ` 折叠、相对路径改写等关键行为。
- **响应式数据流**:`tests/markdown-renderer-reactivity.test.ts` 校验路由切换时内容不冻结。

新增模式或修改 `useMarkdown` / `useToc` 时务必同步更新测试。

---

## 🚢 部署

本项目通过 GitHub Actions 自动部署到 **GitHub Pages**。

### 触发条件

- 推送到 `main` 分支自动触发
- 也可在 GitHub Actions 页面手动 `workflow_dispatch`

### 流水线

1. **`build`** — 在 `ubuntu-latest` 上 `npm ci` → `npm run build`
2. **`deploy`** — 将 `dist/` 通过 `actions/deploy-pages` 发布到 GitHub Pages

> ⚠️ **不要**在 Pull Request 上触发部署——`.github/workflows/deploy.yml` 仅监听 `push` 与 `workflow_dispatch`。

部署完成后,可在 `https://<username>.github.io/DesignPatterns/` 访问。

---

## 🤝 贡献指南

欢迎任何形式的贡献,包括但不限于:

- 修正错别字、术语不一致、代码示例错误
- 补充 UML 图、对比表格、实战案例
- 改进排版、可访问性、移动端体验
- 新增测试用例覆盖边界场景

### 提交流程

1. Fork 本仓库
2. 创建特性分支:`git checkout -b feat/your-change`
3. 提交变更:`git commit -m 'feat: describe your change'`
4. 推送分支:`git push origin feat/your-change`
5. 创建 Pull Request,并描述改动动机与影响面

### 新增一种模式

1. 在 `theory/<slug>.md` 撰写文章(参考 Refactoring Guru 风格)
2. 在 `src/data/patterns.ts` 的 `patterns` 数组追加条目(注意 `order` 与 `category`)
3. 将配图放入 `imgs/<pattern>/`,Markdown 中以相对路径引用
4. 同步运行 `npm test` 与 `npm run build` 验证

### 提交信息规范

推荐遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: 新增功能
fix:  修复 Bug
docs: 仅文档变更
style: 不影响代码含义的格式变更
refactor: 既非新功能也非 Bug 修复的代码变更
test: 新增或修改测试
chore: 构建过程或辅助工具的变更
```

---

## 📐 设计取舍

- **Hash 路由**:为兼容 GitHub Pages 静态托管,使用 `createWebHashHistory`。**不要切换到 `createWebHistory`**,否则非根路径会 404。
- **CSS 变量统一**:颜色 / 间距 / 圆角 / 阴影 / 字体一律走 `src/styles/tokens.css`,**禁止硬编码**。
- **CSS 加载顺序**:`tokens.css` → `reset.css` → `global.css` → `prose.css`,新增全局样式必须插入到正确位置。
- **响应式数据流**:`useMarkdown(source)` / `useToc(html)` 必须接收 `Ref<string>`,否则路由切换时内容会冻结。
- **GSAP 拆包**:构建配置把 `gsap` + `ScrollTrigger` 单独切包,避免拖累首屏 JS 体积。
- **静态图片拷贝**:`imgs/` 通过 `vite-plugin-static-copy` 拷到 `dist/`,**不要**改成 `public/imgs/`,路径改写会错位。

更多细节可参阅 [CLAUDE.md](./CLAUDE.md)。

---

## 📄 许可证

本项目以 **MIT 许可证** 开源,详见 [LICENSE](./LICENSE) 文件。

> 内容参考自 [Refactoring Guru](https://refactoringguru.cn/) 等公开资料,遵循其相应许可并标注来源。如涉及版权问题请通过 Issue 反馈。

---

## 🙏 致谢

- [Refactoring Guru](https://refactoringguru.cn/) — 模式讲解的核心参考
- [GoF《设计模式》](https://en.wikipedia.org/wiki/Design_Patterns) — 23 种模式的奠基之作
- 所有为本项目提交 Issue、PR 与建议的贡献者

---

<div align="center">

如果本项目对你有帮助,欢迎 ⭐ Star 支持!

**Made with ❤️ by [Moon-Knight1](https://github.com/Moon-Knight1)**

</div>