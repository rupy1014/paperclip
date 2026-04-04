# 패키지 초안 — rovel.ai2

> **상태**: 제안
> **목적**: `rovel.ai2` 예시를 `agentcompanies/v1` 회사 패키지 초안으로 내린다.
> **대상 독자**: rovel.ai2형 스튜디오 회사를 Paperclip package로 설계하려는 사람
> **관련 문서**: [`rovel-ai2.md`](./rovel-ai2.md), [`../PACKAGE-DRAFTS.md`](../PACKAGE-DRAFTS.md), [`../TEMPLATE-SEEDS.md`](../TEMPLATE-SEEDS.md)
> **정합 기준**: [`../../../docs/companies/companies-spec.md`](../../../docs/companies/companies-spec.md), [`../../SPEC-implementation.md`](../../SPEC-implementation.md)

## 1. 이 초안의 목표

`rovel.ai2`는 더 강력한 템플릿 시드지만,
`ai-jobdori`보다 packet 규약과 프로젝트 경계가 더 중요하다.

이 초안은:
- 어떤 최소 회사 패키지 구조가 맞는지
- 어떤 프로젝트를 starter로 둘지
- 어떤 규칙은 base package에, 어떤 것은 `.paperclip.yaml`에 둘지

를 정리한다.

## 2. 제안 package tree

```text
rovel-studio/
├── COMPANY.md
├── README.md
├── agents/
│   ├── ceo/AGENTS.md
│   ├── story-lead/AGENTS.md
│   ├── casting-asset-lead/AGENTS.md
│   ├── vn-production-lead/AGENTS.md
│   ├── qa-release-lead/AGENTS.md
│   └── platform-engineer/AGENTS.md
├── projects/
│   ├── platform-studio-ops/PROJECT.md
│   └── works-in-production/PROJECT.md
│       └── tasks/
│           ├── weekly-production-review/TASK.md
│           ├── release-review/TASK.md
│           └── editor-pick-promotion/TASK.md
└── .paperclip.yaml
```

## 3. COMPANY.md에 들어갈 것

### 회사 이름
- `Rovel Studio`

### 회사 설명
- 읽기 중심 콘텐츠 제품 위에 작품 승격, 패킷 제작, release 판단을 운영하는 스튜디오형 회사

### goals 예시
- 작품 intake와 production 후보 선별
- editor-pick 작품의 패킷 생산
- 안정적인 release 판단과 QA

### 최소 frontmatter 스켈레톤

```yaml
name: Rovel Studio
description: Studio company that promotes selected works into production packets
slug: rovel-studio
schema: agentcompanies/v1
goals:
  - Promote editor-pick works into production
  - Produce release candidates with QA
```

## 4. agents 매핑

### `agents/ceo/AGENTS.md`
- Executive Producer
- owner와 직접 소통
- 작품 승격과 release 우선순위 조정

### `agents/story-lead/AGENTS.md`
- source / adaptation brief 정리

### `agents/casting-asset-lead/AGENTS.md`
- casting package / asset package 구성

### `agents/vn-production-lead/AGENTS.md`
- vn package와 preview 정리

### `agents/qa-release-lead/AGENTS.md`
- release candidate 점검
- optional review gate 관리

### `agents/platform-engineer/AGENTS.md`
- repo/runtime/worker/build 경로 관리

## 5. projects 매핑

### `projects/platform-studio-ops/PROJECT.md`
- 제품/플랫폼/런타임 운영
- worker, build, deploy, infra 성격

### `projects/works-in-production/PROJECT.md`
- 작품 단위 패킷 운영
- top-level issue를 작품별 production packet의 대표 단위로 사용하는 가이드 포함

중요:
모든 작품을 별도 프로젝트로 강제하지 않고,
초기에는 `Works in Production` 아래에 패킷 단위로 운영하는 편이 더 현실적이다.

## 6. starter task / 루틴

### starter로 넣기 좋은 것
- `weekly-production-review`
- `release-review`
- `editor-pick-promotion`

### base package에서 설명할 것
- editor-pick 작품만 deep production으로 보낸다는 원칙
- 작품별 패킷이 release candidate까지 어떻게 올라오는지

### `.paperclip.yaml`에서 보강할 것
- schedule fidelity
- worker/runtime binding
- workspace/runtime service override

### 최소 task frontmatter 스켈레톤 예시

```yaml
name: Weekly Production Review
project: works-in-production
assignee: ceo
schedule:
  timezone: Asia/Seoul
  recurrence:
    frequency: weekly
```

## 7. 실행 패킷 규약

이 draft는 아래 reserved packet keys를 기본 규약으로 본다.

- `source`
- `adaptation_brief`
- `casting_package`
- `asset_package`
- `vn_package`
- `release_candidate`

핵심은:
작품 하나를 별도 `Work` 객체로 새로 만들기보다
**top-level issue + reserved docs + work-products**로 우선 모델링하는 것이다.

## 8. playbook / brief / 개인 지식 레이어

이 초안도 package 안에서 3층 기억 구조를 명시하는 편이 좋다.

### 회사 공용 기억
- `README.md` 또는 `references/playbook.md`
- editor-pick 승격 기준
- packet 규약
- release checklist

### 프로젝트 전용 기억
- 각 `PROJECT.md` body
- 필요하면 `references/works-in-production-brief.md`
- 작품별 패킷 규칙은 import 후 운영 문서에서 확장

### 에이전트 개인 지식
- 각 `AGENTS.md` body의 working style
- tool/runtime 숙련도는 vendor-specific layer에서 보강

## 9. `.paperclip.yaml`에 둘 것

### 넣어야 하는 것
- adapter/runtime 선택
- workspace / repo binding
- worker command / runtime service fidelity
- env input declaration

### 넣으면 안 되는 것
- 실제 secret 값
- 개인 로컬 절대 경로
- production 민감 endpoint
- 너무 세부적인 작품별 임시 규칙

## 10. 첫 커스터마이징 포인트

가져온 사람이 제일 먼저 바꿔야 할 것:

- editor-pick 승격 기준
- repo/workspace/runtime 경로
- asset 생성/저장 위치
- preview/release 판단 기준
- 작품별 reserved key naming

## 11. 그대로 재사용하기 좋은 것

- CEO-only owner communication
- 작품을 packet 단위로 다루는 모델
- role 분업 구조
- editor-pick만 deep production으로 보내는 운영 원칙

## 12. 현재 판단

`rovel.ai2`는
**더 강력하지만 더 많은 규약 정리가 필요한 패키지 초안 후보**다.
즉 바로 배포형 템플릿보다는,
packet/brief/playbook 규약을 먼저 다듬으면서 가져가는 편이 맞다.
