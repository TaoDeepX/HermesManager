# HermesManager 开发进度

> 总进度实时更新 · 最后更新：2026-04-21

![progress](https://img.shields.io/badge/progress-95%25-FF6B00?style=for-the-badge)

## 总进度：**95%**

权重按里程碑估算，完成一步即刷新本文件顶部 badge 与下表。

## 里程碑

| # | 里程碑 | 状态 | 完成度 | 权重 |
|---|---|---|---|---|
| M1 | 脚手架 · Tauri+React+TS · 仓库初始化 · CI 空壳 | ✅ | 100% | 10% |
| M2 | 体检页 · 双平台 detect · UI 展示 | ✅ | 100% | 20% |
| M3 | Windows 安装链路 · WSL2 / Ubuntu / hermes_setup.sh | ✅ | 95% | 25% |
| M4 | macOS 安装链路 · Homebrew 镜像 / 依赖 / Hermes | ✅ | 90% | 15% |
| M5 | Provider 向导 · `.env` 写入 · 连接测试 | ✅ | 95% | 20% |
| M6 | 美化 + 文档 + CI Release v0.1.0 双平台产物 | 🚧 | 70% | 10% |

## M1 子任务

- [x] 规划方案与需求确认
- [x] 本机安装 Rust / GitHub CLI
- [x] `npm create tauri-app` 生成 React+TS 模板
- [x] 集成 Tailwind + 爱马仕橙主题 tokens + 基础组件样式
- [x] 基础目录结构（pages / lib）
- [x] `PROGRESS.md` / `README.md` / `docs/` 初稿
- [x] `git init` + 首次提交
- [x] 创建 GitHub 仓库 `TaoDeepX/HermesManager` 并推送
- [x] GitHub Actions 双平台打包工作流（`ci.yml` + `release.yml`）

## M2 子任务

- [x] Rust `detect` 模块：OS/架构/磁盘/虚拟化/WSL/WSL发行版/Xcode CLT/Homebrew/git/curl/网络连通性/Hermes 已装检测
- [x] Tauri 命令 `detect_environment` + 前端 IPC 封装
- [x] Doctor 页面：统计卡片 + 检查列表 + 重新检测 + 自动修复标记
- [ ] CI `rust-check` 双平台（Windows/macOS）验证通过
- [ ] "一键修复"实际绑定（后移到 M3/M4）

## M3-M5 子任务

- [x] M3 · `wsl_bootstrap.ps1`（启用 WSL2 + 安装 Ubuntu，支持清华 rootfs 离线导入）
- [x] M3 · `install_win.rs`（orchestrate WSL → run hermes_setup.sh inside WSL）
- [x] M3/M4 · `hermes_setup.sh` 共享（clone + uv + python 依赖 + 配置目录 + CLI 软链）
- [x] M3 · `runner.rs` 流式命令运行器（事件 `install-log` / `install-progress` 推送前端）
- [x] M3 · `Install.tsx` UI（进度条 + 日志流 + 复制日志）
- [x] M4 · `install_mac.rs`（Homebrew 自检 + 清华 brew 脚本 + 共享 hermes_setup.sh）
- [x] M4 · `mirrors.rs`（GitHub/PyPI/Brew/Node/Ubuntu rootfs 国内镜像常量）
- [x] M5 · Provider 注册表 15+ 提供商（国内 7 + 国际 8 + 自定义）
- [x] M5 · `probe.rs` 连接测试命令（POST /chat/completions, 延迟/状态码/错误回显）
- [x] M5 · `Provider.tsx`（分组 Tab + 搜索 + 卡片 + 表单 + 获取 Key 外链 + 测试连接）
- [x] M5 · `open_external` 命令 + `.env` KV 向 Install 流程透传
- [ ] M6 · 本地 Rust 工具链（等用户决定 MSVC vs GNU vs 纯靠 CI）
- [x] M6 · 完成页（`Done.tsx`）：复制启动命令 + 指南外链
- [x] M6 · CI 双平台 rust-check 全部通过（Win+Mac）
- [x] M6 · 打 `v0.1.0` tag 触发 Release 构建（流水号 24706204632）
- [ ] M6 · 等 Release workflow 完成访问 Draft Release 下载产物
- [ ] M6 · 本地开发环境（MSVC BuildTools or GNU）——非阻塞项，CI 已能出包

## 最近更新

- 2026-04-21 14:20 · M6 ✅ Done 页、双平台 CI 全绿、v0.1.0 tag 已推送 Release workflow 开跑
- 2026-04-21 14:00 · M3/M4/M5 推进：WSL 引导、安装编排、流式日志、Provider 卡片、连接测试、15 个提供商全部到位
- 2026-04-21 13:30 · M2 推进：detect 模块 + Doctor UI 完成，增加 CI 双平台 rust-check（本地无 MSVC，由 CI 验证编译）
- 2026-04-21 13:15 · 仓库首次推送成功：<https://github.com/TaoDeepX/HermesManager>
- 2026-04-21 12:55 · M1 启动：Tauri 项目脚手架生成完毕，Rust 1.95 / gh CLI 2.90 安装就绪
