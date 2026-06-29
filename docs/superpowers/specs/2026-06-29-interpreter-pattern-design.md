# 解释器模式 (Interpreter Pattern) — 设计稿

日期：2026-06-29
项目：DesignPatterns（Vue 3 + Vite + TS 单页应用，中文 GoF 设计模式学习手册）
状态：已获用户口头批准，待用户审阅本文档后进入实施计划阶段

## 1. 背景与现状

- 项目当前注册 **22 个 GoF 模式**，缺少 **解释器模式**（Interpreter）。
- `theory/interpreter.md` 文件已存在，但内容为乱码（疑似早期 Abstract Factory 文件编码错误），路由 `/pattern/interpreter` 当前会因为找不到内容而 404。
- `imgs/` 下没有 `interpreter/` 目录。
- 参考资料：<https://www.seven97.top/system-design/design-pattern/interpreter.html>（七七大、Java 加减法解释器示例）。

## 2. 设计目标

把解释器模式作为第 23 个模式加入手册，与现有 22 个模式保持一致的内容风格、图片路径规范与元数据注册方式。

## 3. 内容设计

### 3.1 理论稿风格

覆盖现有乱码的 `theory/interpreter.md`，按本站统一的 RefactoringGuru 风格改写七七大原文的事实基础（Java 加减法示例、语法规则、AST、文法角色、Context/Variable 等概念）。

### 3.2 章节结构

与 `theory/visitor.md` 等保持一致：

1. **意图** — 给定一种语言，定义它的文法表示，并提供一个解释器来解释语言中的句子
2. **问题** — 组合无限的运算符/数值对（如 `1+2+3-4`），传统工具类无法应对
3. **解决方案** — 把运算符和数字都看作节点，构建抽象语法树（AST）逐节点解释
4. **真实世界类比** — 音乐家按乐谱演奏：语法规则是"乐谱"，解释器是"演奏者"
5. **解释器模式结构** — 配 `structure-zh.png`；角色说明（AbstractExpression / TerminalExpression / NonterminalExpression / Context / Client）
6. **伪代码** — Java 风格的 `Expression` / `Number` / `Variable` / `Plus` / `Minus` / `Context` 接口骨架
7. **适合应用场景** — 文法简单、执行效率不是关键、问题重复出现且能用简单语言表达
8. **实现方式** — 7 步实现指引（声明 `interpret(Context)`、终结符与非终结符、共享 Context 等）
9. **优缺点** — 易扩展 / 易实现 vs 类数量膨胀 / 执行效率低
10. **与其他模式的关系** — 与 Composite（AST 节点树）、State、Strategy、Visitor 的关联
11. **代码示例** — 完整的 Java 加减法解释器，基于七七大示例改写为中文注释、保留核心逻辑

### 3.3 图片

下载七七大文中的 3 张远程图到本地 `imgs/interpreter/`：

| 远程 URL | 本地路径 |
|---|---|
| `https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271806730.png`（结构图） | `imgs/interpreter/structure-zh.png` |
| `https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271807269.png`（AST 示例） | `imgs/interpreter/ast-zh.png` |
| `https://seven97-blog.oss-cn-hangzhou.aliyuncs.com/imgs/202404271807077.png`（案例实现） | `imgs/interpreter/example-zh.png` |

md 引用约定：`![…](../imgs/interpreter/<file>.png)`，由 `useMarkdown.ts` 的 BASE_URL 重写逻辑处理（开发与生产环境均适用）。

## 4. 元数据注册

在 `src/data/patterns.ts` 的行为型分组里，于 iterator 之后、mediator 之前插入：

```ts
{ slug: 'interpreter',     titleZh: '解释器模式',     titleEn: 'Interpreter',        category: 'behavioral', summary: '给定一种语言，定义它的文法表示，并提供一个解释器来解释语言中的句子。', order: 4 },
```

后续模式 order 全部 +1（共 7 个条目调整：mediator 4→5、memento 5→6、observer 6→7、state 7→8、strategy 8→9、template-method 9→10、visitor 10→11）。

`categories.behavioral.items` 仍由 `order` 排序，无需额外改动。`TOTAL_PATTERNS` 从 22 变为 23，footer 计数与"上一篇/下一篇"链自动更新。

## 5. 影响的文件清单

- **修改** `src/data/patterns.ts`（新增 1 个条目，6 个 order 字段 +1）
- **覆盖** `theory/interpreter.md`（替换乱码，重写为统一格式）
- **新增** `imgs/interpreter/structure-zh.png`、`imgs/interpreter/ast-zh.png`、`imgs/interpreter/example-zh.png`（共 3 张图片）
- **无需改动** `useMarkdown.ts`（图片路径规则 `../imgs/<slug>/...` 已支持）、`router/index.ts`（hash 路由 + slug 解析自动适配）、`MarkdownRenderer.vue`（通用）

## 6. 验证方式

- `npm run build` 通过，无类型错误
- `npm run test` 全部通过（特别是 `useMarkdown.test.ts` 验证图片路径 BASE_URL 重写逻辑）
- 手动访问 `https://moon-knight1.github.io/DesignPatterns/#/pattern/interpreter` 与 `/#/pattern/interpreter`（本地 dev）能正常渲染出结构图、AST、代码示例，无 404
- 首页行为型分类下能看到 11 张卡片，顺序为：责任链、命令、迭代器、**解释器**、中介者、备忘录、观察者、状态、策略、模板方法、访问者
- 详情页底部"上一篇/下一篇"链指向：迭代器（←）与中介者（→）

## 7. 范围外 (Out of Scope)

- 不修改其他 22 个模式的现有内容
- 不引入新的依赖或工具
- 不调整路由、图片渲染、TOC、SEO 等通用基础设施
- 不修改 README、CLAUDE.md 等项目级文档