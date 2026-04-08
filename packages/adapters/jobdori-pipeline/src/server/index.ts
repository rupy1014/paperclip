import { runPipelineCommand, type PipelineRunOptions } from "./pipeline.js";

export {
  DEFAULT_JOBDORI_PIPELINE_CWD,
  DEFAULT_PIPELINE_KILL_GRACE_MS,
  JOBDORI_PIPELINE_CWD_ENV_VAR,
  getPipelineCommandSpec,
  listPipelineCommands,
  resolvePipelineCwd,
  runPipelineCommand,
  type PipelineCommandName,
  type PipelineCommandSpec,
  type PipelineRunOptions,
  type PipelineRunResult,
} from "./pipeline.js";

export function runRssFetch(options?: PipelineRunOptions) {
  return runPipelineCommand("rss:fetch", options);
}

export function runRssScore(options?: PipelineRunOptions) {
  return runPipelineCommand("rss:score", options);
}

export function runRssDrafts(options?: PipelineRunOptions) {
  return runPipelineCommand("rss:drafts", options);
}

export function runRssAll(options?: PipelineRunOptions) {
  return runPipelineCommand("rss:all", options);
}

export function runWeeklyReview(options?: PipelineRunOptions) {
  return runPipelineCommand("review:weekly", options);
}

export function runMonthlyReview(options?: PipelineRunOptions) {
  return runPipelineCommand("review:monthly", options);
}

export function runAutoApprove(options?: PipelineRunOptions) {
  return runPipelineCommand("auto-approve", options);
}
