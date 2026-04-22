import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Copy, Loader2, Play, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/cn";

type LogLevel = "info" | "stdout" | "stderr" | "ok" | "warn" | "err";

interface LogEvent {
  job_id: string;
  step: string;
  level: LogLevel;
  line: string;
}

interface ProgressEvent {
  job_id: string;
  step: string;
  percent: number;
  message: string;
}

interface InstallResult {
  job_id: string;
  ok: boolean;
  message: string;
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: "text-info",
  stdout: "text-text",
  stderr: "text-warn",
  ok: "text-success",
  warn: "text-warn",
  err: "text-error",
};

export default function Install({
  useCN,
  envKv,
  hermesProvider,
  hermesBaseUrl,
  hermesModel,
  onDone,
}: {
  useCN: boolean;
  envKv: [string, string][];
  hermesProvider?: string;
  hermesBaseUrl?: string;
  hermesModel?: string;
  onDone: () => void;
}) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [percent, setPercent] = useState(0);
  const [stepLabel, setStepLabel] = useState("准备开始");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<InstallResult | null>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    (async () => {
      unlisteners.push(
        await listen<LogEvent>("install-log", (e) => {
          setLogs((prev) => [...prev, e.payload]);
        }),
      );
      unlisteners.push(
        await listen<ProgressEvent>("install-progress", (e) => {
          setPercent(e.payload.percent);
          setStepLabel(e.payload.message);
        }),
      );
    })();
    return () => unlisteners.forEach((u) => u());
  }, []);

  useEffect(() => {
    logBoxRef.current?.scrollTo({ top: logBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const start = async () => {
    setRunning(true);
    setResult(null);
    setLogs([]);
    setPercent(0);
    try {
      const r = await invoke<InstallResult>("start_install", {
        opts: {
          use_cn: useCN,
          env_kv: envKv,
          hermes_provider: hermesProvider ?? null,
          hermes_base_url: hermesBaseUrl ?? null,
          hermes_model: hermesModel ?? null,
        },
      });
      setResult(r);
    } catch (e) {
      setResult({ job_id: "", ok: false, message: String(e) });
    } finally {
      setRunning(false);
    }
  };

  const copyLogs = async () => {
    const text = logs.map((l) => `[${l.step}] ${l.line}`).join("\n");
    await navigator.clipboard.writeText(text);
  };

  const logView = useMemo(
    () =>
      logs.map((l, i) => (
        <div key={i} className="animate-slide-up flex gap-2 font-mono text-xs leading-relaxed">
          <span className="text-text-faint shrink-0 w-16 truncate">[{l.step}]</span>
          <span className={cn("whitespace-pre-wrap break-all", LEVEL_COLOR[l.level])}>{l.line}</span>
        </div>
      )),
    [logs],
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">一键安装</h2>
          <p className="mt-1 text-sm text-text-muted">
            {useCN ? "已启用国内加速镜像" : "未启用镜像（直连国际源）"} · 过程全程在本机执行
          </p>
        </div>
        <button className="btn-ghost text-xs" onClick={copyLogs} disabled={logs.length === 0}>
          <Copy size={14} /> 复制日志
        </button>
      </header>

      <div className="mt-5 card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{stepLabel}</span>
          <span className="text-text-muted">{percent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-bg-muted overflow-hidden">
          <div
            className="h-full bg-brand transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div
        ref={logBoxRef}
        className="mt-4 card p-4 flex-1 min-h-[260px] max-h-[380px] overflow-auto space-y-1"
      >
        {logs.length === 0 && (
          <div className="text-sm text-text-faint flex items-center gap-2">
            <Play size={14} /> 点击下方按钮开始安装
          </div>
        )}
        {logView}
      </div>

      <footer className="mt-5 flex items-center justify-between gap-3">
        {!running && !result && (
          <button className="btn-primary h-11 px-6 text-sm" onClick={start}>
            <Play size={16} /> 开始安装
          </button>
        )}
        {running && (
          <button className="btn-primary h-11 px-6 text-sm" disabled>
            <Loader2 className="animate-spin" size={16} /> 安装中…
          </button>
        )}
        {result && result.ok && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2 size={18} /> 安装成功：{result.message}
          </div>
        )}
        {result && !result.ok && (
          <div className="flex items-center gap-2 text-error text-sm">
            <AlertTriangle size={18} /> 安装失败：{result.message}
          </div>
        )}
        {result && result.ok && (
          <button className="btn-primary h-11 px-6 text-sm" onClick={onDone}>
            下一步 <ArrowRight size={16} />
          </button>
        )}
      </footer>
    </div>
  );
}
