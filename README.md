<div align="center">

# HermesManager

让小白点点点就能用上 **HermesAgent** 的图形化一键安装器。

![progress](https://img.shields.io/badge/progress-82%25-FF6B00?style=for-the-badge)
![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-0B0F19?style=for-the-badge)
![license](https://img.shields.io/badge/license-MIT-22C55E?style=for-the-badge)

</div>

## 它能做什么

- 🔍 **自动体检**：系统版本、虚拟化、WSL、Homebrew、依赖、网络连通性，全部可视化检测
- 🚀 **一键安装**：Windows 走 WSL2 + Ubuntu，macOS 走 Homebrew，自动适配
- 🌐 **国内加速**：内置清华 / ghproxy / npmmirror 镜像，**无需科学上网**
- 🧠 **模型自由选**：内置 15+ 提供商卡片（百炼 / DeepSeek / Kimi / 智谱 / MiniMax / Ollama / OpenAI / Claude / Gemini …），一键获取 Key 链接 + 连接测试
- 🎨 **中文图形界面**：深色底 + 爱马仕橙 `#FF6B00` 点缀，全程零命令行

## 下载

> **进度追踪**：[`PROGRESS.md`](./PROGRESS.md) · 实时更新完成度百分比

v0.1.0 Release 正在搭建中，届时在 Release 页提供：

- `HermesManager-Setup-x.y.z-x64.msi`（Windows 10/11 x64）
- `HermesManager-x.y.z-universal.dmg`（macOS 12+ Intel & Apple Silicon）

## 关于 HermesAgent

[HermesAgent](https://github.com/NousResearch/hermes-agent) 是 Nous Research 于 2026 年 2 月开源的自主 AI Agent 框架。
它能**持久记忆**跨会话的内容、**自主创建技能**、接入 **40+ 种大模型**、通过 Telegram / Discord / Slack / WhatsApp / 微信等 IM 使用。
详见 [`docs/HermesAgent-小白指南.md`](./docs/HermesAgent-小白指南.md)。

## 开发

```bash
# 依赖：Node 22+、Rust 1.80+、Windows 或 macOS
npm install
npm run tauri dev        # 开发模式
npm run tauri build      # 打包产物：.msi / .dmg
```

## 技术栈

- **Tauri 2** · Rust 后端 + 原生 WebView，体积小 ~10MB
- **React 19 + TypeScript + Vite + TailwindCSS + lucide-react**
- **CI**：GitHub Actions 双平台矩阵自动 Release

## 许可证

MIT © TaoDeepX
