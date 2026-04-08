import type { TranscriptEntry } from "../types";

export function parseCnLlmProxyStdoutLine(line: string, ts: string): TranscriptEntry[] {
  return [{ kind: "stdout", ts, text: line }];
}
