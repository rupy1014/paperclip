# Jobdori Pipeline Adapter

`@paperclipai/adapter-jobdori-pipeline` is a self-contained scaffold for invoking the `ai-jobdori` content pipeline from Paperclip-style server and CLI entry points.

## Included Entry Points

- `src/index.ts`: shared adapter metadata
- `src/server/index.ts`: named helpers for the common pipeline commands
- `src/server/pipeline.ts`: the actual `child_process` wrappers
- `src/cli/index.ts`: CLI-oriented smoke-test helpers and result formatting

## Default Working Directory

The scaffold assumes the jobdori pipeline lives at:

```text
/Users/ehowlsla/ai-jobdori
```

Override that per call with `cwd`, or globally with the `JOBDORI_PIPELINE_CWD` environment variable.

## Supported Commands

- `rss:fetch`
- `rss:score`
- `rss:drafts`
- `rss:all`
- `review:weekly`
- `review:monthly`
- `auto-approve`
- `daily-pipeline`

## Server Usage

```ts
import { runRssAll, runWeeklyReview } from "@paperclipai/adapter-jobdori-pipeline/server";

const rssResult = await runRssAll({
  timeoutMs: 10 * 60 * 1000,
});

const weeklyResult = await runWeeklyReview({
  cwd: "/Users/ehowlsla/ai-jobdori",
});
```

For generic invocation:

```ts
import { runPipelineCommand } from "@paperclipai/adapter-jobdori-pipeline/server";

const result = await runPipelineCommand("auto-approve");
```

## CLI Utility Usage

```ts
import {
  formatPipelineRunResult,
  parsePipelineCommandName,
  runPipelineSmokeTest,
} from "@paperclipai/adapter-jobdori-pipeline/cli";

const command = parsePipelineCommandName("rss:fetch");
const result = await runPipelineSmokeTest(command, {
  timeoutMs: 60_000,
});

console.log(formatPipelineRunResult(result));
```

## Build

```sh
pnpm --filter @paperclipai/adapter-jobdori-pipeline typecheck
pnpm --filter @paperclipai/adapter-jobdori-pipeline build
```
