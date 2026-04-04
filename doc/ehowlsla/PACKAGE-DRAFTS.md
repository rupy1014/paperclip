# 패키지 초안 가이드

> **상태**: 제안
> **목적**: `examples/` 문서를 실제 `agentcompanies/v1` 패키지 초안으로 내릴 때의 공통 기준을 정리한다.
> **대상 독자**: ehowlsla 예시 문서를 importable company package로 발전시키려는 사람
> **관련 문서**: [`TEMPLATE-SEEDS.md`](./TEMPLATE-SEEDS.md), [`AI-COMPANY.md`](./AI-COMPANY.md), [`examples/README.md`](./examples/README.md)
> **정합 기준**: [`../../docs/companies/companies-spec.md`](../../docs/companies/companies-spec.md), [`../SPEC-implementation.md`](../SPEC-implementation.md)

이 문서는 `ehowlsla` 예시 문서를 실제 회사 패키지 초안으로 바꿀 때의 공통 규칙을 정리한다.

핵심은 이거다.

> `examples/*`는 지금 당장 import하는 완성 템플릿이 아니라,
> **나중에 importable company package로 추출할 수 있는 설계 초안**
> 으로 관리한다.

## 1. 왜 초안이 필요한가

문서에서 곧바로 완성 템플릿으로 점프하면 보통 두 가지 문제가 생긴다.

1. 도메인 특수사항이 너무 빨리 굳는다.
2. 로컬 경로, 외부 API, 개인 취향 같은 비이식 요소가 섞인다.

그래서 ehowlsla에서는 아래 순서를 기본으로 둔다.

```text
개념 문서
  → 예시 문서
    → 템플릿 시드
      → 패키지 초안
        → importable company package
```

## 2. 패키지 초안(package draft)이 포함해야 할 것

각 초안은 최소한 아래를 포함해야 한다.

### 1) 패키지 트리
- 어떤 파일/폴더가 생길지

### 2) 루트 메타데이터
- `COMPANY.md`에 어떤 목표와 설명이 들어갈지

### 3) agent roster
- 어떤 역할이 `agents/*/AGENTS.md`로 분리될지

### 4) 프로젝트 매핑
- 어떤 프로젝트가 `projects/*/PROJECT.md`가 될지

### 5) 시작 task / 루틴
- 어떤 recurring 운영이 `TASK.md` 또는 routine fidelity로 옮겨질지

### 6) `.paperclip.yaml` 범위
- adapter, env input, runtime/workspace, external dependency 중 무엇이 vendor extension에 남을지

### 7) first customization points
- 가져온 사람이 제일 먼저 바꿔야 할 것

## 3. base package와 `.paperclip.yaml`을 나누는 기준

### base package에 둘 것
- 회사 목적
- 역할 구조
- 프로젝트 구조
- 시작 workflow
- portable packet 규약
- 사람이 읽는 operating instructions

### `.paperclip.yaml`에 둘 것
- adapter type/config
- runtime/workspace fidelity
- env input declarations
- local path / repo binding / portability remap용 정보
- recurring task fidelity가 base package만으로 충분하지 않을 때의 보조 정보

핵심은:
**portable한 것은 markdown package에, Paperclip 특화 fidelity는 `.paperclip.yaml`에 둔다.**

## 4. 초안에서 일부러 빼야 할 것

아래는 package draft에서 의도적으로 비워두거나 placeholder로 두는 편이 좋다.

- 실제 secret 값
- machine-local 절대 경로
- 실제 production API endpoint 값
- 개인 private repo URL
- 개인 취향이 강한 prompt 장문
- 아직 검증되지 않은 강한 workflow 강제

## 5. ehowlsla overlay를 package draft에 반영하는 법

일반 spec 예시만으로는 ehowlsla의 핵심이 빠진다.
draft에는 아래 원칙이 같이 들어가야 한다.

- owner는 기본적으로 CEO와만 소통
- review / approval는 optional gate
- 실행 패킷 중심 판단
- 회사 공용 기억 / 프로젝트 전용 기억 / 개인 지식 분리
- deterministic toolchain을 agent 판단 계층 아래에 둠

즉 package draft는 단순 파일 트리 설명이 아니라,
**ehowlsla 운영 철학이 들어간 패키지 설계도**여야 한다.

### 최소 문서 배치 예시

- 회사 공용 기억 → `README.md` 또는 `references/playbook.md`
- 프로젝트 전용 기억 → 각 `PROJECT.md` body 또는 `references/*-brief.md`
- 에이전트 개인 지식 → 각 `AGENTS.md` body

## 6. 초안 완성 기준

다음 질문에 답할 수 있으면 draft로 충분하다.

1. 이 회사를 어떤 구조로 import하게 될까?
2. 어떤 역할 파일이 필요할까?
3. 어떤 프로젝트를 기본 포함할까?
4. 어떤 task/routine를 starter로 줄까?
5. 어떤 부분은 꼭 사용자가 수정해야 할까?
6. 어떤 부분은 그대로 재사용 가능한가?

## 7. examples와의 연결

프로젝트별 package draft는 아래 문서를 본다.

- [`examples/ai-jobdori-package-draft.md`](./examples/ai-jobdori-package-draft.md)
- [`examples/rovel-ai2-package-draft.md`](./examples/rovel-ai2-package-draft.md)

## 8. 한 줄 결론

ehowlsla에서 package draft는
**“문서에서 바로 importable package로 가기 전의 마지막 설계층”**
으로 관리하는 것이 맞다.
