import type { CreateConfigValues } from "../../components/AgentConfigForm";
import {
  Field,
  DraftInput,
  help,
} from "../../components/agent-config-primitives";
import type { AdapterConfigFieldsProps } from "../types";

type CnLlmProxyCreateValues = CreateConfigValues & {
  baseUrl?: string;
  apiKey?: string;
  vendor?: string;
  usageEndpoint?: string;
};

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function CnLlmProxyConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  const draft = values as CnLlmProxyCreateValues | null;

  return (
    <>
      <Field label="Base URL" hint={help.webhookUrl}>
        <DraftInput value={isCreate ? draft?.baseUrl ?? "" : eff("adapterConfig", "baseUrl", String(config.baseUrl ?? ""))} onCommit={(v) => (isCreate ? set!({ baseUrl: v } as Partial<CreateConfigValues>) : mark("adapterConfig", "baseUrl", v || undefined))} immediate className={inputClass} placeholder="https://new.12ai.org/v1" />
      </Field>

      <Field label="API Key" hint="Bearer token for authentication">
        <DraftInput value={isCreate ? draft?.apiKey ?? "" : eff("adapterConfig", "apiKey", String(config.apiKey ?? ""))} onCommit={(v) => (isCreate ? set!({ apiKey: v } as Partial<CreateConfigValues>) : mark("adapterConfig", "apiKey", v || undefined))} immediate className={inputClass} placeholder="sk-..." type="password" />
      </Field>

      <Field label="Model" hint="Model ID for chat completions">
        <DraftInput value={isCreate ? draft?.model ?? "" : eff("adapterConfig", "model", String(config.model ?? ""))} onCommit={(v) => (isCreate ? set!({ model: v }) : mark("adapterConfig", "model", v || undefined))} immediate className={inputClass} placeholder="gemini-2.5-flash" />
      </Field>

      <Field label="Vendor" hint="Vendor identifier for billing (e.g. 12ai, bitexingai)">
        <DraftInput value={isCreate ? draft?.vendor ?? "" : eff("adapterConfig", "vendor", String(config.vendor ?? ""))} onCommit={(v) => (isCreate ? set!({ vendor: v } as Partial<CreateConfigValues>) : mark("adapterConfig", "vendor", v || undefined))} immediate className={inputClass} placeholder="12ai" />
      </Field>

      <Field label="Usage Endpoint" hint="Optional usage API endpoint for quota tracking">
        <DraftInput value={isCreate ? draft?.usageEndpoint ?? "" : eff("adapterConfig", "usageEndpoint", String(config.usageEndpoint ?? ""))} onCommit={(v) => (isCreate ? set!({ usageEndpoint: v } as Partial<CreateConfigValues>) : mark("adapterConfig", "usageEndpoint", v || undefined))} immediate className={inputClass} placeholder="https://new.12ai.org/api/usage/token/" />
      </Field>
    </>
  );
}
