import { CheckCircle2, Copy, ExternalLink, Terminal, FileText } from "lucide-react";
import { useState } from "react";
import { openExternal } from "../lib/tauri";

export default function Done() {
  const [copied, setCopied] = useState(false);

  const cmd = navigator.userAgent.includes("Windows") ? "wsl -- hermes" : "hermes";

  const copy = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-success/10 text-success items-center justify-center">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="mt-5 text-3xl font-bold">HermesAgent 已就绪 🎉</h2>
      <p className="mt-3 text-text-muted leading-relaxed">
        恭喜！你的数字管家已经安装完成，现在可以开始和它对话了。
      </p>

      <div className="mt-8 card p-5 text-left">
        <div className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
          <Terminal size={14} /> 启动命令
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-bg-muted rounded-lg px-3 py-2 text-sm font-mono border border-border-subtle">
            {cmd}
          </code>
          <button className="btn-outline h-10 px-3 text-xs" onClick={copy}>
            <Copy size={14} /> {copied ? "已复制" : "复制"}
          </button>
        </div>
        <div className="mt-2 text-xs text-text-faint">
          在任意终端（Windows PowerShell / macOS Terminal）输入上方命令即可启动。
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <LinkCard
          icon={<FileText size={16} />}
          title="使用指南"
          desc="什么能做 · 费用说明 · 常见问题"
          onClick={() =>
            openExternal(
              "https://github.com/TaoDeepX/HermesManager/blob/main/docs/HermesAgent-%E5%B0%8F%E7%99%BD%E6%8C%87%E5%8D%97.md",
            )
          }
        />
        <LinkCard
          icon={<ExternalLink size={16} />}
          title="官方文档"
          desc="hermes-agent.nousresearch.com"
          onClick={() => openExternal("https://hermes-agent.nousresearch.com/docs")}
        />
      </div>

      <div className="mt-8 text-xs text-text-faint">
        遇到问题？
        <button
          className="text-brand hover:underline ml-1"
          onClick={() => openExternal("https://github.com/TaoDeepX/HermesManager/issues/new")}
        >
          在 GitHub 反馈
        </button>
      </div>
    </div>
  );
}

function LinkCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      className="card p-4 text-left hover:border-brand transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
          {icon}
        </div>
        <div className="font-medium text-sm">{title}</div>
      </div>
      <div className="mt-2 text-xs text-text-muted">{desc}</div>
    </button>
  );
}
