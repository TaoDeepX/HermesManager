import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Boxes, Rocket, ArrowRight } from "lucide-react";
import { cn } from "./lib/cn";
import Doctor from "./pages/Doctor";
import Install from "./pages/Install";
import ProviderPage, { type ProviderSelection } from "./pages/Provider";
import Done from "./pages/Done";

type Step = "welcome" | "doctor" | "provider" | "install" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "doctor", label: "环境体检" },
  { id: "provider", label: "选择模型" },
  { id: "install", label: "一键安装" },
  { id: "done", label: "完成" },
];

export default function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [selection, setSelection] = useState<ProviderSelection | null>(null);

  const envKv: [string, string][] = selection
    ? buildEnvKv(selection)
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <TitleBar />
      <main className="flex-1 flex flex-col">
        {step !== "welcome" && <StepBar current={step} />}
        <div className="flex-1 px-10 py-8 animate-fade-slide-in" key={step}>
          {step === "welcome" && <Welcome onStart={() => setStep("doctor")} />}
          {step === "doctor" && (
            <Doctor
              onNext={() => setStep("provider")}
              onSkipToDone={() => setStep("done")}
            />
          )}
          {step === "provider" && (
            <ProviderPage
              onSkip={() => setStep("install")}
              onConfirm={(sel) => {
                setSelection(sel);
                setStep("install");
              }}
            />
          )}
          {step === "install" && (
            <Install
              useCN={true}
              envKv={envKv}
              hermesProvider={selection?.provider.hermesProvider}
              hermesBaseUrl={selection?.baseUrl}
              hermesModel={selection?.model}
              onDone={() => setStep("done")}
            />
          )}
          {step === "done" && <Done onUninstalled={() => setStep("doctor")} />}
        </div>
      </main>
    </div>
  );
}

function TitleBar() {
  const [ver, setVer] = useState("");
  useEffect(() => {
    import("@tauri-apps/api/app").then((m) => m.getVersion()).then(setVer).catch(() => {});
  }, []);
  return (
    <div className="h-12 px-5 flex items-center gap-3 border-b border-border-subtle bg-bg-elevated/60 backdrop-blur select-none">
      <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-black font-bold">H</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">HermesManager</div>
        <div className="text-[11px] text-text-faint">HermesAgent 一键安装器</div>
      </div>
      {ver && <span className="chip text-text-muted">v{ver}</span>}
    </div>
  );
}

function StepBar({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="px-10 py-5 border-b border-border-subtle flex items-center gap-3">
      {STEPS.map((s, i) => {
        const active = i === currentIdx;
        const done = i < currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium transition-colors",
                active && "bg-brand text-black",
                done && "bg-brand-soft text-brand",
                !active && !done && "bg-bg-muted text-text-muted",
              )}
            >
              <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                {done ? "✓" : i + 1}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-px", i < currentIdx ? "bg-brand" : "bg-border-subtle")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center gap-2 text-brand text-sm">
        <Sparkles size={16} /> 让小白点点点就能用上 HermesAgent
      </div>
      <h1 className="mt-3 text-4xl font-bold leading-tight">
        欢迎来到 <span className="text-brand">HermesManager</span>
      </h1>
      <p className="mt-4 text-text-muted text-base leading-relaxed">
        HermesAgent 是 Nous Research 开源的自主 AI Agent 框架 —— 拥有持久记忆、自我成长、可接 40+ 种大模型。
        本工具会自动为你完成环境检测、依赖安装、模型配置，全程中文图形界面，无需命令行。
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <FeatureCard icon={<ShieldCheck size={18} />} title="全自动体检" desc="系统版本 / 虚拟化 / WSL / 网络 / 依赖全部一键检测。" />
        <FeatureCard icon={<Boxes size={18} />} title="国内加速" desc="内置清华 / npmmirror 等国内镜像，自动多级 fallback，无需科学上网。" />
        <FeatureCard icon={<Rocket size={18} />} title="一键安装" desc="Windows(WSL2) 与 macOS(Homebrew) 双平台自动适配。" />
      </div>

      <div className="mt-10 flex items-center gap-3">
        <button className="btn-primary h-11 px-6 text-sm" onClick={onStart}>
          开始体检 <ArrowRight size={16} />
        </button>
        <a
          className="btn-ghost text-sm"
          href="https://github.com/TaoDeepX/HermesManager"
          target="_blank"
          rel="noreferrer"
        >
          查看仓库
        </a>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card p-5">
      <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">{icon}</div>
      <div className="mt-3 font-semibold text-sm">{title}</div>
      <div className="mt-1 text-xs text-text-muted leading-relaxed">{desc}</div>
    </div>
  );
}

function buildEnvKv(sel: ProviderSelection): [string, string][] {
  const kv: [string, string][] = [];
  // 写 provider 专属 API Key 到 .env（主键 + 别名键，如 GEMINI_API_KEY + GOOGLE_API_KEY）
  // base_url 和 model 通过 config.yaml 配置（由 install_win.rs Step 5 处理）
  if (sel.provider.envKey && sel.apiKey) {
    kv.push([sel.provider.envKey, sel.apiKey]);
    for (const alias of sel.provider.envKeyAliases ?? []) {
      kv.push([alias, sel.apiKey]);
    }
  }
  return kv;
}
