import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  RefreshCw,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { detectEnvironment, type Check, type Report, type Level } from "../lib/tauri";
import { cn } from "../lib/cn";

const LEVEL_META: Record<Level, { icon: React.ElementType; color: string; bg: string }> = {
  ok: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  warn: { icon: AlertTriangle, color: "text-warn", bg: "bg-warn/10" },
  err: { icon: XCircle, color: "text-error", bg: "bg-error/10" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10" },
};

export default function Doctor({ onNext }: { onNext: () => void }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await detectEnvironment();
      setReport(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scan();
  }, []);

  const summary = report ? summarize(report.checks) : null;
  // 只有"不可自动修复的错误"才阻止进入下一步
  const blockingErrors = report?.checks.filter(c => c.level === "err" && !c.auto_fixable).length ?? 0;
  const canProceed = summary ? blockingErrors === 0 : false;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">环境体检</h2>
          <p className="mt-1 text-sm text-text-muted">
            正在检测你的系统能否运行 HermesAgent。整个过程都在本机进行，不会上传任何数据。
          </p>
        </div>
        <button
          className="btn-outline text-sm"
          onClick={scan}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          重新检测
        </button>
      </header>

      {report && summary && (
        <div className="mt-6 grid grid-cols-4 gap-3">
          <StatCard label="通过" value={summary.ok} tone="ok" />
          <StatCard label="提示" value={summary.info} tone="info" />
          <StatCard label="警告" value={summary.warn} tone="warn" />
          <StatCard label="错误" value={summary.err} tone="err" />
        </div>
      )}

      <div className="mt-6 space-y-2">
        {loading && (
          <div className="card p-6 flex items-center gap-3 text-sm text-text-muted">
            <Loader2 className="animate-spin text-brand" size={18} />
            正在检测系统环境…
          </div>
        )}
        {error && (
          <div className="card p-6 text-sm text-error">
            检测失败：{error}
          </div>
        )}
        {report?.checks.map((c) => (
          <CheckRow key={c.id} check={c} />
        ))}
      </div>

      {report && (
        <footer className="mt-8 flex items-center justify-between">
          <div className="text-xs text-text-faint">
            {report.os} · {report.os_version} · {report.arch} · 耗时 {report.ms_elapsed} ms
          </div>
          <button
            className="btn-primary h-11 px-6 text-sm"
            onClick={onNext}
            disabled={!canProceed}
            title={canProceed ? (summary?.err ? "可自动修复的问题将在安装阶段处理" : "") : "请先修复上方不可自动修复的错误项"}
          >
            下一步：选择模型 <ArrowRight size={16} />
          </button>
        </footer>
      )}
    </div>
  );
}

function summarize(checks: Check[]) {
  const s = { ok: 0, warn: 0, err: 0, info: 0 };
  for (const c of checks) s[c.level]++;
  return s;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Level;
}) {
  const m = LEVEL_META[tone];
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", m.bg, m.color)}>
        <m.icon size={18} />
      </div>
      <div>
        <div className="text-xs text-text-muted">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: Check }) {
  const m = LEVEL_META[check.level];
  return (
    <div className="card p-4 flex items-start gap-4 animate-slide-up">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", m.bg, m.color)}>
        <m.icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm">{check.label}</div>
          <span className="text-xs text-text-faint truncate">{check.value}</span>
        </div>
        {check.hint && (
          <div className="mt-1 text-xs text-text-muted leading-relaxed">{check.hint}</div>
        )}
      </div>
      {check.auto_fixable && (
        <button className="btn-outline h-8 px-3 text-xs shrink-0" title="在下一步安装阶段会自动修复">
          <Wrench size={12} /> 可自动修复
        </button>
      )}
    </div>
  );
}
