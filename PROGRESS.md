# HermesManager 开发进度

> 总进度实时更新 · 最后更新：2026-04-21

![progress](https://img.shields.io/badge/progress-8%25-FF6B00?style=for-the-badge)

## 总进度：**8%**

权重按里程碑估算，完成一步即刷新本文件顶部 badge 与下表。

## 里程碑

| # | 里程碑 | 状态 | 完成度 | 权重 |
|---|---|---|---|---|
| M1 | 脚手架 · Tauri+React+TS · 仓库初始化 · CI 空壳 | 🚧 | 40% | 10% |
| M2 | 体检页 · 双平台 detect · UI 展示 | ⏳ | 0% | 20% |
| M3 | Windows 安装链路 · WSL2 / Ubuntu / hermes_setup.sh | ⏳ | 0% | 25% |
| M4 | macOS 安装链路 · Homebrew 镜像 / 依赖 / Hermes | ⏳ | 0% | 15% |
| M5 | Provider 向导 · `.env` 写入 · 连接测试 | ⏳ | 0% | 20% |
| M6 | 美化 + 文档 + CI Release v0.1.0 双平台产物 | ⏳ | 0% | 10% |

## M1 子任务

- [x] 规划方案与需求确认
- [x] 本机安装 Rust / GitHub CLI
- [x] `npm create tauri-app` 生成 React+TS 模板
- [ ] 集成 Tailwind + shadcn 基础组件 + 爱马仕橙主题 tokens
- [ ] 基础目录结构（pages / components / hooks / lib）
- [ ] `PROGRESS.md` / `README.md` / `docs/` 初稿
- [ ] `git init` + 首次提交
- [ ] 创建 GitHub 仓库 `TaoDeepX/HermesManager` 并推送
- [ ] GitHub Actions 双平台打包工作流（空壳可跑通）

## 最近更新

- 2026-04-21 12:55 · M1 启动：Tauri 项目脚手架生成完毕，Rust 1.95 / gh CLI 2.90 安装就绪
