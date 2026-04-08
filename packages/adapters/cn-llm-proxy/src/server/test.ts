import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import { asNumber, asString, parseObject } from "@paperclipai/adapter-utils/server-utils";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

function normalizeBaseUrl(value: unknown): string {
  return asString(value, "").trim().replace(/\/+$/, "");
}

function toStringHeaders(value: unknown): Record<string, string> {
  const parsed = parseObject(value);
  const headers: Record<string, string> = {};
  for (const [key, entry] of Object.entries(parsed)) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      headers[key] = entry.trim();
    }
  }
  return headers;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function buildResult(
  ctx: AdapterEnvironmentTestContext,
  checks: AdapterEnvironmentCheck[],
): AdapterEnvironmentTestResult {
  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}

function describeHttpFailure(status: number, statusText: string, bodyText: string): string {
  const excerpt = bodyText.replace(/\s+/g, " ").trim();
  if (!excerpt) return `HTTP ${status} ${statusText}`.trim();
  const clipped = excerpt.length > 280 ? `${excerpt.slice(0, 279)}...` : excerpt;
  return `HTTP ${status} ${statusText}: ${clipped}`.trim();
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const baseUrl =
    normalizeBaseUrl(config.baseUrl) ||
    (process.env.CN_LLM_PROXY_BASE_URL ?? process.env.LLM_12AI_BASE_URL ?? "").replace(/\/+$/, "");
  const apiKey =
    asString(config.apiKey, "").trim() ||
    (process.env.CN_LLM_PROXY_API_KEY ?? process.env.LLM_12AI_API_KEY ?? "").trim();
  const model =
    asString(config.model, "").trim() ||
    (process.env.CN_LLM_PROXY_MODEL ?? process.env.LLM_12AI_MODEL ?? "").trim();
  const allowInsecureHttp = readBoolean(config.allowInsecureHttp);
  const timeoutSec = Math.max(1, Math.floor(asNumber(config.timeoutSec, 20)));

  if (!baseUrl) {
    checks.push({
      code: "cn_llm_proxy_base_url_missing",
      level: "error",
      message: "CN LLM Proxy requires adapterConfig.baseUrl or CN_LLM_PROXY_BASE_URL / LLM_12AI_BASE_URL.",
      hint: "Set adapterConfig.baseUrl or an env fallback to the CN LLM Proxy OpenAI-compatible API base URL.",
    });
    return buildResult(ctx, checks);
  }

  let url: URL | null = null;
  try {
    url = new URL(baseUrl);
  } catch {
    checks.push({
      code: "cn_llm_proxy_base_url_invalid",
      level: "error",
      message: `Invalid baseUrl: ${baseUrl}`,
    });
    return buildResult(ctx, checks);
  }

  if (url.protocol === "https:") {
    checks.push({
      code: "cn_llm_proxy_base_url_https",
      level: "info",
      message: `Using HTTPS base URL: ${url.toString()}`,
    });
  } else if (url.protocol === "http:" && allowInsecureHttp) {
    checks.push({
      code: "cn_llm_proxy_base_url_http_allowed",
      level: "warn",
      message: `Using insecure HTTP base URL: ${url.toString()}`,
      hint: "Prefer HTTPS outside trusted local development.",
    });
  } else {
    checks.push({
      code: "cn_llm_proxy_base_url_protocol_invalid",
      level: "error",
      message: `Unsupported baseUrl protocol: ${url.protocol}`,
      hint: "Use https://, or set allowInsecureHttp=true for trusted http:// testing.",
    });
  }

  if (!apiKey) {
    checks.push({
      code: "cn_llm_proxy_api_key_missing",
      level: "error",
      message: "CN LLM Proxy requires adapterConfig.apiKey or CN_LLM_PROXY_API_KEY / LLM_12AI_API_KEY.",
      hint: "Set the CN LLM Proxy bearer token in adapterConfig.apiKey or an env fallback.",
    });
  } else {
    checks.push({
      code: "cn_llm_proxy_api_key_present",
      level: "info",
      message: "API key is configured.",
    });
  }

  if (!model) {
    checks.push({
      code: "cn_llm_proxy_model_missing",
      level: "error",
      message: "CN LLM Proxy requires adapterConfig.model or CN_LLM_PROXY_MODEL / LLM_12AI_MODEL.",
      hint: "Choose a model from the /models response or static seed list, then set it in config or env.",
    });
  } else {
    checks.push({
      code: "cn_llm_proxy_model_present",
      level: "info",
      message: `Configured model: ${model}`,
    });
  }

  if (checks.some((check) => check.level === "error")) {
    return buildResult(ctx, checks);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSec * 1000);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...toStringHeaders(config.extraHeaders),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      checks.push({
        code: "cn_llm_proxy_models_probe_failed",
        level: "error",
        message: "CN LLM Proxy /models probe failed.",
        detail: describeHttpFailure(response.status, response.statusText, bodyText),
        hint: "Verify baseUrl, apiKey, and upstream model access.",
      });
      return buildResult(ctx, checks);
    }

    const json = parseObject(await response.json());
    const rawModels = Array.isArray(json.data) ? json.data : [];
    const models = rawModels.filter(
      (entry: unknown): entry is Record<string, unknown> => typeof entry === "object" && entry !== null,
    );
    const discovered = models.filter(
      (entry: Record<string, unknown>) => typeof entry.id === "string" && entry.id.trim().length > 0,
    );

    checks.push({
      code: "cn_llm_proxy_models_probe_ok",
      level: "info",
      message: `CN LLM Proxy /models probe succeeded${discovered.length > 0 ? ` with ${discovered.length} model(s)` : ""}.`,
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException
        ? error.name === "AbortError"
        : error instanceof Error && error.name === "AbortError";
    checks.push({
      code: timedOut ? "cn_llm_proxy_models_probe_timeout" : "cn_llm_proxy_models_probe_error",
      level: "error",
      message: timedOut
        ? `CN LLM Proxy /models probe timed out after ${timeoutSec}s.`
        : "CN LLM Proxy /models probe failed.",
      detail: error instanceof Error ? error.message : String(error),
      hint: "Check network reachability and the configured baseUrl.",
    });
  } finally {
    clearTimeout(timeout);
  }

  return buildResult(ctx, checks);
}
