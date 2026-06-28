# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库定位

这是一个**设计模式中文知识库**，主体内容是 GoF 23 种设计模式的 Markdown 理论文档（`theory/<pattern>.md`）以及对应的插图（`imgs/<pattern>/*.png`）。仓库**没有应用代码、构建系统或测试套件**——修改通常发生在 Markdown 文档和图片资源上。

`theory/interpreter.md` 当前为空文件（0 字节），不要凭空虚构内容；若需要补齐，先与用户确认范围。

## 目录结构

- `theory/` — 23 个设计模式文档，按模式名命名（如 `singleton.md`、`observer.md`）。每个文件包含：意图、问题、解决方案、真实世界类比、结构图、伪代码等小节，引用同名的 `imgs/<pattern>/` 下的 PNG。
- `imgs/<pattern>/` — 各模式的插图（UML 结构图、带编号的结构图、漫画示意图等）。
- `download_images.py` — 唯一可执行脚本，负责把 Markdown 中远程图片链接下载到本地 `imgs/<pattern>/`，并可改写 Markdown 中的链接为相对路径（详见下文）。
- `.vscode/settings.json` — 将 Python 环境与包管理器固定为 `conda`（Anaconda）。
- `.gitignore` — 显式忽略 `download_images.py` 自身、`__pycache__/` 等本地产物。

## 图片资源维护流程（`download_images.py`）

脚本读取的是 `output/` 目录，而本仓库的 Markdown 实际位于 `theory/`。**直接调用脚本而不指定 `--output-dir` 会失败**，常见用法：

```bash
# 用 Anaconda 的解释器（见下文 Python 解释器约束）
D:/Developer/Anaconda3/python.exe download_images.py --output-dir theory --dry-run          # 仅打印待下载项
D:/Developer/Anaconda3/python.exe download_images.py --output-dir theory                    # 实际下载
D:/Developer/Anaconda3/python.exe download_images.py --output-dir theory --rewrite-md        # 仅把远程链接改写为相对路径后退出
```

- `--rewrite-md` 是**幂等破坏性**操作：会把 `![alt](https://...)` 替换为 `![alt](../imgs/<pattern>/<file>)` 并写回原文件；非远程 URL（已是相对路径或 `data:`）保持不变。批量重写前建议先 `--dry-run` 复核。
- 下载默认 8 个并发线程，开启 `--no-skip-existing` 会覆盖已有图片。
- 依赖 `requests`（Anaconda 默认环境已包含；Pyright 静态环境未装，已在脚本里加 `type: ignore` 抑制告警）。

## Python 解释器

本机 `python` 命令指向 Windows App Store 占位符，不会真正执行 Python。运行任何脚本（含 `download_images.py`）都必须使用 Anaconda 完整路径：

```
D:\Developer\Anaconda3\python.exe
D:\Developer\Anaconda3\Scripts\pip.exe
```

在 Skill、shell 命令、子进程中需要调用 Python 时，统一用绝对路径替代 `python` / `pip`。

## 编辑 Markdown 时的注意事项

- 图片引用使用相对路径 `../imgs/<pattern>/<file>.png`，新增图片时务必把文件放到对应子目录，**不要**在 Markdown 里写绝对路径或远程 URL（除非你打算随后用 `--rewrite-md` 处理）。
- Markdown 文本为中文，遵循现有风格：每节用 `##` 二级标题，伪代码块用普通围栏代码块（无语言标签），列表项以 `- ` 开头；不要混用全角/半角标点之外的风格。
- 修改后没有自动校验脚本——提交前至少通读 diff，确认图片链接未断裂、章节顺序未被打乱。
