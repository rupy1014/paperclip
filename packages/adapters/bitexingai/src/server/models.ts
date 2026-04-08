import { createHash } from "node:crypto";
import type { AdapterModel } from "@paperclipai/adapter-utils";
import { asString, parseObject } from "@paperclipai/adapter-utils/server-utils";

const MODELS_CACHE_TTL_MS = 60_000;
const modelsCache = new Map<string, { expiresAt: number; models: AdapterModel[] }>();

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

function cacheKey(config: Record<string, unknown>): string {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = asString(config.apiKey, "").trim();
  const extraHeaders = JSON.stringify(toStringHeaders(config.extraHeaders));
  return createHash("sha256")
    .update(`${baseUrl}\n${apiKey}\n${extraHeaders}`)
    .digest("hex");
}

function dedupeModels(models: AdapterModel[]): AdapterModel[] {
  const seen = new Set<string>();
  const deduped: AdapterModel[] = [];
  for (const model of models) {
    const id = model.id.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push({
      id,
      label: model.label.trim() || id,
    });
  }
  return deduped;
}

function sortModels(models: AdapterModel[]): AdapterModel[] {
  return [...models].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true, sensitivity: "base" }));
}

function pruneExpiredCache(now: number): void {
  for (const [key, value] of modelsCache.entries()) {
    if (value.expiresAt <= now) {
      modelsCache.delete(key);
    }
  }
}

function parseModelsPayload(value: unknown): AdapterModel[] {
  const payload = parseObject(value);
  if (!Array.isArray(payload.data)) return [];

  const parsed: AdapterModel[] = [];
  for (const entry of payload.data) {
    const record = parseObject(entry);
    const id = asString(record.id, "").trim();
    if (!id) continue;
    const label = asString(record.name, "").trim() || id;
    parsed.push({ id, label });
  }

  return sortModels(dedupeModels(parsed));
}

export async function listBitexingaiModels(config: Record<string, unknown>): Promise<AdapterModel[]> {
  const normalizedConfig = parseObject(config);
  const baseUrl = normalizeBaseUrl(normalizedConfig.baseUrl);
  const apiKey = asString(normalizedConfig.apiKey, "").trim();

  if (!baseUrl || !apiKey) {
    return [];
  }

  const key = cacheKey(normalizedConfig);
  const now = Date.now();
  pruneExpiredCache(now);

  const cached = modelsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.models;
  }

  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...toStringHeaders(normalizedConfig.extraHeaders),
      },
    });

    if (!response.ok) {
      return [];
    }

    const models = parseModelsPayload(await response.json());
    modelsCache.set(key, {
      expiresAt: now + MODELS_CACHE_TTL_MS,
      models,
    });
    return models;
  } catch {
    return [];
  }
}
