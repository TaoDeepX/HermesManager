# HermesAgent 小白指南

本文用大白话讲清楚 HermesAgent 是什么、能干什么、怎么用、要花多少钱、和 OpenClaw 有啥区别。

## 一句话概括

**HermesAgent** 是一个会长期记住你、能自己学新技能、能用 IM 和你聊天、背后接着任意大模型的"超级数字管家"。

## 和 OpenClaw 的区别

| 维度 | OpenClaw | HermesAgent |
|---|---|---|
| 定位 | 个人 AI 管家（消费级） | Agent 框架（工程化） |
| 开发方 | 奥地利独立开发者 Peter Steinberger | Nous Research |
| 记忆 | 静态记忆，容易"失忆" | **FTS5 全文检索 MemPalace**，跨会话持续记住 |
| 技能 | 内置固定技能 | **可自主创建程序化 Skills** 并长期积累 |
| 训练闭环 | 无 | 与 Nous 自家 Atropos(RL) / Tinker 打通 |
| 模型支持 | 主流几家 | **40+ 提供商**，含 Nous Portal / OpenRouter / OpenAI / Claude / Gemini / 百炼 / DeepSeek / Kimi / 智谱 / 小米 / MiniMax / Ollama 本地等 |
| IM 支持 | Telegram / Discord / Slack / WhatsApp | 同上 + **原生支持微信** |
| 可审计 | 黑盒 | **MEMORY.md 可直接打开编辑** |
| 开源协议 | MIT | MIT |

一句话总结：**OpenClaw 是玩具，HermesAgent 是能跟你一起成长的工具**。

## 它能干什么（场景）

- 💬 **聊天问答**：像 ChatGPT，但会记住你上次说过的话
- 💻 **写代码 / 审代码**：在终端里或 IDE 里协助编程
- 🌐 **搜网页 + 抓内容**：通过 Firecrawl 等工具联网查资料
- 🎨 **生成图片**：接 FLUX / Gemini 等图像模型
- ⏰ **定时提醒**：内置 cron 调度器，"每天 9 点提醒我喝水"
- 📲 **IM 使用**：把它接到微信/Telegram，手机上直接聊
- 📂 **操作文件**：读写本地文件、管理 40+ 种内置工具

## 怎么使用（使用 HermesManager 安装后）

1. **Windows**：开始菜单搜索 `HermesManager` 双击打开
2. **macOS**：启动台 `HermesManager.app` 打开
3. 点"开始体检" → 自动修复环境
4. 选一个模型提供商（国内推荐**百炼 DashScope**，注册就送额度）
5. 填 API Key → 点"测试连接"看到 ✅
6. 等待自动安装（3-10 分钟，视网速而定）
7. 完成后可选：
   - **终端使用**：在 WSL / macOS 终端输入 `hermes`
   - **IM 使用**：在配置页勾选微信/Telegram 网关，扫码登录即可

## 费用情况

- ✅ **HermesAgent 框架本身：完全免费开源**
- ✅ **HermesManager 安装器：完全免费开源**
- ⚠️ **大模型 API 调用：按 token 计费**（真正的成本来源）
  - 阿里百炼：**新用户赠送免费额度**，之后 `qwen3-coder-plus` ¥0.002 / 千 token 起
  - DeepSeek：¥0.001 / 千 token 起，非常便宜
  - OpenAI GPT-4o：约 ¥0.02 / 千 token（需代理）
  - **本地 Ollama：零费用**（需本机算力，8B 模型需 ~8GB 显存）
- ⚠️ **可选工具费用**：
  - Firecrawl（网页抓取）：免费额度够用
  - FAL（图像生成）：按张计费

**结论**：轻度使用一个月 ¥10-30 足够；要完全免费，就选 Ollama 本地。

## 安装难度（自己动手 vs 用 HermesManager）

| 环节 | 自己动手 | 用 HermesManager |
|---|---|---|
| 装 WSL2（仅 Win） | ★★★★ 多数卡在虚拟化未开 | ★ 自动检测 + 修复 |
| 装 uv / Python / Node / ffmpeg | ★★★ 命令一堆 | ★ 自动 |
| Clone 仓库（无代理） | ★★★★★ 经常失败 | ★ 走 ghproxy |
| 装 Python 依赖（无代理） | ★★★★ pip 超时 | ★ 走清华 PyPI |
| 配 API Key | ★★ 需懂 .env | ★ 图形界面填空 |
| 连接测试 | ★★★ 需自己 curl | ★ 一键按钮 |

## 注意事项

- Windows **必须**启用虚拟化（BIOS 里），HermesAgent 官方不支持原生 Win
- macOS 首次打开 HermesManager 可能提示"未签名"，**右键→打开**一次即可
- 建议至少留 **10GB 磁盘空间**（WSL Ubuntu + Python venv + 模型缓存）
- API Key **只保存在你本机** `~/.hermes/.env`，HermesManager 不会上传任何数据
