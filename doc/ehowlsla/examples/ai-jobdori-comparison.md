# 예시 — 기존 배치 방식과 에이전트 오케스트레이션 비교

> **상태**: 예시
> **목적**: 기존 배치 파이프라인과 Paperclip 오케스트레이션을 운영 관점에서 비교한다.
> **대상 독자**: `ai-jobdori`에 Paperclip overlay를 적용할 가치와 한계를 비교하려는 독자
> **관련 문서**: [`../README.md`](../README.md), [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md), [`../ORCHESTRATION-PATTERNS.md`](../ORCHESTRATION-PATTERNS.md)


이 문서는 `ai-jobdori`의 하드코딩 배치 파이프라인과 Paperclip 기반 에이전트 오케스트레이션을 같은 운영 관점에서 비교하기 위한 문서다. 방향과 조직 설계는 [../AI-COMPANY.md](../AI-COMPANY.md), 현재 하이브리드 운영 전략은 [../STRATEGY.md](../STRATEGY.md), 실제 적용 이력은 [../ops/claw-operations-log.md](../ops/claw-operations-log.md)를 기준으로 본다. 비교 결과를 바탕으로 한 후속 제안은 [../BACKLOG.md](../BACKLOG.md)에 정리한다. 실제 운영 패턴 카탈로그는 [../ORCHESTRATION-PATTERNS.md](../ORCHESTRATION-PATTERNS.md)를 참고한다.

핵심 질문은 단순하다.

- 지금 잘 돌아가는 셸 스크립트 체계를 왜 바꾸려 하는가
- 무엇은 Paperclip으로 옮길 가치가 있고, 무엇은 그대로 두는 편이 나은가
- 현재 시점에서 두 방식의 장단점은 어디까지가 사실인가

이 비교가 필요한 이유는 "기술적으로 더 멋져 보이는 쪽"을 고르기 위해서가 아니다. `ai-jobdori`는 이미 실전 운영 중인 파이프라인이고, Paperclip은 그 위에 회사 운영 계층을 얹으려는 신규 제어면이다. 따라서 판단 기준은 새로운 구조의 화려함이 아니라 다음 세 가지다.
이 문서는 특정 시점의 코드/운영 스냅샷을 바탕으로 한 비교이며, 상세 버전·검증 시점은 [`../ops/claw-operations-log.md`](./../ops/claw-operations-log.md) 기준으로 읽는 편이 맞다.

1. 장애가 났을 때 누가 얼마나 빨리 복구할 수 있는가
2. 비용과 승인, 책임을 어디까지 시스템 안에서 추적할 수 있는가
3. 채널과 역할이 늘어날 때 복잡도가 코드 분기인지 조직 분업인지

## 비교 대상 요약

| 항목 | ai-jobdori 배치 방식 | Paperclip 오케스트레이션 |
| --- | --- | --- |
| 기본 단위 | 셸 스크립트 + TypeScript 도구 | 회사, 에이전트, 이슈, 승인, 런 |
| 운영 중심 | cron이 정해진 순서대로 실행 | heartbeat가 상태를 보고 다음 런을 조정 |
| 상태 저장 | 파일시스템 중심 | PostgreSQL 중심 + 로그/이벤트 + 워크스페이스 상태 |
| 관찰 방식 | 로그 파일 + 카카오톡 | 대시보드 + 라이브 런 + 이벤트 + 비용 화면 |
| 승인 방식 | `[퇴고 필요]` 마커 제거 여부 | approval 객체 + issue 연결 + 상태 전이 |
| 비용 통제 | 없음 | `cost_events`, 월별 spend, budget block |
| 실패 복구 | 운영자가 로그 보고 재실행 | orphan reaper, 1회 자동 재시도, 취소/승격 |
| 확장 방식 | 스크립트 추가/복제 | 역할 추가, routine 추가, adapter/context 확장 |

## 아키텍처 비교

### 기존 배치 방식

현재 `ai-jobdori`의 메인 루프는 셸 스크립트와 TS 도구를 순서대로 연결한 구조다.

| 계층 | 실제 구현 근거 | 의미 |
| --- | --- | --- |
| 스케줄러 | `scripts/cron/daily-pipeline.sh`, `weekly-review.sh`, `monthly-review.sh` | cron이 시간 기반으로 호출 |
| 단계형 파이프라인 | `package.json`의 `rss:all = rss-fetch -> rss-score -> rss-drafts` | 3단계 고정 흐름 |
| 입력 소스 | `scripts/tools/lib/rss-sources.ts` | 현재 RSS 소스 65개 |
| 점수화 | `scripts/tools/lib/rss-keywords.ts`, `rss-score.ts` | 키워드/소스 가중치 기반 선별 |
| 승인 | `scripts/cron/auto-approve.sh` | X, Instagram, Threads API를 순차 호출 |
| 상태 | `blog/rss-data/*.json`, `threads-queue/drafts/*.yaml`, `news-drafts/*.md`, `deleted.yaml` | 파일이 곧 작업 상태 |
| 관찰 | `logs/pipeline-YYYY-MM-DD.log`, 카카오 메시지 | 로그와 메신저 요약 위주 |

구체적으로는 다음 사실을 코드에서 확인할 수 있다.

- `daily-pipeline.sh`와 `auto-approve.sh` 모두 `set -uo pipefail`을 사용한다.
- `daily-pipeline.sh`는 `exec > >(tee -a "$LOG_FILE") 2>&1`로 전체 출력을 일별 로그 파일에 남긴다.
- `rss-fetch.ts`는 RSS/Atom/HN 소스를 모아 JSON과 Markdown을 만든다.
- `rss-score.ts`는 `deleted.yaml`, 최근 3일 source YAML, 제목 유사도를 이용해 중복을 줄인 뒤 `score >= 5`만 통과시킨다.
- `rss-drafts.ts`는 Threads YAML과 news markdown 스켈레톤을 동시에 만든다.
- `auto-approve.sh`는 `[퇴고 필요]` 마커가 남아 있으면 HOLD하고, 없으면 `/api/admin/x`, `/api/admin/instagram`, `/api/admin/threads`를 `curl`로 호출한다.
- `daily-pipeline.sh`는 14일이 지난 `[퇴고 필요]` 초안을 자동 삭제한다.

### 오케스트레이션 방식

Paperclip 쪽은 "스크립트를 순서대로 실행"하는 구조보다 "작업 상태를 보고 다음 행동을 결정"하는 구조에 가깝다. 현재 `ehowlsla` 문서 기준 운영 조직은 편집장, 큐레이터, 작가, 엔지니어 4인 체제다.

| 계층 | 실제 구현 근거 | 의미 |
| --- | --- | --- |
| 에이전트 실행 엔진 | `server/src/services/heartbeat.ts` 4,013줄 | wakeup, 큐잉, 세션, 취소, 복구를 단일 서비스에서 제어 |
| 루틴 디스패치 | `server/src/services/routines.ts` 1,471줄 | cron성 작업을 issue 생성과 실행 큐로 연결 |
| 비용/예산 | `server/src/services/costs.ts`, `budgets.ts`, `packages/db/src/schema/cost_events.ts` | 런 단위 비용 기록과 월별 집계 |
| 승인 연결 | `server/src/services/issue-approvals.ts`, `packages/db/src/schema/issue_approvals.ts` | approval과 issue를 1급 객체로 연결 |
| 런 관찰 | `ui/src/components/LiveRunWidget.tsx`, `ActiveAgentsPanel.tsx`, `useLiveRunTranscripts.ts` | 3초 폴링 + 로그/이벤트 스트리밍 |
| 워크스페이스 관리 | `server/src/services/workspace-runtime.ts` 2,106줄 | 작업 디렉터리, worktree, 런타임 서비스 주입 |
| 세션 회전 | `packages/adapter-utils/src/session-compaction.ts`, `heartbeat.ts` | 토큰/수명 기반 세션 rotation |
| 컨텍스트 주입 | `packages/adapters/codex-local/src/server/execute.ts` | `PAPERCLIP_*` 환경변수 20종 주입 |

`../ops/claw-operations-log.md` 기준으로도 이미 다음 운영 사실이 문서화되어 있다.

- 회사 `JOB` 생성 완료
- 편집장, 큐레이터, 작가, 엔지니어 4개 에이전트 생성 완료
- `daily-rss-intake`, `weekly-review`, `monthly-review`, `auto-approval-sweeper`, `publish-retry` routine 등록 완료
- 엔지니어의 `daily-rss-intake` E2E 1회 성공 기록 존재
- 큐레이터의 RSS evaluation issue 처리 성공 기록 존재

즉, Paperclip은 아직 ai-jobdori만큼 장기간 검증된 운영 자산은 아니지만, 최소한 "문서상 아이디어"가 아니라 이미 실행 가능한 제어면으로 올라와 있다.

## 오케스트레이션이 더 나은 점

### 장애 복구

가장 큰 차이는 실패를 작업 상태로 승격시키느냐, 아니면 로그 텍스트로 남기느냐에 있다.

| 상황 | ai-jobdori | Paperclip |
| --- | --- | --- |
| 중간 프로세스 종료 | 로그 보고 수동 재실행 | orphan reaper가 죽은 PID 확인 후 1회 자동 재시도 |
| 런 핸들 유실 | 쉘 프로세스 상태를 운영자가 직접 추적 | `process_pid`, `retry_of_run_id`, `process_loss_retry_count`로 추적 |
| 후속 작업 승격 | 스크립트 다시 돌려야 함 | 실패 런 종료 후 다음 deferred issue execution 승격 가능 |

구체적 근거:

- `packages/db/src/schema/heartbeat_runs.ts`에 `process_pid`, `retry_of_run_id`, `process_loss_retry_count` 필드가 있다.
- `heartbeat.ts`는 고아 런을 검사하면서 PID가 살아 있으면 detached warning만 남기고 계속 유지한다.
- PID가 죽었으면 `error_code = process_lost`로 실패 처리하고, 아직 재시도 횟수가 0이면 자동으로 retry run을 `queued` 상태로 만든다.
- `server/src/__tests__/heartbeat-process-recovery.test.ts`는 "죽은 PID면 정확히 한 번 재시도 큐를 만든다"는 케이스를 검증한다.

실전 시나리오:

엔지니어 에이전트가 `daily-rss-intake` 중 `codex_local` 자식 프로세스를 잃어버린 경우를 생각해보자. ai-jobdori에서는 운영자가 오전에 카카오톡 실패 메시지나 로그를 보고 다시 수동 실행해야 한다. Paperclip에서는 heartbeat engine이 orphaned run을 실패 처리하고 retry run을 새로 큐잉한다. 즉, "언제 실패했는가"뿐 아니라 "복구 시도까지 했는가"가 시스템 상태로 남는다.

### 관찰 가능성

ai-jobdori도 관찰이 없는 시스템은 아니다. 다만 관찰의 단위가 파일과 메신저다. Paperclip은 관찰의 단위를 런, 이벤트, 트랜스크립트로 끌어올린다.

| 항목 | ai-jobdori | Paperclip |
| --- | --- | --- |
| 실시간 상태 | 카카오톡 요약 후 확인 | 라이브 런 위젯과 대시보드 카드 |
| 세부 출력 | `logs/*.log` grep | run detail, transcript, event stream |
| 취소 | 다음 cron 전까지 사실상 수동 | UI에서 active run cancel 가능 |
| UI 갱신 | 없음 | 3초 폴링 + websocket 재연결 |

구체적 근거:

- `LiveRunWidget.tsx`는 `liveRunsForIssue`와 `activeRunForIssue`를 `refetchInterval: 3000`으로 갱신한다.
- 같은 위젯에서 active run에 대해 `Stop` 버튼으로 취소 API를 호출한다.
- `ActiveAgentsPanel.tsx`는 대시보드에서 최근 에이전트 런을 카드 형태로 노출한다.
- `useLiveRunTranscripts.ts`는 2초 간격 로그 읽기와 회사 이벤트 websocket을 동시에 사용한다.
- 연결이 끊기면 `scheduleReconnect()`로 자동 재연결한다.

실전 시나리오:

작가가 한 이슈에서 오래 생각 중인지, stderr를 뿜으며 실패 중인지, 이미 완료됐는지는 Paperclip UI 한 화면에서 구분된다. ai-jobdori에서는 같은 판단을 하려면 로그 파일을 열고 해당 날짜 파일에서 구간을 찾아야 한다.

### 비용 추적과 예산 차단

이 영역은 Paperclip이 구조적으로 우위다. ai-jobdori는 deterministic batch 설계라 기본 실행 비용이 낮고 예측 가능하지만, 시스템이 비용을 인지하지는 않는다.

| 항목 | ai-jobdori | Paperclip |
| --- | --- | --- |
| 런별 비용 기록 | 없음 | `cost_events`에 provider/model/tokens/cost 저장 |
| 월별 합계 | 없음 | agent/company 월간 spend 집계 |
| 예산 초과 시 차단 | 없음 | invocation 전 `budget block` 검사 |
| 실행 중단 후 상태 반영 | 없음 | scope pause + queued/running work 취소 |

구체적 근거:

- `packages/db/src/schema/cost_events.ts`는 `heartbeat_run_id`, `provider`, `biller`, `billing_type`, 토큰 수, `cost_cents`를 저장한다.
- `server/src/services/costs.ts`는 이벤트 생성 후 agent/company 월간 spend를 다시 계산해 저장한다.
- `server/src/services/heartbeat.ts`는 queued run claim과 wakeup enqueue 전에 `budgets.getInvocationBlock(...)`를 호출한다.
- `server/src/services/budgets.ts`는 정책이 hard stop에 걸리면 agent/project/company를 `pauseReason = budget`으로 멈추고 훅을 통해 work cancellation을 트리거한다.

실전 시나리오:

큐레이터와 작가가 같은 날 유난히 많은 런을 태워 비용이 급증하면, Paperclip은 "이번 달 얼마 썼는가"를 보여줄 뿐 아니라 새로운 invocation 자체를 막을 수 있다. ai-jobdori는 실행 비용이 주로 서버/외부 API 사용료에 섞여서 보이고, 파이프라인 자체가 예산 상태를 보고 멈추지는 않는다.

#### 비용 추적의 실제 동작 방식

여기에는 중요한 단서가 하나 더 있다. Paperclip의 비용 추적은 "모든 에이전트 실행을 다 돈으로 환산한다"기보다, 어댑터가 런타임 인증 상태를 보고 "이 실행이 API 과금인지, 구독 플랜에 포함된 실행인지"를 먼저 판정한 뒤 그 결과를 ledger에 넣는 구조다.

현재 코드 기준으로 이 판정을 명시적으로 수행하는 로컬 어댑터는 `claude-local`과 `codex-local`이다.

| 어댑터 | 런타임 판정 기준 | 기록되는 billing type | `cost_cents` 처리 | 현재 `ehowlsla@claw` 의미 |
| --- | --- | --- | --- | --- |
| `claude-local` | `ANTHROPIC_API_KEY`가 있으면 API, 없으면 Claude CLI 로그인 세션 | API면 `metered_api`, 로그인 세션이면 `subscription_included` | API면 `costUsd * 100`, 구독이면 강제로 `0` | 이전에 사용하던 어댑터. 2026-04-03 기준 codex-local로 전환 완료 |
| `codex-local` | `OPENAI_API_KEY`가 있으면 API, 없으면 Codex 로그인 세션 | API면 `metered_api`, 로그인 세션이면 `subscription_included` | API면 `costUsd * 100`, 구독이면 강제로 `0` | **현재 4개 에이전트가 이 경로를 사용 중.** ChatGPT 구독 로그인 세션으로 운용하므로 비용은 0원으로 적재된다 |

정규화 단계도 생각보다 보수적이다. `heartbeat.ts`는 어댑터가 넘긴 `api`와 `subscription` 값을 각각 `metered_api`와 `subscription_included`로 정규화하고, `subscription_included`인 경우 `normalizeBilledCostCents(...)`에서 `cost_cents`를 무조건 `0`으로 만든다. 대신 입력 토큰, 출력 토큰, 캐시 토큰은 과금 방식과 무관하게 계속 기록한다.

즉 Paperclip은 현재도 사용량을 "안 보는" 시스템은 아니다. 다만 예산 정책이 보는 메트릭은 `budgets.ts`의 `billed_cents` 하나뿐이라서, 구독 포함 실행은 토큰이 아무리 많이 쌓여도 예산을 넘긴 것으로 계산되지 않는다. 소프트 임계치는 기본적으로 예산의 80%에서 경고를 만들고, 하드 스톱은 scope를 pause한 뒤 승인 없이는 다시 못 돌리게 하는 구조인데, 이 전체 체인은 `cost_cents > 0`인 metered API 실행에서만 실질 의미가 있다.

현재 `ehowlsla@claw` 배포를 이 규칙에 대입하면 해석은 꽤 단순하다.

| 현재 배포 항목 | 실제 상태 (2026-04-03 기준) | 운영 의미 |
| --- | --- | --- |
| 실행 어댑터 | 4개 에이전트 모두 `codex-local` (Codex CLI v0.111.0) | 비용 판정은 `codex-local` 규칙을 따른다 |
| 모델 | 편집장 `gpt-5.4`, 나머지 3인 `gpt-5.3-codex` | 편집장만 상위 모델 사용 |
| 인증 방식 | ChatGPT 구독 로그인 세션, `OPENAI_API_KEY` 미주입 | billing type은 `subscription_included`, biller는 `chatgpt`다 |
| 비용 적재 | 토큰은 기록되지만 `cost_cents = 0` | 비용 대시보드는 사용량 관찰에는 도움되지만 청구 금액 집계는 비어 보일 수 있다 |
| 예산 차단 | `billed_cents` 기준 | 현재 배포에서는 사실상 no-op에 가깝다 |
| 전환 조건 | `OPENAI_API_KEY` 환경변수 주입 | 그 순간부터 월간 spend, soft warning, hard stop이 실제 비용 기준으로 켜진다 |

그래서 현재 배포를 평가할 때는 "비용 추적이 없다"가 아니라 "토큰 추적은 되지만, ChatGPT 구독 로그인 운용이라 예산 차단은 실질적으로 꺼져 있다"가 더 정확하다. 대신 분석 축 자체는 이미 갖춰져 있어서, 비용 이벤트는 에이전트별, provider별, biller별(`chatgpt`), 프로젝트별로 쪼개 볼 수 있고, 5시간, 24시간, 7일 rolling window와 월간 spend 집계도 바로 나온다. 즉 지금 `ehowlsla` 운영에서는 이 기능을 "예산 집행 통제"보다 "사용량 관찰과 나중의 OpenAI API 과금 전환 준비"에 더 가깝게 이해하는 편이 맞다.

> **변경 이력**: 2026-04-03 기준 4개 에이전트를 `claude-local` → `codex-local`로 전환. Claude CLI(Anthropic 구독) 대신 Codex CLI(ChatGPT 구독)로 운용 중.

### 동시성 제어

이 비교는 운영 규모가 커질수록 더 중요해진다. 배치 스크립트는 단일 cron 흐름에서는 단순하지만, 중복 실행이나 겹침이 생기면 보호 장치가 얇다. Paperclip은 애초에 겹침을 제어하는 필드를 갖고 있다.

| 항목 | ai-jobdori | Paperclip |
| --- | --- | --- |
| 중복 실행 제어 | cron 운영 규율 의존 | idempotency key |
| 작업 잠금 | 파일/시간대 암묵 규칙 | row-level lock |
| 겹침 정책 | 사실상 없음 | `skip_if_active`, `coalesce_if_active`, `always_enqueue` |
| issue 단위 실행 슬롯 | 없음 | issue execution lock |

구체적 근거:

- `server/src/services/routines.ts`는 routine row를 `for update`로 잠그고 idempotency key 중복 여부를 먼저 확인한다.
- 이미 active issue가 있으면 정책에 따라 run을 `skipped` 또는 `coalesced`로 종료한다.
- `ui/src/pages/Routines.tsx`와 `RoutineDetail.tsx`는 세 가지 concurrency policy를 노출한다.
- `heartbeat.ts`는 issue wakeup 시 `issues ... for update`로 실행 슬롯을 잠근 뒤 execution run을 연결한다.

실전 시나리오:

`daily-rss-intake`가 길어져 07:00 런이 아직 끝나지 않았는데 수동 재실행이나 webhook이 추가로 들어오는 상황을 생각해보자. ai-jobdori에서는 동일한 디렉터리를 두 프로세스가 만질 가능성을 운영자가 조심해야 한다. Paperclip에서는 같은 routine과 issue에 대해 겹친 트리거를 skip 또는 coalesce로 정식 처리할 수 있다.

### 승인 워크플로

ai-jobdori의 승인 기준은 명확하다. `[퇴고 필요]`가 있으면 HOLD, 없으면 승인. 이 방식은 빠르지만 "누가 왜 보류했는지"는 구조화되지 않는다.

| 항목 | ai-jobdori | Paperclip |
| --- | --- | --- |
| 승인 대기 표현 | `[퇴고 필요]` 문자열 | approval row + issue linkage |
| 승인 대상 연결 | 파일명 관례 | `issue_approvals` 테이블 |
| 상태 차단 | 마커가 남으면 스크립트가 HOLD | `pending_approval` 상태면 invoke 자체 차단 |
| 감사 흔적 | 로그 텍스트 | link/unlink, 결정 시각, 결정자 |

구체적 근거:

- `auto-approve.sh`는 YAML에서 `[퇴고 필요]`를 grep으로 찾는다.
- `packages/db/src/schema/issue_approvals.ts`는 issue와 approval의 다대다 링크를 별도 테이블로 저장한다.
- `server/src/services/issue-approvals.ts`는 issue와 approval이 같은 회사인지 검증하고 link/unlink를 제공한다.
- `server/src/middleware/auth.ts`, `heartbeat.ts`, `routines.ts`는 `pending_approval` 상태 에이전트를 invokable하지 않은 상태로 취급한다.

실전 시나리오:

편집장이 작가 산출물을 보고 "지금은 보류지만 내일 오전 10시에 다시 보자"라고 판단하는 경우, ai-jobdori에서는 결국 파일 마커와 카카오/메모에 의존한다. Paperclip에서는 해당 이슈와 연결된 approval, 코멘트, 상태 블록이 모두 같은 시스템 안에 남는다.

### 확장성과 역할 분업

`ai-jobdori`는 현재 구조가 잘 맞는 범위 안에서는 매우 빠르다. 하지만 판단 단계가 늘어날수록 스크립트 분기가 커진다. Paperclip은 그 증가분을 역할로 분산시킬 수 있다.

| 확장 요구 | ai-jobdori에서의 비용 | Paperclip에서의 비용 |
| --- | --- | --- |
| 새 채널 추가 | 스크립트 분기 + 승인 API 추가 | role/routine/adapter 설정 추가 |
| 새 검수 단계 추가 | YAML 규칙 증가 | 새 에이전트 또는 approval 단계 추가 |
| 예외 처리 분기 | 쉘 조건문 증가 | issue comment + state transition으로 흡수 |
| 작업 공간 분리 | 디렉터리 관리 수동 | workspace strategy와 env 주입 |

구체적 근거:

- `workspace-runtime.ts`는 worktree 경로, branch, repo URL, issue/agent/project 정보를 환경변수로 구성해 주입한다.
- `codex-local` 어댑터만 봐도 `PAPERCLIP_RUN_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WORKSPACE_CWD` 등 20개의 `PAPERCLIP_*` 변수를 주입한다.
- `../ops/claw-operations-log.md` 기준 현재도 4인 조직과 5개 routine으로 이미 운영 분업이 시작되었다.

실전 시나리오:

향후 `jobdori`가 "뉴스 게시"뿐 아니라 "리뷰 글, 영상 스크립트, 후속 댓글 관리"까지 맡는다면, ai-jobdori는 배치 스크립트 가지치기가 커질 가능성이 높다. Paperclip은 그 확장을 "작가 2명", "영상 편집자", "배포 담당" 같은 조직 분업으로 풀 수 있다.

## 기존 배치가 더 나은 점

이 부분은 솔직해야 한다. 지금 당장 운영 안정성만 놓고 보면 ai-jobdori 배치 방식이 더 나은 면이 분명히 있다.

### 단순성

가장 큰 장점은 읽히는 구조다.

- `daily-pipeline.sh`를 열면 하루 파이프라인이 순서대로 보인다.
- `rss:all`이 무엇을 하는지도 `package.json` 한 줄이면 설명된다.
- "07:00에 RSS 수집, 승인, stale 정리, digest 배포, 카카오 보고"라는 정신모형이 매우 분명하다.

반면 Paperclip은 heartbeat, routines, wakeups, deferred issue execution, session rotation, cost events, workspace runtime까지 이해해야 전체 그림이 잡힌다. 제어면으로는 강하지만, 처음 읽는 사람에게는 훨씬 무겁다.

### 디버깅

ai-jobdori는 문제가 나면 대체로 다음 순서로 끝난다.

1. 해당 날짜 로그 파일 연다
2. 실패 phase 찾는다
3. 스크립트 한 단계만 재실행한다

실제로 `daily-pipeline.sh`는 `pipeline-YYYY-MM-DD.log`, `weekly-review.sh`는 `weekly-review-YYYY-MM-DD.log`, `monthly-review.sh`는 `monthly-review-YYYY-MM-DD.log`를 남긴다. 즉, grep 친화적이다.

Paperclip은 더 많은 정보를 주지만, 그만큼 봐야 할 것도 많다. 실패가 runtime, adapter, budget, approval, workspace, transcript 중 어디 계층에서 났는지 먼저 분류해야 한다.

### 의존성

ai-jobdori의 운영 코어는 사실상 다음이면 된다.

- Node.js
- cron
- 셸
- 외부 API 접근

Paperclip은 여기에 더해 다음이 붙는다.

- 서버 프로세스
- 데이터베이스
- UI
- 에이전트 adapter 런타임
- workspace/runtime 서비스

즉, Paperclip은 "더 많은 것을 할 수 있는 대신 더 많은 것이 살아 있어야 하는 시스템"이다.

### 배포와 이동성

ai-jobdori는 작은 서버에 `scp`나 `rsync`로 올리고 cron만 맞추면 돌아간다. 배포 형태가 매우 단순하다.

Paperclip은 한 번 올라가면 훨씬 많은 운영 제어를 주지만, 첫 설치와 초기 설정은 더 무겁다. 특히 `ehowlsla` 현재 문서에서도 `weekly-review`, `monthly-review`, `auto-approval-sweeper`, `publish-retry`는 등록 완료 상태이지만 실행 성공 기록 축적은 아직 더 필요하다고 적혀 있다.

즉, 배포 후 신뢰를 얻기까지의 러닝타임 복잡도는 배치보다 높다.

### 비용 구조

ai-jobdori의 RSS fetch, 점수화, draft skeleton 생성은 대체로 deterministic하다. 판단 비용이 낮고, 입력이 같으면 같은 결과가 나온다.

Paperclip은 큐레이터/작가/편집장처럼 판단을 AI agent에게 넘기기 때문에 다음 비용이 추가된다.

- 모델 호출비
- 장기 세션 관리비
- 트랜스크립트/로그 저장 비용
- 운영자가 확인할 UI 표면 유지 비용

Paperclip은 비용을 더 잘 추적하지만, 동시에 더 많은 비용을 발생시키는 구조이기도 하다.

### 성숙도

이 항목은 현재 시점에서 가장 중요하다.

- ai-jobdori는 이미 실제 운영 시나리오가 고정돼 있다.
- Paperclip의 `jobdori` 회사 구성은 이제 막 E2E 검증을 쌓는 단계다.

`../ops/claw-operations-log.md` 기준으로 엔지니어와 큐레이터는 검증 기록이 있지만, 편집장과 작가는 아직 개별 실전 기록이 더 쌓여야 한다. 따라서 "장기 안정 운영"만 놓고 보면 현재는 ai-jobdori가 더 성숙한 자산이다.

## 트레이드오프 요약

| 비교 축 | 더 강한 쪽 | 이유 |
| --- | --- | --- |
| 구조 단순성 | ai-jobdori | cron + shell + TS 3단 구조가 즉시 읽힌다 |
| 장애 자동 복구 | Paperclip | PID 추적, orphan reaper, 1회 자동 재시도 |
| 실시간 관찰 | Paperclip | 대시보드, 라이브 런, transcript, cancel |
| 운영 디버깅 속도 | ai-jobdori | 로그 파일 하나로 빠르게 확인 가능 |
| 비용 인식 | Paperclip | 런 단위 비용 기록과 예산 차단 |
| deterministic 처리 | ai-jobdori | fetch/score/draft는 규칙 기반이라 예측 가능 |
| 승인 감사 추적 | Paperclip | approval-issue link와 상태 전이 |
| 채널/역할 확장 | Paperclip | 스크립트 복제보다 역할 분업으로 확장 가능 |
| 초기 배포 난이도 | ai-jobdori | 서버 준비와 cron 설정만으로 충분 |
| 장기 제품화 잠재력 | Paperclip | 제어면과 조직 모델이 이미 준비되어 있음 |

요약하면 이렇다.

- 배치 스크립트는 "오늘도 같은 일을 안정적으로 반복"하는 데 강하다.
- Paperclip은 "일의 이유, 비용, 승인, 예외를 회사 운영 단위로 관리"하는 데 강하다.

둘은 경쟁 관계라기보다 레이어가 다르다.

## 현재 하이브리드 구성

현재 `ehowlsla` 브랜치의 전략은 둘 중 하나를 버리는 방식이 아니다. 오히려 [../STRATEGY.md](../STRATEGY.md)에 적힌 대로 "판단은 Paperclip, deterministic 실행은 기존 파이프라인"이라는 하이브리드가 현실적이다.

현재 구조를 한 줄로 요약하면 다음과 같다.

- RSS fetch, 점수화, draft skeleton, TTS, FFmpeg, 배포 API 호출은 기존 스크립트 자산을 최대한 재사용한다.
- 무엇을 고를지, 어느 채널에 내보낼지, 어떤 초안을 보류할지, 실패를 어떻게 복구할지는 Paperclip의 issue/routine/approval/agent 계층으로 올린다.

이 구성이 좋은 이유는 다음과 같다.

| 유지할 것 | 이유 |
| --- | --- |
| `rss-fetch`, `rss-score`, `rss-drafts` | 이미 deterministic하고 빠르다 |
| `auto-approve.sh`의 실제 API 호출부 | 외부 시스템 계약이 고정돼 있다 |
| TTS, FFmpeg, 렌더링, 자막 생성 | AI 판단보다 도구 실행 안정성이 중요하다 |

| Paperclip로 올릴 것 | 이유 |
| --- | --- |
| 편집 우선순위 판단 | 점수표 위의 맥락 판단이 필요하다 |
| 승인과 보류 관리 | 문자열 마커보다 구조화된 상태가 낫다 |
| 실패 복구와 운영 추적 | 런, 이슈, 비용, 이벤트 단위 추적이 필요하다 |
| 조직 확장 | 사람 병목을 역할 기반으로 쪼갤 수 있다 |

즉, 이상적인 최종형은 "셸 스크립트를 모두 버리는 것"이 아니라 "스크립트를 말단 실행기(tool)로 낮추고, 운영 제어는 Paperclip이 맡는 것"이다.

## 결론 및 권장 사항

현재 시점의 권장 사항은 극단적 전환이 아니라 단계적 승격이다.

첫째, 배치 파이프라인의 deterministic 코어는 유지하는 편이 맞다. `rss-fetch`, `rss-score`, `rss-drafts`, TTS, 렌더링, 실제 배포 API 호출은 이미 검증된 자산이고, 여기까지 Paperclip 안에서 새로 발명할 이유는 약하다.

둘째, 사람 판단이 들어가던 구간은 Paperclip로 올리는 편이 맞다. 큐레이션, 작가 퇴고, 승인 대기, 실패 복구, 비용 추적, 예산 차단은 배치 스크립트보다 제어면이 있는 시스템이 유리하다.

셋째, 운영 판단은 이렇게 가져가면 된다.

| 상황 | 권장 방식 |
| --- | --- |
| 반복적이고 규칙 기반인 작업 | ai-jobdori 스크립트 유지 |
| 맥락 판단이 필요한 작업 | Paperclip 에이전트로 승격 |
| 승인과 감사 추적이 필요한 작업 | Paperclip approval/issue 사용 |
| 비용 통제가 필요한 작업 | Paperclip budget/cost 계층 사용 |
| 막 출시한 신규 루틴 | 먼저 배치로 검증 후 Paperclip routine에 연결 |

마지막으로, 지금 단계에서 가장 현실적인 목표는 "ai-jobdori를 대체하는 것"이 아니라 "ai-jobdori를 Paperclip이 관리하는 회사의 실행 엔진으로 재배치하는 것"이다. 이 관점이면 두 시스템은 서로를 부정하지 않는다.

- ai-jobdori는 여전히 빠르고 단단한 생산 라인이다.
- Paperclip은 그 생산 라인 위에 책임, 비용, 승인, 복구, 조직을 얹는 운영 체계다.

운영 안정성만 보면 아직 ai-jobdori가 앞선다. 하지만 사람 병목 제거, 승인 추적, 비용 제어, 장기 확장성까지 포함하면 Paperclip을 얹을 이유는 충분하다.