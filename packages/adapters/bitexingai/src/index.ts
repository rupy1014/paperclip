export const type = "bitexingai";
export const label = "BitexingAI";

export const models: { id: string; label: string }[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "deepseek-chat", label: "DeepSeek Chat" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
  { id: "qwen-max", label: "Qwen Max" },
];

export const agentConfigurationDoc = `# bitexingai agent configuration

Adapter: bitexingai

Use when:
- You want Paperclip to call bitexingai.com through its OpenAI-compatible HTTP API
- You want one-shot wake execution over REST without local CLI dependencies
- You need a single configured model per agent

Don't use when:
- You need streaming tokens or partial event output
- You need WebSocket transport
- You need Claude-native or Gemini-native request formats

Required fields:
- baseUrl (string): BitexingAI OpenAI-compatible API base URL
- apiKey (string): bearer token used for /models and /chat/completions
- model (string): model id to send in the OpenAI-compatible request

Optional fields:
- timeoutSec (number): request timeout in seconds (default 120)
- maxOutputTokens (number): sent as max_tokens
- temperature (number): sent as temperature
- extraHeaders (object): additional HTTP headers merged into the request
- allowInsecureHttp (boolean): allow http:// base URLs for local or trusted testing

Request behavior:
- Paperclip renders the current wake payload with \`renderPaperclipWakePrompt(...)\`
- The adapter sends a single POST to \`{baseUrl}/chat/completions\`
- The response summary is taken from \`choices[0].message.content\`
- Usage is read from \`usage.prompt_tokens\` and \`usage.completion_tokens\`
`;
