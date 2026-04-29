import {
  CheckCircle2,
  ExternalLink,
  Rocket,
  Sparkles,
  MessagesSquare,
  Wrench,
  RefreshCw,
  Cog,
  FileText,
  Brain,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { openExternal, launchHermesTerminal, uninstallHermes } from "../lib/tauri";
import { cn } from "../lib/cn";

type Action = {
  icon: React.ElementType;
  title: string;
  desc: string;
  cmd: string;
  primary?: boolean;
};

const PRIMARY_ACTIONS: Action[] = [
  {
    icon: Rocket,
    title: "TUI 模式（推荐）",
    desc: "现代化终端界面 · 鼠标选中 · 模态弹层",
    cmd: "--tui",
    primary: true,
  },
  {
    icon: Sparkles,
    title: "经典 CLI 模式",
    desc: "传统命令行界面 · 兼容老脚本",
    cmd: "",
  },
];

const SECONDARY_ACTIONS: Action[] = [
  {
    icon: MessagesSquare,
    title: "配置消息平台",
    desc: "Telegram / 飞书 / Discord / 企业微信等 15+ 平台",
    cmd: "gateway setup",
  },
  {
    icon: Cog,
    title: "重新配置",
    desc: "切换 provider · 改 API Key · 调整模型",
    cmd: "setup",
  },
  {
    icon: Wrench,
    title: "Hermes 体检",
    desc: "诊断 hermes 自身配置健康度",
    cmd: "doctor",
  },
  {
    icon: RefreshCw,
    title: "更新到最新版",
    desc: "拉取最新代码 · 升级依赖",
    cmd: "update",
  },
];

const NEXT_STEPS = [
  {
    icon: Brain,
    title: "记忆系统",
    desc: "自动记住过往对话 · FTS5 跨会话召回",
    url: "https://hermes-agent.nousresearch.com/docs/user-guide/features/memory",
  },
  {
    icon: Zap,
    title: "Skills 技能",
    desc: "Agent 自创技能 · 可分享给他人",
    url: "https://hermes-agent.nousresearch.com/docs/user-guide/features/skills",
  },
  {
    icon: Workflow,
    title: "MCP 集成",
    desc: "接入任意 MCP 服务器 · 扩展能力",
    url: "https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp",
  },
];

export default function Done({ onUninstalled }: { onUninstalled?: () => void } = {}) {
  const [launching, setLaunching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [uninstalled, setUninstalled] = useState(false);

  const handleUninstall = async () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true);
      return;
    }
    setUninstalling(true);
    setError(null);
    try {
      await uninstallHermes();
      setUninstalled(true);
      // 2 秒后自动返回体检页（让用户看到成功提示）
      setTimeout(() => {
        onUninstalled?.();
      }, 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setUninstalling(false);
      setConfirmUninstall(false);
    }
  };

  const handleLaunch = async (cmd: string) => {
    setLaunching(cmd);
    setError(null);
    try {
      await launchHermesTerminal(cmd);
    } catch (e) {
      setError(String(e));
    } finally {
      setTimeout(() => setLaunching(null), 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-success/10 text-success items-center justify-center">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="mt-5 text-3xl font-bold">HermesAgent 已就绪 🎉</h2>
        <p className="mt-3 text-text-muted leading-relaxed">
          点击下方任一按钮即可在新终端启动，无需手动复制命令。
        </p>
      </div>

      {/* 启动模式选择 */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map((a) => (
          <ActionCard
            key={a.cmd}
            action={a}
            launching={launching === a.cmd}
            onClick={() => handleLaunch(a.cmd)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-3 card p-3 text-xs text-error bg-error/5 border-error/20">
          启动失败：{error}（你也可以手动在终端执行 <code>hermes</code>）
        </div>
      )}

      {/* 常用操作 */}
      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
          <Wrench size={14} /> 常用管理命令
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_ACTIONS.map((a) => (
            <ActionCard
              key={a.cmd}
              action={a}
              launching={launching === a.cmd}
              onClick={() => handleLaunch(a.cmd)}
              compact
            />
          ))}
        </div>
      </div>

      {/* 下一步学习 */}
      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
          <Sparkles size={14} /> 接下来探索这些进阶能力
        </div>
        <div className="grid grid-cols-3 gap-3">
          {NEXT_STEPS.map((s) => (
            <button
              key={s.title}
              className="card p-4 text-left hover:border-brand transition-colors"
              onClick={() => openExternal(s.url)}
            >
              <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                <s.icon size={16} />
              </div>
              <div className="mt-3 font-medium text-sm">{s.title}</div>
              <div className="mt-1 text-xs text-text-muted leading-relaxed">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-text-faint">
        <button
          className="hover:text-brand flex items-center gap-1"
          onClick={() => openExternal("https://hermes-agent.nousresearch.com/docs")}
        >
          <ExternalLink size={12} /> 官方文档
        </button>
        <span>·</span>
        <button
          className="hover:text-brand flex items-center gap-1"
          onClick={() =>
            openExternal(
              "https://github.com/TaoDeepX/HermesManager/blob/main/docs/HermesAgent-%E5%B0%8F%E7%99%BD%E6%8C%87%E5%8D%97.md",
            )
          }
        >
          <FileText size={12} /> 中文小白指南
        </button>
        <span>·</span>
        <button
          className="hover:text-brand flex items-center gap-1"
          onClick={() => openExternal("https://github.com/TaoDeepX/HermesManager/issues/new")}
        >
          反馈问题
        </button>
      </div>

      {/* 危险操作区 */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="text-xs text-text-muted mb-3">危险操作</h3>
        {uninstalled ? (
          <div className="w-full p-4 rounded-lg border border-green-500/30 bg-green-500/10 text-center">
            <div className="text-green-500 font-medium">✓ HermesAgent 已完全删除</div>
            <p className="mt-1 text-xs text-text-muted">可关闭此应用</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleUninstall}
              disabled={uninstalling}
              className={cn(
                "w-full p-3 rounded-lg border text-sm transition-all",
                confirmUninstall
                  ? "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "border-border text-text-muted hover:border-red-500/50 hover:text-red-500",
                uninstalling && "opacity-50 pointer-events-none"
              )}
            >
              {uninstalling ? "删除中..." : confirmUninstall ? "⚠️ 确认删除？点击再次确认" : "🗑️ 完全卸载 HermesAgent"}
            </button>
            {confirmUninstall && (
              <p className="mt-2 text-xs text-red-500/80">
                将删除 ~/hermes-agent、~/.hermes 和 CLI。此操作不可恢复。
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  action,
  launching,
  onClick,
  compact,
}: {
  action: Action;
  launching: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = action.icon;
  return (
    <button
      className={cn(
        "card text-left transition-all relative overflow-hidden group",
        compact ? "p-3" : "p-5",
        action.primary
          ? "border-brand/40 bg-brand/5 hover:border-brand hover:bg-brand/10"
          : "hover:border-brand/40",
        launching && "opacity-70 pointer-events-none",
      )}
      onClick={onClick}
      disabled={launching}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-lg flex items-center justify-center shrink-0",
            compact ? "w-8 h-8" : "w-10 h-10",
            action.primary ? "bg-brand text-black" : "bg-brand-soft text-brand",
          )}
        >
          <Icon size={compact ? 14 : 18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
            {action.title}
          </div>
          <div className={cn("text-text-muted leading-snug", compact ? "text-[10px] mt-0.5" : "text-xs mt-1")}>
            {action.desc}
          </div>
        </div>
        {launching && (
          <div className="text-xs text-brand animate-pulse">启动中…</div>
        )}
      </div>
    </button>
  );
}
