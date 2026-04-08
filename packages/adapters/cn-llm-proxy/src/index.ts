export const type = "cn_llm_proxy";
export const label = "CN LLM Proxy";

export const models: { id: string; label: string }[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "deepseek-chat", label: "DeepSeek Chat" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
  { id: "qwen-max", label: "Qwen Max" },
];

export const agentConfigurationDoc = `# cn_llm_proxy agent configuration

Adapter: cn_llm_proxy

Use when:
- You want Paperclip to call Chinese reseller LLM proxies such as 12ai or similar OpenAI-compatible HTTP APIs
- You want one-shot wake execution over REST without local CLI dependencies
- You need a single configured model per agent

Don't use when:
- You need streaming tokens or partial event output
- You need WebSocket transport
- You need Claude-native or Gemini-native request formats

Required fields:
- baseUrl (string): OpenAI-compatible API base URL
- apiKey (string): bearer token used for /models and /chat/completions
- model (string): model id to send in the OpenAI-compatible request

Optional fields:
- vendor (string): vendor identifier used for billing labels, for example "12ai" (preferred) or "bitexingai" (deprecated alternative)
- usageEndpoint (string): optional usage API endpoint, for example "https://new.12ai.org/api/usage/token/"
- timeoutSec (number): request timeout in seconds (default 120)
- maxOutputTokens (number): sent as max_tokens
- temperature (number): sent as temperature
- extraHeaders (object): additional HTTP headers merged into the request
- allowInsecureHttp (boolean): allow http:// base URLs for local or trusted testing

Environment variable fallbacks (used when adapterConfig fields are empty):
- CN_LLM_PROXY_BASE_URL or LLM_12AI_BASE_URL (default: https://new.12ai.org/v1)
- CN_LLM_PROXY_API_KEY or LLM_12AI_API_KEY
- CN_LLM_PROXY_MODEL or LLM_12AI_MODEL (default: gemini-2.5-flash)

Verified 12ai example values:
- baseUrl: "https://new.12ai.org/v1"
- vendor: "12ai"
- usageEndpoint: "https://new.12ai.org/api/usage/token/"

Request behavior:
- Paperclip renders the current wake payload with \`renderPaperclipWakePrompt(...)\`
- The adapter sends a single POST to \`{baseUrl}/chat/completions\`
- The response summary is taken from \`choices[0].message.content\`
- Usage is read from \`usage.prompt_tokens\` and \`usage.completion_tokens\`
`;
