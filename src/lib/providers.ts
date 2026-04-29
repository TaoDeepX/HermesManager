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
  /** hermes config.yaml 中的 provider 名（如 "alibaba"、"deepseek"） */
  hermesProvider?: string;
  /** OAuth 类 provider，用 hermes auth 流程而不是填 API Key */
  oauth?: boolean;
  /** 同 provider 的备用环境变量名（按顺序写入 .env） */
  envKeyAliases?: string[];
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
    hermesProvider: "alibaba",
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
    hermesProvider: "deepseek",
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
    envKey: "KIMI_CN_API_KEY",
    hermesProvider: "kimi-coding-cn",
    defaultModel: "kimi-k2.5",
    suggestedModels: ["kimi-k2.5", "kimi-k2-0905-preview", "moonshot-v1-128k"],
  },
  {
    id: "minimax-cn",
    name: "MiniMax",
    group: "cn",
    tagline: "国内节点 · 多模态能力",
    apiKeyUrl:
      "https://platform.minimaxi.com/user-center/basic-information/interface-key",
    baseUrl: "https://api.minimaxi.chat/v1",
    envKey: "MINIMAX_CN_API_KEY",
    hermesProvider: "minimax-cn",
    defaultModel: "MiniMax-M2.7",
    suggestedModels: ["MiniMax-M2.7", "MiniMax-M1"],
  },
  {
    id: "zai",
    name: "智谱 z.ai / GLM",
    group: "cn",
    tagline: "GLM-4.6 等旗舰模型",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    envKey: "GLM_API_KEY",
    hermesProvider: "zai",
    defaultModel: "glm-5",
    suggestedModels: ["glm-5", "glm-4.6", "glm-4-plus"],
  },
  {
    id: "xiaomi",
    name: "小米 Xiaomi MiMo",
    group: "cn",
    tagline: "MiMo-V2 · 百万上下文 / 全模态",
    apiKeyUrl: "https://api.mimo.xiaomi.com",
    envKey: "XIAOMI_API_KEY",
    hermesProvider: "xiaomi",
    defaultModel: "mimo-v2-pro",
  },
  {
    id: "tencent",
    name: "腾讯混元 TokenHub",
    group: "cn",
    tagline: "Hy3 Preview · 国内直连",
    apiKeyUrl: "https://tokenhub.cloud.tencent.com",
    envKey: "TOKENHUB_API_KEY",
    hermesProvider: "tencent-tokenhub",
    defaultModel: "hy3-preview",
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
    tagline: "Hermes 官方订阅 · OAuth 登录",
    apiKeyUrl: "https://portal.nousresearch.com",
    hermesProvider: "nous",
    oauth: true,
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
    hermesProvider: "openrouter",
    needsProxy: true,
    defaultModel: "anthropic/claude-sonnet-4.6",
    suggestedModels: ["anthropic/claude-sonnet-4.6", "anthropic/claude-opus-4.6", "openai/gpt-5", "google/gemini-2.5-pro"],
  },
  {
    id: "anthropic-oauth",
    name: "Anthropic OAuth (Claude)",
    group: "intl",
    tagline: "Claude Pro/Max 订阅用户 · 无需 API Key",
    apiKeyUrl: "https://claude.ai",
    hermesProvider: "anthropic",
    oauth: true,
    needsProxy: true,
  },
  {
    id: "anthropic",
    name: "Anthropic API Key",
    group: "intl",
    tagline: "Claude 4 / 4.6 系列",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    envKey: "ANTHROPIC_API_KEY",
    hermesProvider: "anthropic",
    needsProxy: true,
    defaultModel: "claude-opus-4.6",
    suggestedModels: ["claude-opus-4.6", "claude-sonnet-4.6", "claude-haiku-4.6"],
  },
  {
    id: "copilot",
    name: "GitHub Copilot OAuth",
    group: "intl",
    tagline: "GitHub 订阅用户 · OAuth",
    apiKeyUrl: "https://github.com/settings/copilot",
    hermesProvider: "copilot",
    oauth: true,
    needsProxy: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    group: "intl",
    tagline: "Gemini 3 Pro/Flash",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    envKey: "GEMINI_API_KEY",
    envKeyAliases: ["GOOGLE_API_KEY"],
    hermesProvider: "gemini",
    needsProxy: true,
    defaultModel: "gemini-3-pro",
    suggestedModels: ["gemini-3-pro", "gemini-2.5-pro", "gemini-2.5-flash"],
  },
  {
    id: "xai",
    name: "xAI Grok",
    group: "intl",
    tagline: "Grok 4 · Responses API + Prompt Caching",
    apiKeyUrl: "https://console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    envKey: "XAI_API_KEY",
    hermesProvider: "xai",
    needsProxy: true,
    defaultModel: "grok-4",
  },
  {
    id: "deepseek-intl",
    name: "DeepSeek (国际)",
    group: "intl",
    tagline: "性价比极高 · 同 deepseek API",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    envKey: "DEEPSEEK_API_KEY",
    hermesProvider: "deepseek",
    defaultModel: "deepseek-chat",
    needsProxy: false,
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    group: "intl",
    tagline: "Nemotron 系列",
    apiKeyUrl: "https://build.nvidia.com",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    envKey: "NVIDIA_API_KEY",
    hermesProvider: "nvidia",
    needsProxy: true,
  },
  {
    id: "ai-gateway",
    name: "Vercel AI Gateway",
    group: "intl",
    tagline: "统一聚合 · OpenAI 兼容",
    apiKeyUrl: "https://vercel.com/dashboard/ai-gateway",
    envKey: "AI_GATEWAY_API_KEY",
    hermesProvider: "ai-gateway",
    needsProxy: true,
  },
  {
    id: "bedrock",
    name: "AWS Bedrock",
    group: "intl",
    tagline: "Claude / Llama / Mistral on AWS",
    apiKeyUrl: "https://aws.amazon.com/bedrock/",
    hermesProvider: "bedrock",
    needsProxy: true,
  },
  {
    id: "azure-foundry",
    name: "Azure AI Foundry",
    group: "intl",
    tagline: "Azure 部署 · GPT/Claude/Llama",
    apiKeyUrl: "https://ai.azure.com/",
    hermesProvider: "azure-foundry",
    needsProxy: true,
  },
  {
    id: "ollama-cloud",
    name: "Ollama Cloud",
    group: "intl",
    tagline: "托管 Ollama 模型 · OAuth",
    apiKeyUrl: "https://ollama.com",
    hermesProvider: "ollama-cloud",
    oauth: true,
    needsProxy: true,
  },
  {
    id: "arcee",
    name: "Arcee AI",
    group: "intl",
    tagline: "Trinity 系列推理",
    apiKeyUrl: "https://www.arcee.ai",
    envKey: "ARCEEAI_API_KEY",
    hermesProvider: "arcee",
    defaultModel: "trinity-large-thinking",
    needsProxy: true,
  },
  {
    id: "gmi",
    name: "GMI Cloud",
    group: "intl",
    tagline: "开源模型托管 · GLM-5.1 等",
    apiKeyUrl: "https://www.gmicloud.ai",
    envKey: "GMI_API_KEY",
    hermesProvider: "gmi",
    defaultModel: "zai-org/GLM-5.1-FP8",
    needsProxy: true,
  },
  {
    id: "kilocode",
    name: "Kilocode",
    group: "intl",
    tagline: "专为 Coding 优化",
    apiKeyUrl: "https://kilocode.ai",
    envKey: "KILOCODE_API_KEY",
    hermesProvider: "kilocode",
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
