# ehowlsla 브랜치 작업 이력

> **상태**: 운영 기록
> **목적**: `claw` 호스트 기준 배포/운영/검증 이력을 날짜순으로 남긴다.
> **대상 독자**: 특정 시점의 실제 운영 상태를 확인해야 하는 독자
> **관련 문서**: [`../README.md`](../README.md), [`../STRATEGY.md`](../STRATEGY.md), [`claw-deployment.md`](./claw-deployment.md)
> **정합 기준**: [`../../DEVELOPING.md`](../../DEVELOPING.md), [`../../DEPLOYMENT-MODES.md`](../../DEPLOYMENT-MODES.md)


이 문서는 `ehowlsla` 브랜치에서 진행한 Paperclip 배포 및 운영 설정 이력을 날짜순으로 정리한 운영 기록이다. 전략 방향은 [../STRATEGY.md](../STRATEGY.md), 배포 절차는 [claw-deployment.md](./claw-deployment.md), 조직 설계는 [../AI-COMPANY.md](../AI-COMPANY.md)를 기준으로 한다.

보안 원칙:

- 실제 시크릿, API 키, 토큰 값은 이 문서에 기록하지 않는다.
- 식별이 필요한 값은 UUID, routine ID, 경로, 공개 엔드포인트 수준까지만 남긴다.

## 공통 배포 정보

| 항목 | 값 | 현재 상태 |
| --- | --- | --- |
| 브랜치 | `ehowlsla` | 운영 문서화 완료 |
| 서버 | `http://claw:3100` | 접근 대상 고정 |
| 바인드 | `0.0.0.0:3100` | 적용됨 |
| 배포 모드 | `authenticated` | 적용됨 |
| API 기본 경로 | `http://claw:3100/api` | 사용 중 |
| 회사 ID | `0d5b6500-10b6-49e8-9daf-18841308e2e3` | 생성 완료 |
| 회사 prefix | `JOB` | 적용됨 |
| Board API key | `pcp_board_...` | 발급됨, 문서에는 마스킹 |
| Node | `v22.22.0` via `fnm` | 설치 및 경로 설정 완료 |
| DB | Embedded PostgreSQL | 실행 중 |
| DB 포트 | `54329` | 사용 중 |

## 2026-04-02 Phase 0: 회사/에이전트 초기 구성

### 수행 내용

- Paperclip 인스턴스 `http://claw:3100`에 `JOB` prefix 회사 생성
- 기본 4인 조직 구조에 맞춰 에이전트 4명 생성
- 각 에이전트 지침을 `SSH/SCP`로 `claw` 서버에 배포
- 배포 대상은 `ai-jobdori` 운영 구조를 Paperclip 위에서 재구성하는 방향으로 정렬

### 에이전트 등록 내역

| 이름 | 역할 | 설명 | 에이전트 ID | 현재 상태 |
| --- | --- | --- | --- | --- |
| 편집장 | CEO, Editor-in-Chief | 방향 설정, 승인 기준 관리 | `e6af2bae-fb6a-467e-9f9e-2db35d0cad29` | 생성 완료, 지침 배포 완료 |
| 큐레이터 | Researcher | RSS 평가, 큐레이션 | `72b2ca21-8f4c-440a-aa60-7907e90de8f9` | 생성 완료, 이후 활성화 검증 완료 |
| 작가 | Writer | 한국어 제목, 훅, 해설 작성 | `9a1306ca-1c25-4f7e-8810-ae055a5d69ee` | 생성 완료, 런타임 설정 완료 |
| 엔지니어 | DevOps | 파이프라인 실행, 복구, 배포 자동화 | `6d161029-1736-4b70-b210-86ff1b867eb0` | 생성 완료, 이후 E2E 검증 완료 |

### Phase 0 결과

| 구성 요소 | 결과 | 비고 |
| --- | --- | --- |
| 회사 레벨 스코프 | 완료 | 모든 후속 프로젝트/이슈/Routine의 기준 회사 생성 |
| 조직도 초기화 | 완료 | `편집장 -> 큐레이터/작가/엔지니어` 구조 준비 |
| Agent Instructions 배포 | 완료 | 서버 측 반영 완료 |
| 운영 준비도 | 기본 준비 완료 | 실제 자동화는 Phase 1에서 연결 |

## 2026-04-02 \~ 2026-04-03 Phase 1: 프로젝트/루틴/실행 환경 연결

### 수행 내용

- 운영 프로젝트 `Daily Operations` 생성
- cron 기반 Routine 5개 등록
- `claw` 서버에 Claude Code CLI 설치
- `fnm` 기반 Node 경로를 모든 에이전트에서 공통 사용하도록 정리
- `ai-jobdori` 작업 디렉터리를 서버에 동기화하고 엔지니어의 `cwd`를 고정
- `jobdori-pipeline` 어댑터 스캐폴드를 저장소에 생성
- 4개 에이전트 모두 `dangerouslySkipPermissions` 활성화
- 4개 에이전트 모두 heartbeat 활성화
- 엔지니어 에이전트로 `daily-rss-intake` E2E 1회 성공 검증

### 프로젝트 등록 내역

| 항목 | 값 | 현재 상태 |
| --- | --- | --- |
| 프로젝트명 | `Daily Operations` | 생성 완료 |
| 프로젝트 ID | `fc10fbc9-edb4-47f6-aa7c-034bff916144` | 운영 기준 프로젝트로 사용 |
| 용도 | 일일/주간/월간 운영 루틴 수용 | 활성 |

### Routine 등록 내역

| Routine | ID | cron | 타임존 | 현재 상태 |
| --- | --- | --- | --- | --- |
| `daily-rss-intake` | `63a9a651` | `0 7 * * *` | `Asia/Seoul` | 등록 완료, E2E 성공 기록 있음 |
| `weekly-review` | `44f0bb8f` | `0 9 * * 1` | `Asia/Seoul` | 등록 완료, 대기 |
| `monthly-review` | `00f1640e` | `0 9 1 * *` | `Asia/Seoul` | 등록 완료, 대기 |
| `auto-approval-sweeper` | `479cebea` | `*/10 * * * *` | `Asia/Seoul` | 등록 완료, 대기 |
| `publish-retry` | `a1c40fa1` | `*/30 * * * *` | `Asia/Seoul` | 등록 완료, 대기 |

### 실행 환경 및 도구 설정

| 항목 | 값 | 현재 상태 |
| --- | --- | --- |
| Claude Code CLI | `v2.1.90` | 설치 완료 |
| Node 런타임 | `v22.22.0` via `fnm` | 모든 에이전트 PATH 반영 완료 |
| 엔지니어 작업 경로 | `/Users/ehowlsla/ai-jobdori` | 고정 완료 |
| `ai-jobdori` 동기화 | `~/ai-jobdori`로 `rsync` | 완료 |
| 권한 우회 옵션 | `dangerouslySkipPermissions` | 4개 에이전트 모두 활성 |
| heartbeat | 활성 | 4개 에이전트 모두 활성 |

### 커스텀 어댑터 작업

| 항목 | 값 | 현재 상태 |
| --- | --- | --- |
| 어댑터 이름 | `jobdori-pipeline` | 스캐폴드 생성 완료 |
| 위치 | `packages/adapters/jobdori-pipeline/` | 저장소 반영됨 |
| 파일 수 | 7 files | 생성 완료 |
| 타입스크립트 검증 | `tsc pass` | 통과 |
| 목적 | `ai-jobdori` 파이프라인과 Paperclip 실행 모델 연결 | 후속 구현 기반 확보 |

### Phase 1 검증 기록

| 항목 | 결과 | 현재 상태 |
| --- | --- | --- |
| 실행 주체 | 엔지니어 에이전트 | 검증 완료 |
| 대상 Routine | `daily-rss-intake` | 검증 완료 |
| 실행 결과 | 성공 | 기록 확인됨 |
| 소요 | 20 turns | 참고값 |
| 비용 | `$0.60` | 참고값 |

### Phase 1 결과

| 구성 요소 | 결과 | 비고 |
| --- | --- | --- |
| 스케줄러 연결 | 완료 | 주요 운영 루틴 5개 등록 |
| 로컬 실행 환경 | 완료 | CLI, PATH, 작업 경로 반영 |
| 에이전트 실행 옵션 | 완료 | heartbeat + 권한 우회 적용 |
| 파이프라인 검증 | 부분 완료 | `daily-rss-intake` 실증 완료 |

## 2026-04-03 Phase 2: 큐레이터 활성화 및 운영 상태 정리

### 수행 내용

- 큐레이터 에이전트 활성화
- RSS 평가 이슈를 사용해 큐레이터 동작 검증
- 모든 에이전트의 `dangerouslySkipPermissions` + heartbeat 설정 상태를 재확인

### 검증 기록

| 항목 | 값 | 현재 상태 |
| --- | --- | --- |
| 검증 대상 에이전트 | 큐레이터 | 활성화 및 테스트 완료 |
| 검증 이슈 | `JOB-23` | 사용됨 |
| 검증 유형 | RSS evaluation issue 처리 | 성공 기록 있음 |
| 설정 재확인 | `dangerouslySkipPermissions`, heartbeat | 4개 에이전트 모두 적용 상태 확인 |

### Phase 2 결과

| 구성 요소 | 결과 | 비고 |
| --- | --- | --- |
| 큐레이터 실행성 | 확인됨 | 실전 이슈 기반 검증 완료 |
| 에이전트 공통 설정 | 정리 완료 | 설정 편차 없음 |
| 운영 준비도 | 상승 | 최소 2개 에이전트 실전 검증 확보 |

## 현재 구성 상태 요약

### 회사/프로젝트

| 구성 요소 | 식별자 | 상태 |
| --- | --- | --- |
| 회사 | `0d5b6500-10b6-49e8-9daf-18841308e2e3` | 활성 |
| 프로젝트 `Daily Operations` | `fc10fbc9-edb4-47f6-aa7c-034bff916144` | 활성 |

### 에이전트 상태

| 에이전트 | ID | heartbeat | 권한 우회 | 검증 상태 | 현재 판단 |
| --- | --- | --- | --- | --- | --- |
| 편집장 | `e6af2bae-fb6a-467e-9f9e-2db35d0cad29` | 활성 | 활성 | 개별 실행 검증 기록 없음 | 운영 준비 완료 |
| 큐레이터 | `72b2ca21-8f4c-440a-aa60-7907e90de8f9` | 활성 | 활성 | `JOB-23` 검증 완료 | 활성 운영 가능 |
| 작가 | `9a1306ca-1c25-4f7e-8810-ae055a5d69ee` | 활성 | 활성 | 개별 실행 검증 기록 없음 | 설정 완료, 추가 검증 필요 |
| 엔지니어 | `6d161029-1736-4b70-b210-86ff1b867eb0` | 활성 | 활성 | `daily-rss-intake` 검증 완료 | 활성 운영 가능 |

### Routine 상태

| Routine | ID | 상태 판단 |
| --- | --- | --- |
| `daily-rss-intake` | `63a9a651` | 등록 및 실전 실행 확인 |
| `weekly-review` | `44f0bb8f` | 등록 완료, 정기 실행 대기 |
| `monthly-review` | `00f1640e` | 등록 완료, 정기 실행 대기 |
| `auto-approval-sweeper` | `479cebea` | 등록 완료, 정기 실행 대기 |
| `publish-retry` | `a1c40fa1` | 등록 완료, 정기 실행 대기 |

### 인프라 상태

| 항목 | 상태 판단 | 메모 |
| --- | --- | --- |
| Paperclip 서버 | 실행 중 기준으로 문서화 | `http://claw:3100` |
| 인증 모드 | 활성 | `authenticated` |
| API 접근 | 사용 가능 전제 | `/api` 기준 |
| Node/fnm 환경 | 준비 완료 | `v22.22.0` |
| Embedded PostgreSQL | 사용 중 | `54329` |
| Board 키 | 발급 완료 | 문서에는 마스킹 유지 |

## 남은 확인 포인트

- 편집장 개별 heartbeat 실전 검증 기록은 아직 이 문서 기준으로 확인되지 않았다.
- 작가 개별 산출물 생성 검증 기록은 아직 이 문서 기준으로 확인되지 않았다.
- `weekly-review`, `monthly-review`, `auto-approval-sweeper`, `publish-retry`는 등록은 끝났지만 별도 실행 성공 기록은 추가 축적이 필요하다.

## 문서 작성 기준 시점

- 기준 시점: `2026-04-03`
- 출처: `doc/ehowlsla/*.md` 문서 맥락 + 운영자가 제공한 실제 작업 이력
- 보안 처리: 시크릿과 API 키는 전부 비공개 처리