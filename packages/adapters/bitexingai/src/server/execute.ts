import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  UsageSummary,
} from "@paperclipai/adapter-utils";
import {
  asNumber,
  asString,
  parseObject,
  renderPaperclipWakePrompt,
} from "@paperclipai/adapter-utils/server-utils";

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseUsageSummary(value: unknown): UsageSummary | undefined {
  const usage = parseObject(value);
  const inputTokens = optionalNumber(usage.prompt_tokens);
  const outputTokens = optionalNumber(usage.completion_tokens);
  if (inputTokens === null || outputTokens === null) return undefined;

  const promptDetails = parseObject(usage.prompt_tokens_details);
  const cachedTokens = optionalNumber(promptDetails.cached_tokens);

  return {
    inputTokens,
    outputTokens,
    ...(cachedTokens !== null ? { cachedInputTokens: cachedTokens } : {}),
  };
}

function extractTextContent(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";

  const chunks: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      chunks.push(entry.trim());
      continue;
    }

    const part = parseObject(entry);
    const text = readNonEmptyString(part.text) ?? readNonEmptyString(part.content);
    if (text) chunks.push(text);
  }

  return chunks.join("\n\n").trim();
}

function describeHttpFailure(status: number, statusText: string, bodyText: string): string {
  const excerpt = bodyText.replace(/\s+/g, " ").trim();
  if (!excerpt) return `BitexingAI request failed with HTTP ${status} ${statusText}`.trim();
  const clipped = excerpt.length > 280 ? `${excerpt.slice(0, 279)}...` : excerpt;
  return `BitexingAI request failed with HTTP ${status} ${statusText}: ${clipped}`.trim();
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = parseObject(ctx.config);
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = asString(config.apiKey, "").trim();
  const model = asString(config.model, "").trim();
  const timeoutSec = Math.max(1, Math.floor(asNumber(config.timeoutSec, 120)));
  const timeoutMs = timeoutSec * 1000;
  const maxOutputTokens = optionalNumber(config.maxOutputTokens);
  const temperature = optionalNumber(config.temperature);
  const extraHeaders = toStringHeaders(config.extraHeaders);
  const prompt =
    renderPaperclipWakePrompt(ctx.context.paperclipWake) ||
    `You are agent ${ctx.agent.id} (${ctx.agent.name}). Continue your Paperclip work for run ${ctx.runId}.`;

  if (!baseUrl) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "BitexingAI requires adapterConfig.baseUrl.",
      provider: "bitexingai",
      model: model || null,
      billingType: "metered_api",
    };
  }

  if (!apiKey) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "BitexingAI requires adapterConfig.apiKey.",
      provider: "bitexingai",
      model: model || null,
      billingType: "metered_api",
    };
  }

  if (!model) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "BitexingAI requires adapterConfig.model.",
      provider: "bitexingai",
      model: null,
      billingType: "metered_api",
    };
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  if (maxOutputTokens !== null && maxOutputTokens > 0) {
    requestBody.max_tokens = Math.floor(maxOutputTokens);
  }
  if (temperature !== null) {
    requestBody.temperature = temperature;
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await ctx.onLog("stdout", `[paperclip] BitexingAI request: POST ${endpoint} model=${model}\n`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await readResponseText(response);
      const message = describeHttpFailure(response.status, response.statusText, bodyText);
      await ctx.onLog("stderr", `[paperclip] ${message}\n`);
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: message,
        provider: "bitexingai",
        biller: "bitexingai",
        model,
        billingType: "metered_api",
      };
    }

    const json = parseObject(await response.json());
    const choice = Array.isArray(json.choices) ? parseObject(json.choices[0]) : {};
    const message = parseObject(choice.message);
    const summary = extractTextContent(message.content) || null;
    const usage = parseUsageSummary(json.usage);
    const responseModel = readNonEmptyString(json.model) ?? model;

    if (summary) {
      await ctx.onLog("stdout", `${summary}${summary.endsWith("\n") ? "" : "\n"}`);
    }

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      usage,
      provider: "bitexingai",
      biller: "bitexingai",
      model: responseModel,
      billingType: "metered_api",
      summary,
    };
  } catch (error) {
    const timedOut =
      error instanceof DOMException
        ? error.name === "AbortError"
        : error instanceof Error && error.name === "AbortError";
    const errorMessage = timedOut
      ? `BitexingAI request timed out after ${timeoutSec}s.`
      : error instanceof Error
        ? error.message
        : String(error);

    await ctx.onLog("stderr", `[paperclip] ${errorMessage}\n`);

    return {
      exitCode: 1,
      signal: null,
      timedOut,
      errorMessage,
      provider: "bitexingai",
      biller: "bitexingai",
      model,
      billingType: "metered_api",
    };
  } finally {
    clearTimeout(timeout);
  }
}
