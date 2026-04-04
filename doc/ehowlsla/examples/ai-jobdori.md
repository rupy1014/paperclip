# 예시 — ai-jobdori

> **상태**: 예시
> **목적**: `ai-jobdori`를 `ehowlsla` overlay 관점에서 어떻게 운영 모델에 대입할 수 있는지 보여준다.
> **대상 독자**: 콘텐츠 파이프라인형 프로젝트를 Paperclip 회사로 해석하려는 독자
> **관련 문서**: [`../README.md`](../README.md), [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md), [`../ORCHESTRATION-PATTERNS.md`](../ORCHESTRATION-PATTERNS.md)


이 문서는 `ai-jobdori`를 Paperclip 회사로 어떻게 설정하고 운영할 수 있는지에 대한 예시다.

## 프로젝트 성격

`ai-jobdori`는 **매일 반복되는 deterministic 콘텐츠 파이프라인 위에 판단 계층을 얹는 콘텐츠 회사**에 가깝다.

실제 자산:
- `rss:all = rss-fetch -> rss-score -> rss-drafts`
- `daily-pipeline.sh`
- `[퇴고 필요]` 기반 `auto-approve.sh`
- digest 배포
- Kakao 보고

즉 이 프로젝트는 처음부터 “모든 걸 에이전트가 직접 만든다”가 아니라,
이미 있는 스크립트 위에 판단·승인·복구를 얹는 방향이 맞다.

## 기준 모델 대응

- 내부 실행 단위: **실행 패킷(production packet)**
- 오너가 판단하는 결과물: **결과물 묶음(deliverable bundle)**
- 기준 actor: `board`, overlay UX 호칭: `owner`

## 추천 회사 설정

### 회사
- 이름: `JOB` 또는 `Jobdori Media`

### 역할
- 편집장(CEO)
- 큐레이터
- 작가
- 엔지니어

### 프로젝트
- `Daily Operations`
- 필요 시 `Content Improvement`

같은 회사 안에서 이 두 프로젝트는 완전히 분리된 팀이라기보다,
같은 편집장/큐레이터/작가/엔지니어가 운영 목적에 따라 오가는 구조로 보는 편이 자연스럽다.
`Daily Operations`에서 잘 먹힌 draft_package 형식이나 publish 판단 기준은
`Content Improvement`에도 재사용될 수 있다.

### 운영 루틴
- `daily-rss-intake`
- `weekly-review`
- `monthly-review`
- `auto-approval-sweeper`
- `publish-retry`

## 추천 실행 패킷 / 결과물 묶음

- `source_brief`
- `curation_note`
- `draft_package`
- `review_note`
- `publish_candidate`
- `post_publish_summary`

내부 실행 단위는 **실행 패킷**으로 보고,
오너가 판단하는 결과물 묶음은 **결과물 묶음**으로 보는 편이 자연스럽다.

즉 발행 후보 하나를:
**issue + documents + work-products 묶음**으로 다루는 것이 현실적이다.

## 런타임 연결 방식

### 추천 기본값
- 같은 머신 또는 같은 사설망에서 process/local CLI 방식으로 실행
- 기존 `npm run rss:all`, cron shell script, 배포 스크립트는 그대로 도구 실행 단계로 유지
- 산출물과 실패 상태만 Paperclip issue/run/documents에 귀속

### 외부 의존성 메모
- `THREADS_QUEUE_DIR`
- `www.max5.ai` 쪽 admin 승인 API
- Kakao 보고 스크립트
- cron shell script의 고정 경로/환경변수

즉 이 프로젝트는 저장소 하나만으로 닫힌 시스템이 아니라,
기존 외부 큐/배포/API 자산과 함께 돌아간다.

## 오너 루프

오너는 보통:
- 오늘 무엇을 밀고 있는가
- draft가 충분히 괜찮은가
- 게시해도 되는가
- 비용/리스크/실패가 있는가

만 보고,
기본적으로는 **편집장에게만 피드백**하면 된다.

## 짧은 운영 trace 예시

1. `daily-rss-intake` 운영 루틴이 실행된다.
2. 실제로는 `daily-pipeline.sh` 또는 동등한 도구 실행 단계가 돈다.
3. RSS 초안/뉴스 초안이 생성되고, draft_package가 실행 패킷의 문서/산출물로 귀속된다.
4. 편집장 또는 내부 품질 검토 루프에서 게시 후보를 판단한다.
5. 필요한 경우 승인(approval)을 거쳐 `publish_candidate`가 확정된다.
6. 최종 게시 결과와 실패/재시도 상태가 `post_publish_summary`로 남는다.

## 지금 가능한 것

- 회사 생성
- 4인 조직 구성
- 운영 루틴 연결
- issue 기반 handoff
- live run 관찰
- 실패 복구 / 재큐잉
- 게시 승인 같은 고위험 approval
- 운영 노하우를 같은 회사 안의 다른 프로젝트에 재사용

즉 `ai-jobdori`는 지금 컨셉으로도 **가장 현실적으로 잘 시뮬레이션되는 케이스**다.

## 부족한 점

### P0
- CEO 브리핑 뷰
- 결과물 묶음 UI

### P1
- queue work 규칙 UX
- 발행 후보 결과물 묶음 카드

## 템플릿 시드로 옮길 때의 매핑

`ai-jobdori`는 현재 examples 중에서
가장 빠르게 importable company package로 굳힐 수 있는 편이다.

실제 패키지 트리 초안은 [`ai-jobdori-package-draft.md`](./ai-jobdori-package-draft.md)를 본다.

### package로 옮길 때의 기본 매핑
- 회사 설명 → `COMPANY.md`
- 편집장 / 큐레이터 / 작가 / 엔지니어 → `agents/*/AGENTS.md`
- `Daily Operations`, `Content Improvement` → `projects/*/PROJECT.md`
- `daily-rss-intake`, `weekly-review`, `publish-retry` → starter `TASK.md` 또는 recurring routine
- 외부 큐/API/경로 메모 → `.paperclip.yaml` + README

### 처음 가져와서 제일 먼저 고칠 것
- RSS / queue / publish 관련 외부 경로
- 승인 API 주소와 인증 방식
- cron / schedule 시간대
- 편집장의 publish 기준
- 오너가 직접 볼 packet 이름과 요약 형식

### 그대로 재사용하기 좋은 것
- 4인 역할 구조
- deterministic pipeline + 판단 계층 구조
- `publish_candidate` 중심 패킷 구조
- retry / review 루틴 뼈대
