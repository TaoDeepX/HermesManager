// Hermes Agent 支持的 LLM 提供商注册表
// 来源：https://hermes-agent.nousresearch.com/docs/integrations/providers/

export type ProviderGroup = "cn" | "intl" | "custom";

export interface Provider {
  id: string;
  name: string;
  group: ProviderGroup;
  tagline: string;
  apiKeyUrl?: string;
  baseUrl?: string;
  envKey?: string;
  defaultModel?: string;
  /** 典型可用模型建议 */
  suggestedModels?: string[];
  /** 是否通常需要科学上网 */
  needsProxy?: boolean;
  /** 是否无需 API Key */
  noKey?: boolean;
}

export const PROVIDERS: Provider[] = [
  // ---------- 国内组 ----------
  {
    id: "dashscope",
    name: "阿里百炼 DashScope",
    group: "cn",
    tagline: "Qwen 系列 · 注册送额度 · Coding Plan 便宜",
    apiKeyUrl: "https://bailian.console.aliyun.com/?apiKey=1",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    envKey: "DASHSCOPE_API_KEY",
    defaultModel: "qwen3-coder-plus",
    suggestedModels: ["qwen3-coder-plus", "qwen-max", "qwen-plus", "qwen-turbo"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    group: "cn",
    tagline: "性价比极高 · 国内直连",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    baseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
    suggestedModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "kimi-cn",
    name: "Kimi / Moonshot",
    group: "cn",
    tagline: "长上下文 · 国内直连",
    apiKeyUrl: "https://platform.moonshot.cn/console/api-keys",
    baseUrl: "https://api.moonshot.cn/v1",
    envKey: "MOONSHOT_API_KEY",
    defaultModel: "kimi-k2-0905-preview",
    suggestedModels: ["kimi-k2-0905-preview", "moonshot-v1-128k", "moonshot-v1-32k"],
  },
  {
    id: "minimax-cn",
    name: "MiniMax",
    group: "cn",
    tagline: "国内节点 · 多模态能力",
    apiKeyUrl:
      "https://platform.minimaxi.com/user-center/basic-information/interface-key",
    baseUrl: "https://api.minimaxi.chat/v1",
    envKey: "MINIMAX_API_KEY",
    defaultModel: "MiniMax-M1",
  },
  {
    id: "zai",
    name: "智谱 z.ai / GLM",
    group: "cn",
    tagline: "GLM-4.6 等旗舰模型",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    envKey: "ZAI_API_KEY",
    defaultModel: "glm-4-plus",
    suggestedModels: ["glm-4-plus", "glm-4.6"],
  },
  {
    id: "xiaomi",
    name: "小米 Xiaomi MiMo",
    group: "cn",
    tagline: "MiMo-V2 · 百万上下文 / 全模态",
    apiKeyUrl: "https://api.mimo.xiaomi.com",
    envKey: "XIAOMI_API_KEY",
  },
  {
    id: "ollama",
    name: "本地 Ollama",
    group: "cn",
    tagline: "零费用 · 完全离线 · 自动探测本机 11434",
    baseUrl: "http://localhost:11434/v1",
    noKey: true,
    defaultModel: "qwen2.5-coder:7b",
  },

  // ---------- 国际组 ----------
  {
    id: "nous",
    name: "Nous Portal",
    group: "intl",
    tagline: "Hermes 官方订阅 · 零配置",
    apiKeyUrl: "https://portal.nousresearch.com",
    envKey: "NOUS_API_KEY",
    needsProxy: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    group: "intl",
    tagline: "聚合 200+ 模型",
    apiKeyUrl: "https://openrouter.ai/keys",
    baseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    needsProxy: true,
    defaultModel: "anthropic/claude-3.7-sonnet",
  },
  {
    id: "openai",
    name: "OpenAI",
    group: "intl",
    tagline: "GPT-4o / o1 / o3",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    baseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    needsProxy: true,
    defaultModel: "gpt-4o",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    group: "intl",
    tagline: "Claude 3.5 / 3.7 / 4",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    envKey: "ANTHROPIC_API_KEY",
    needsProxy: true,
    defaultModel: "claude-3-7-sonnet-latest",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    group: "intl",
    tagline: "Gemini 2.x Pro/Flash",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    envKey: "GEMINI_API_KEY",
    needsProxy: true,
    defaultModel: "gemini-2.5-pro",
  },
  {
    id: "xai",
    name: "xAI Grok",
    group: "intl",
    tagline: "Grok 系列",
    apiKeyUrl: "https://console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    envKey: "XAI_API_KEY",
    needsProxy: true,
    defaultModel: "grok-4",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    group: "intl",
    tagline: "Nemotron 系列",
    apiKeyUrl: "https://build.nvidia.com",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    envKey: "NVIDIA_API_KEY",
    needsProxy: true,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    group: "intl",
    tagline: "20+ 路由模型 · 统一 OpenAI 兼容",
    apiKeyUrl: "https://huggingface.co/settings/tokens",
    baseUrl: "https://router.huggingface.co/v1",
    envKey: "HF_TOKEN",
    needsProxy: true,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    group: "intl",
    tagline: "OAuth 授权 · 订阅用户可用",
    apiKeyUrl: "https://github.com/settings/copilot",
    needsProxy: true,
  },

  // ---------- 自定义 ----------
  {
    id: "custom",
    name: "自定义 OpenAI 兼容端点",
    group: "custom",
    tagline: "自建 vLLM / 第三方中转 / 局域网",
    envKey: "CUSTOM_API_KEY",
  },
];

export const PROVIDER_GROUPS: { id: ProviderGroup; label: string; desc: string }[] = [
  { id: "cn", label: "国内直连", desc: "推荐给小白 · 无需科学上网" },
  { id: "intl", label: "国际服务", desc: "通常需要代理 · 会自动检测连通性" },
  { id: "custom", label: "自定义", desc: "任意 OpenAI 兼容端点" },
];
