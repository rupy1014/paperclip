import type { UIAdapterModule } from "../types";
import { parseCnLlmProxyStdoutLine } from "./parse-stdout";
import { CnLlmProxyConfigFields } from "./config-fields";
import { buildCnLlmProxyConfig } from "./build-config";

export const cnLlmProxyUIAdapter: UIAdapterModule = {
  type: "cn_llm_proxy",
  label: "CN LLM Proxy",
  parseStdoutLine: parseCnLlmProxyStdoutLine,
  ConfigFields: CnLlmProxyConfigFields,
  buildAdapterConfig: buildCnLlmProxyConfig,
};
