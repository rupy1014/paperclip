import type { CreateConfigValues } from "../../components/AgentConfigForm";

type CnLlmProxyValues = CreateConfigValues & {
  baseUrl?: string;
  apiKey?: string;
  vendor?: string;
  usageEndpoint?: string;
  timeoutSec?: number | string;
};

export function buildCnLlmProxyConfig(v: CreateConfigValues): Record<string, unknown> {
  const values = v as CnLlmProxyValues;
  const ac: Record<string, unknown> = {};
  if (values.baseUrl) ac.baseUrl = values.baseUrl;
  if (values.apiKey) ac.apiKey = values.apiKey;
  if (values.model) ac.model = values.model;
  if (values.vendor) ac.vendor = values.vendor;
  if (values.usageEndpoint) ac.usageEndpoint = values.usageEndpoint;
  if (values.timeoutSec) ac.timeoutSec = Number(values.timeoutSec);
  return ac;
}
