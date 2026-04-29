import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  RefreshCw,
  ArrowRight,
  Wrench,
  RotateCw,
} from "lucide-react";
import { detectEnvironment, fixCheck, type Check, type FixResult, type Report, type Level } from "../lib/tauri";
import { cn } from "../lib/cn";

const LEVEL_META: Record<Level, { icon: React.ElementType; color: string; bg: string }> = {
  ok: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  warn: { icon: AlertTriangle, color: "text-warn", bg: "bg-warn/10" },
  err: { icon: XCircle, color: "text-error", bg: "bg-error/10" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10" },
};

export default function Doctor({
  onNext,
  onSkipToDone,
}: {
  onNext: () => void;
  onSkipToDone?: () => void;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<Record<string, FixResult>>({});

  const scan = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  const handleFix = useCallback(async (checkId: string) => {
    setFixingId(checkId);
    setFixResults((prev) => {
      const next = { ...prev };
      delete next[checkId];
      return next;
    });
    try {
      const result = await fixCheck({ check_id: checkId, use_cn: true });
      setFixResults((prev) => ({ ...prev, [checkId]: result }));
      // 修复成功后自动重新扫描
      if (result.ok && !result.needs_reboot) {
        setTimeout(() => scan(), 800);
      }
    } catch (e) {
      setFixResults((prev) => ({
        ...prev,
        [checkId]: { ok: false, message: String(e), needs_reboot: false },
      }));
    } finally {
      setFixingId(null);
    }
  }, [scan]);

  const summary = report ? summarize(report.checks) : null;
  // 只有"不可自动修复的错误"才阻止进入下一步
  const blockingErrors = report?.checks.filter(c => c.level === "err" && !c.auto_fixable).length ?? 0;
  const canProceed = summary ? blockingErrors === 0 : false;
  // 检测 hermes 是否已安装（含 WSL 路径）
  const hermesCheck = report?.checks.find(c => c.id === "hermes");
  const hermesInstalled = hermesCheck && hermesCheck.value !== "未安装";

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
          disabled={loading || fixingId !== null}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          重新检测
        </button>
      </header>

      {report && hermesInstalled && onSkipToDone && (
        <div className="mt-5 card p-4 border-success/40 bg-success/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">检测到 HermesAgent 已安装</div>
            <div className="text-xs text-text-muted mt-0.5">{hermesCheck?.value} · 可跳过安装直接启动 hermes</div>
          </div>
          <button
            className="btn-primary h-9 px-4 text-xs shrink-0"
            onClick={onSkipToDone}
          >
            直接启动 <ArrowRight size={14} />
          </button>
        </div>
      )}

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
          <CheckRow
            key={c.id}
            check={c}
            fixing={fixingId === c.id}
            fixResult={fixResults[c.id]}
            onFix={() => handleFix(c.id)}
            disabled={fixingId !== null}
          />
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

function CheckRow({
  check,
  fixing,
  fixResult,
  onFix,
  disabled,
}: {
  check: Check;
  fixing: boolean;
  fixResult?: FixResult;
  onFix: () => void;
  disabled: boolean;
}) {
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
        {fixResult && (
          <div className={cn("mt-2 text-xs leading-relaxed px-3 py-2 rounded-lg",
            fixResult.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"
          )}>
            {fixResult.ok ? "✅ " : "❌ "}{fixResult.message}
            {fixResult.needs_reboot && (
              <div className="mt-1 font-medium text-warn">⚠ 请重启电脑后再继续操作。</div>
            )}
          </div>
        )}
      </div>
      {check.auto_fixable && (
        <button
          className={cn(
            "h-8 px-3 text-xs shrink-0 flex items-center gap-1.5 rounded-lg border transition-colors",
            fixing
              ? "border-brand/30 text-brand bg-brand/5 cursor-wait"
              : fixResult?.ok
                ? "border-success/30 text-success bg-success/5"
                : "border-border-subtle text-text hover:bg-bg-muted hover:border-brand/40 hover:text-brand cursor-pointer"
          )}
          onClick={onFix}
          disabled={disabled || fixing || (fixResult?.ok ?? false)}
          title={fixing ? "正在修复…" : fixResult?.ok ? "已修复" : "点击执行自动修复"}
        >
          {fixing ? (
            <><Loader2 className="animate-spin" size={12} /> 修复中…</>
          ) : fixResult?.ok ? (
            <><CheckCircle2 size={12} /> 已修复</>
          ) : fixResult && !fixResult.ok ? (
            <><RotateCw size={12} /> 重试修复</>
          ) : (
            <><Wrench size={12} /> 一键修复</>
          )}
        </button>
      )}
    </div>
  );
}
