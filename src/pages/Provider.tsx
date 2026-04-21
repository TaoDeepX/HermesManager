import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Key,
  Loader2,
  Search,
  Server,
  XCircle,
  ArrowLeft,
  Info,
} from "lucide-react";
import { PROVIDERS, PROVIDER_GROUPS, type Provider, type ProviderGroup } from "../lib/providers";
import { testProvider, listModels, openExternal, type TestResponse } from "../lib/tauri";
import { cn } from "../lib/cn";

export interface ProviderSelection {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export default function ProviderPage({
  onSkip,
  onConfirm,
}: {
  onSkip: () => void;
  onConfirm: (sel: ProviderSelection) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<ProviderGroup>("cn");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Provider | null>(PROVIDERS[0]);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(PROVIDERS[0].baseUrl ?? "");
  const [model, setModel] = useState(PROVIDERS[0].defaultModel ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVIDERS.filter((p) => p.group === activeGroup).filter((p) =>
      q ? (p.name + p.tagline).toLowerCase().includes(q) : true,
    );
  }, [activeGroup, query]);

  const choose = (p: Provider) => {
    setSelected(p);
    setApiKey("");
    setBaseUrl(p.baseUrl ?? "");
    setModel(p.defaultModel ?? "");
    setTestResult(null);
    setModels([]);
    setModelsError(null);
  };

  // 自动获取模型列表
  const fetchModels = async () => {
    if (!selected || !baseUrl) return;
    // 云端 Provider 需要 API Key（除非是 noKey）
    if (!selected.noKey && !apiKey) return;
    
    setLoadingModels(true);
    setModelsError(null);
    try {
      const isOllama = selected.id === "ollama";
      const res = await listModels({
        base_url: isOllama ? baseUrl.replace("/v1", "") : baseUrl,
        api_key: selected.noKey ? undefined : apiKey,
        is_ollama: isOllama,
      });
      if (res.ok) {
        setModels(res.models);
        // 如果当前没有选中模型，自动选择第一个
        if (res.models.length > 0 && !model) {
          setModel(res.models[0]);
        }
      } else {
        setModelsError(res.error ?? "获取失败");
      }
    } catch (e) {
      setModelsError(String(e));
    } finally {
      setLoadingModels(false);
    }
  };

  // 当 Provider、API Key、Base URL 变化时自动获取模型列表
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModels();
    }, 500); // 防抖
    return () => clearTimeout(timer);
  }, [selected?.id, apiKey, baseUrl]);

  const canTest = selected && (selected.noKey || apiKey.length > 0) && baseUrl && model;

  const runTest = async () => {
    if (!selected) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testProvider({
        base_url: baseUrl,
        api_key: selected.noKey ? undefined : apiKey,
        model,
      });
      setTestResult(res);
    } catch (e) {
      setTestResult({
        ok: false,
        status: 0,
        latency_ms: 0,
        body_preview: "",
        error: String(e),
      });
    } finally {
      setTesting(false);
    }
  };

  const confirm = () => {
    if (!selected) return;
    onConfirm({ provider: selected, apiKey, baseUrl, model });
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold">选择大模型</h2>
        <p className="mt-1 text-sm text-text-muted">
          HermesAgent 是模型无关的 —— 你可以自由挑选任意 OpenAI 兼容提供商。国内用户推荐从「国内直连」组开始。
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-bg-muted rounded-lg">
          {PROVIDER_GROUPS.map((g) => (
            <button
              key={g.id}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-medium transition-colors",
                activeGroup === g.id
                  ? "bg-brand text-black"
                  : "text-text-muted hover:text-text",
              )}
              onClick={() => setActiveGroup(g.id)}
              title={g.desc}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            className="input pl-9"
            placeholder="搜索提供商…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 grid grid-cols-2 gap-3 max-h-[360px] overflow-auto pr-1">
          {filtered.map((p) => (
            <ProviderCard
              key={p.id}
              p={p}
              active={selected?.id === p.id}
              onClick={() => choose(p)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-sm text-text-muted">未找到匹配的提供商</div>
          )}
        </div>

        <div className="col-span-5">
          {selected ? (
            <div className="card p-5 space-y-4">
              <div>
                <div className="text-xs text-text-muted">当前选中</div>
                <div className="mt-0.5 font-semibold">{selected.name}</div>
                <div className="mt-1 text-xs text-text-muted">{selected.tagline}</div>
                {selected.apiKeyUrl && (
                  <button
                    className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:underline"
                    onClick={() => openExternal(selected.apiKeyUrl!)}
                  >
                    获取 API Key <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {!selected.noKey && (
                <Field label="API Key" icon={<Key size={14} />}>
                  <input
                    type="password"
                    className="input"
                    placeholder="粘贴你的 API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </Field>
              )}
              <Field label="Base URL" icon={<Server size={14} />}>
                <input
                  className="input font-mono text-xs"
                  placeholder="https://..."
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </Field>
              <Field label="模型名">
                {loadingModels ? (
                  <div className="input flex items-center gap-2 text-text-muted text-xs">
                    <Loader2 className="animate-spin" size={12} />
                    正在获取模型列表…
                  </div>
                ) : models.length > 0 ? (
                  <select
                    className="input font-mono text-xs"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input font-mono text-xs"
                    placeholder="e.g. gpt-4o"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                )}
                {modelsError && (
                  <div className="mt-1 text-xs text-warn">{modelsError}</div>
                )}
                {!loadingModels && models.length === 0 && selected.suggestedModels && selected.suggestedModels.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selected.suggestedModels.map((m) => (
                      <button
                        key={m}
                        className={cn("chip hover:border-brand hover:text-brand", model === m && "border-brand text-brand")}
                        onClick={() => setModel(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <div className="flex items-center gap-2">
                <button
                  className="btn-outline text-xs flex-1"
                  disabled={!canTest || testing}
                  onClick={runTest}
                >
                  {testing ? <Loader2 className="animate-spin" size={14} /> : <Info size={14} />}
                  测试连接
                </button>
              </div>
              {testResult && <TestBadge r={testResult} />}
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-text-muted">
              请在左侧选择一个提供商
            </div>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between mt-2">
        <button className="btn-ghost text-sm">
          <ArrowLeft size={14} /> 返回体检
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={onSkip}>
            跳过（稍后配置）
          </button>
          <button className="btn-primary h-11 px-6 text-sm" onClick={confirm} disabled={!selected}>
            下一步：开始安装 <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1.5">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ProviderCard({
  p,
  active,
  onClick,
}: {
  p: Provider;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "text-left p-3.5 rounded-lg border transition-colors",
        active
          ? "border-brand bg-brand-soft"
          : "border-border-subtle bg-bg-elevated hover:border-border-strong",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm truncate">{p.name}</div>
        {p.needsProxy && <span className="chip shrink-0 text-text-faint">需代理</span>}
        {p.noKey && <span className="chip shrink-0 text-success border-success/40">免 Key</span>}
      </div>
      <div className="mt-1 text-xs text-text-muted line-clamp-2 leading-relaxed">{p.tagline}</div>
    </button>
  );
}

function TestBadge({ r }: { r: TestResponse }) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-xs",
        r.ok ? "bg-success/10 text-success" : "bg-error/10 text-error",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {r.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        {r.ok
          ? `连接成功 · HTTP ${r.status} · ${r.latency_ms} ms`
          : `失败：${r.error ?? `HTTP ${r.status}`}`}
      </div>
      {!r.ok && r.body_preview && (
        <pre className="mt-2 text-[11px] whitespace-pre-wrap break-all opacity-80 font-mono max-h-24 overflow-auto">
          {r.body_preview}
        </pre>
      )}
    </div>
  );
}
