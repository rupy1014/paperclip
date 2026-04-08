import {
  getPipelineCommandSpec,
  listPipelineCommands,
  runPipelineCommand,
  type PipelineCommandName,
  type PipelineRunOptions,
  type PipelineRunResult,
} from "../server/index.js";

export { getPipelineCommandSpec, listPipelineCommands, runPipelineCommand };
export type { PipelineCommandName, PipelineRunOptions, PipelineRunResult };

export function isPipelineCommandName(value: string): value is PipelineCommandName {
  return listPipelineCommands().some((command) => command.name === value);
}

export function parsePipelineCommandName(value: string): PipelineCommandName {
  if (!isPipelineCommandName(value)) {
    const supported = listPipelineCommands()
      .map((command) => command.name)
      .join(", ");
    throw new Error(`Unsupported jobdori pipeline command "${value}". Supported commands: ${supported}`);
  }

  return value;
}

export function formatPipelineRunResult(result: PipelineRunResult): string {
  const status = result.ok ? "ok" : result.timedOut ? "timed_out" : "failed";
  const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");

  return [
    `command: ${result.commandLine}`,
    `cwd: ${result.cwd}`,
    `status: ${status}`,
    `exitCode: ${String(result.exitCode)}`,
    `signal: ${result.signal ?? "none"}`,
    `durationMs: ${String(result.durationMs)}`,
    output.length > 0 ? `output:\n${output}` : "output: <empty>",
  ].join("\n");
}

export function printPipelineRunResult(result: PipelineRunResult, write: (text: string) => void = console.log): void {
  write(formatPipelineRunResult(result));
}

export async function runPipelineSmokeTest(
  name: PipelineCommandName,
  options?: PipelineRunOptions,
): Promise<PipelineRunResult> {
  return await runPipelineCommand(name, options);
}
