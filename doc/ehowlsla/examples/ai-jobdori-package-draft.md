# 패키지 초안 — ai-jobdori

> **상태**: 제안
> **목적**: `ai-jobdori` 예시를 `agentcompanies/v1` 회사 패키지 초안으로 내린다.
> **대상 독자**: ai-jobdori를 Paperclip importable package로 만들고 싶은 사람
> **관련 문서**: [`ai-jobdori.md`](./ai-jobdori.md), [`../PACKAGE-DRAFTS.md`](../PACKAGE-DRAFTS.md), [`../TEMPLATE-SEEDS.md`](../TEMPLATE-SEEDS.md)
> **정합 기준**: [`../../../docs/companies/companies-spec.md`](../../../docs/companies/companies-spec.md), [`../../SPEC-implementation.md`](../../SPEC-implementation.md)

## 1. 이 초안의 목표

`ai-jobdori`는 현재 ehowlsla examples 중에서
가장 빨리 실제 회사 패키지로 추출하기 좋은 케이스다.

이 초안은:
- 어떤 파일 트리로 package를 만들지
- 어떤 역할/프로젝트/task를 starter로 넣을지
- 어떤 부분은 `.paperclip.yaml`로 내려야 할지

를 정리한다.

## 2. 제안 package tree

```text
jobdori-media/
├── COMPANY.md
├── README.md
├── agents/
│   ├── ceo/AGENTS.md
│   ├── curator/AGENTS.md
│   ├── writer/AGENTS.md
│   └── engineer/AGENTS.md
├── projects/
│   ├── daily-operations/PROJECT.md
│   │   └── tasks/
│   │       ├── daily-rss-intake/TASK.md
│   │       ├── weekly-review/TASK.md
│   │       └── publish-retry/TASK.md
│   └── content-improvement/PROJECT.md
├── tasks/
│   └── monthly-review/TASK.md
└── .paperclip.yaml
```

## 3. COMPANY.md에 들어갈 것

### 회사 이름
- `Jobdori Media`

### 회사 설명
- 반복되는 콘텐츠 수집/초안/게시 파이프라인 위에 판단, 검토, 승인, 복구를 얹는 콘텐츠 회사

### goals 예시
- 매일 콘텐츠 intake와 발행 후보 생산
- 게시 품질 유지
- 실패 복구와 재시도 운영

### 최소 frontmatter 스켈레톤

```yaml
name: Jobdori Media
description: Judgment layer on top of a deterministic content pipeline
slug: jobdori-media
schema: agentcompanies/v1
goals:
  - Produce daily publish candidates
  - Maintain publish quality
```

## 4. agents 매핑

### `agents/ceo/AGENTS.md`
- 편집장
- owner와만 직접 소통
- publish 기준과 우선순위 조정

### `agents/curator/AGENTS.md`
- 수집 결과 선별
- curation note 작성

### `agents/writer/AGENTS.md`
- draft package 정리
- publish candidate 초안 개선

### `agents/engineer/AGENTS.md`
- deterministic pipeline 유지
- 외부 큐/API/배포 경로 관리
- retry / recovery 지원

## 5. projects 매핑

### `projects/daily-operations/PROJECT.md`
- 일간 intake, 초안 생성, 게시 후보 판단, 재시도 운영

### `projects/content-improvement/PROJECT.md`
- 기준 개선, 패키지 형식 개선, 품질 향상 실험

핵심은:
두 프로젝트가 완전히 다른 팀이 아니라,
같은 회사 역할들이 목적에 따라 오가는 구조라는 점을 package body에도 적는 편이 좋다.

## 6. starter task / 루틴

### starter로 넣기 좋은 것
- `daily-rss-intake`
- `weekly-review`
- `publish-retry`
- `monthly-review`

### base package에서 설명할 것
- 어떤 task가 recurring 운영인지
- 어떤 task가 CEO review 성격인지

### `.paperclip.yaml`에서 보강할 것
- schedule fidelity
- timezone
- Paperclip routine import용 세부 설정

### 최소 task frontmatter 스켈레톤 예시

```yaml
name: Daily RSS Intake
project: daily-operations
assignee: curator
schedule:
  timezone: Asia/Seoul
  recurrence:
    frequency: daily
```

## 7. 실행 패킷 규약

이 draft는 아래 packet names를 기본 규약으로 본다.

- `source_brief`
- `curation_note`
- `draft_package`
- `review_note`
- `publish_candidate`
- `post_publish_summary`

이 규약은 base package README나 CEO AGENTS.md, 또는 별도 references 문서에 넣을 수 있다.

## 8. playbook / brief / 개인 지식 레이어

이 초안은 package 안에서도 3층 기억 구조를 유지하는 편이 좋다.

### 회사 공용 기억
- `README.md` 또는 `references/playbook.md`
- publish 기준
- review checklist
- packet naming 규약

### 프로젝트 전용 기억
- 각 `PROJECT.md` body
- 필요하면 `references/daily-operations-brief.md` 같은 문서

### 에이전트 개인 지식
- 각 `AGENTS.md` body의 working style
- vendor-specific한 부분은 `.paperclip.yaml` 또는 runtime 쪽에서 보강

## 9. `.paperclip.yaml`에 둘 것

### 넣어야 하는 것
- adapter 선택
- env input declaration
- recurring task fidelity
- 필요 시 workspace/runtime fidelity

### 넣으면 안 되는 것
- 실제 secret 값
- machine-local 절대 경로
- 운영 서버의 실제 민감 endpoint 값

## 10. 첫 커스터마이징 포인트

가져온 사람이 제일 먼저 바꿔야 할 것:

- RSS / queue / publish 관련 외부 경로
- admin approval API 주소
- Kakao 보고 경로
- cron / timezone
- publish 기준과 review 기준
- owner-facing packet 이름/요약 형식

## 11. 그대로 재사용하기 좋은 것

- CEO + curator + writer + engineer 구조
- deterministic pipeline + judgment layer 구조
- publish candidate 중심 packet 모델
- review / retry 운영 루틴의 뼈대

## 12. 현재 판단

`ai-jobdori`는
**ehowlsla 예시 중 가장 먼저 importable draft package로 굳혀볼 수 있는 후보**다.
