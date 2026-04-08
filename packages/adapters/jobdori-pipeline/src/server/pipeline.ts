import { spawn } from "node:child_process";
import type { ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";

export const DEFAULT_JOBDORI_PIPELINE_CWD = "/Users/ehowlsla/ai-jobdori";
export const JOBDORI_PIPELINE_CWD_ENV_VAR = "JOBDORI_PIPELINE_CWD";
export const DEFAULT_PIPELINE_KILL_GRACE_MS = 5_000;

const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";

export type PipelineCommandName =
  | "rss:fetch"
  | "rss:score"
  | "rss:drafts"
  | "rss:all"
  | "review:weekly"
  | "review:monthly"
  | "auto-approve"
  | "daily-pipeline";

export interface PipelineCommandSpec {
  name: PipelineCommandName;
  label: string;
  description: string;
  command: string;
  args: string[];
}

export interface PipelineRunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  killGraceMs?: number;
  onStdoutChunk?: (chunk: string) => void;
  onStderrChunk?: (chunk: string) => void;
}

export interface PipelineRunResult {
  name: PipelineCommandName;
  label: string;
  description: string;
  cwd: string;
  command: string;
  args: string[];
  commandLine: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  ok: boolean;
}

const PIPELINE_COMMANDS: Record<PipelineCommandName, PipelineCommandSpec> = {
  "rss:fetch": {
    name: "rss:fetch",
    label: "RSS Fetch",
    description: "Collect RSS items from the configured jobdori sources.",
    command: NPM_COMMAND,
    args: ["run", "rss:fetch"],
  },
  "rss:score": {
    name: "rss:score",
    label: "RSS Score",
    description: "Apply keyword scoring and deduplication to fetched RSS items.",
    command: NPM_COMMAND,
    args: ["run", "rss:score"],
  },
  "rss:drafts": {
    name: "rss:drafts",
    label: "RSS Drafts",
    description: "Generate YAML and Markdown drafts from the scored RSS feed.",
    command: NPM_COMMAND,
    args: ["run", "rss:drafts"],
  },
  "rss:all": {
    name: "rss:all",
    label: "RSS All",
    description: "Run the full RSS pipeline: fetch, score, and draft generation.",
    command: NPM_COMMAND,
    args: ["run", "rss:all"],
  },
  "review:weekly": {
    name: "review:weekly",
    label: "Weekly Review",
    description: "Generate the weekly top-5 review aggregation.",
    command: NPM_COMMAND,
    args: ["run", "review:weekly"],
  },
  "review:monthly": {
    name: "review:monthly",
    label: "Monthly Review",
    description: "Generate the monthly top-10 review aggregation.",
    command: NPM_COMMAND,
    args: ["run", "review:monthly"],
  },
  "auto-approve": {
    name: "auto-approve",
    label: "Auto Approve",
    description: "Run the draft auto-approval cron script.",
    command: "bash",
    args: ["scripts/cron/auto-approve.sh"],
  },
  "daily-pipeline": {
    name: "daily-pipeline",
    label: "Daily Pipeline",
    description: "Run the full daily cron pipeline script.",
    command: "bash",
    args: ["scripts/cron/daily-pipeline.sh"],
  },
};

export function listPipelineCommands(): PipelineCommandSpec[] {
  return Object.values(PIPELINE_COMMANDS);
}

export function getPipelineCommandSpec(name: PipelineCommandName): PipelineCommandSpec {
  return PIPELINE_COMMANDS[name];
}

export function resolvePipelineCwd(cwd?: string): string {
  const fromArg = typeof cwd === "string" ? cwd.trim() : "";
  if (fromArg.length > 0) return fromArg;

  const fromEnv = process.env[JOBDORI_PIPELINE_CWD_ENV_VAR]?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  return DEFAULT_JOBDORI_PIPELINE_CWD;
}

export async function runPipelineCommand(
  name: PipelineCommandName,
  options: PipelineRunOptions = {},
): Promise<PipelineRunResult> {
  const spec = getPipelineCommandSpec(name);
  const cwd = resolvePipelineCwd(options.cwd);
  const env = { ...process.env, ...options.env };
  const startedAt = Date.now();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  return await new Promise<PipelineRunResult>((resolve, reject) => {
    let timedOut = false;
    let child: ChildProcessByStdio<null, Readable, Readable>;
    let timeoutId: NodeJS.Timeout | null = null;
    let killTimerId: NodeJS.Timeout | null = null;

    const cleanupTimers = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (killTimerId) {
        clearTimeout(killTimerId);
        killTimerId = null;
      }
    };

    try {
      child = spawn(spec.command, spec.args, {
        cwd,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      reject(error);
      return;
    }

    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stdoutChunks.push(text);
      options.onStdoutChunk?.(text);
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stderrChunks.push(text);
      options.onStderrChunk?.(text);
    });

    child.once("error", (error) => {
      cleanupTimers();
      reject(error);
    });

    child.once("close", (exitCode, signal) => {
      cleanupTimers();
      const durationMs = Date.now() - startedAt;
      const stdout = stdoutChunks.join("");
      const stderr = stderrChunks.join("");

      resolve({
        name: spec.name,
        label: spec.label,
        description: spec.description,
        cwd,
        command: spec.command,
        args: [...spec.args],
        commandLine: [spec.command, ...spec.args].join(" "),
        exitCode,
        signal,
        timedOut,
        stdout,
        stderr,
        durationMs,
        ok: !timedOut && exitCode === 0,
      });
    });

    if (options.timeoutMs && options.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");

        const killGraceMs =
          typeof options.killGraceMs === "number" && options.killGraceMs >= 0
            ? options.killGraceMs
            : DEFAULT_PIPELINE_KILL_GRACE_MS;

        killTimerId = setTimeout(() => {
          child.kill("SIGKILL");
        }, killGraceMs);

        killTimerId.unref();
      }, options.timeoutMs);

      timeoutId.unref();
    }
  });
}
