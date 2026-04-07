# ehowlsla 브랜치 전략

> **상태**: 제안
> **목적**: `ehowlsla` overlay가 무엇을 검증하는지, 그리고 이 문서군을 어떤 계층으로 읽어야 하는지 정리한다.
> **대상 독자**: `ehowlsla` 방향성을 먼저 파악해야 하는 독자
> **관련 문서**: [`README.md`](./README.md), [`CONCEPT-MAP.md`](./CONCEPT-MAP.md), [`BACKLOG.md`](./BACKLOG.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md), [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md)


`ehowlsla` 브랜치는 **Paperclip을 실제 프로젝트 운영에 쓸 수 있는 개인용 AI 회사 운영 제어면**으로 검증하는 브랜치다.

이 문서군은 upstream Paperclip을 대체하는 spec이 아니라,
**기준 루트 문서 위에 얹는 운영 해석 레이어**로 읽는 편이 맞다.

핵심 목표는 세 가지다.

1. Paperclip을 단순 agent dashboard가 아니라 **회사 운영 계층**으로 정리한다.
2. 실제 프로젝트를 넣고 시뮬레이션하면서 무엇이 잘 맞고 부족한지 확인한다.
3. 그 결과를 기능 아이디어가 아니라 **운영 패턴 / 제품 표면 / backlog**로 정리한다.

## 기본 방향

### 1. 범용 문서와 예시 문서를 분리한다

- 루트 문서는 범용 원칙과 브랜치 방향을 다룬다.
- 프로젝트별 적용 예시는 `examples/` 아래에서 다룬다.

즉:
- 범용 문서 = 누구에게나 적용되는 원칙
- 예시 문서 = 특정 프로젝트에 어떻게 대입되는가

### 2. Paperclip은 control plane에 집중한다

이 브랜치에서 Paperclip은 다음을 잘해야 한다.

- 회사 구조
- 회사 공용 운영 기억
- 역할과 위임
- 운영 루틴
- 결과물 묶음(deliverable bundle)
- 품질 검토와 승인
- 복구와 추적
- 비용 / 리스크 / 오너 피드백 루프
- 산출물 가정 추적과 검증
- 실행 결과 → 전략 수정 자동 루프

반대로 다음은 Paperclip이 직접 다 하려 하면 안 된다.

- 도메인 앱 자체 구현
- 모든 생성/변환 알고리즘 흡수
- 모든 스크립트/도구 대체

### 3. 오너는 기본적으로 CEO와만 소통한다

이 브랜치의 기본 운영 모델은:
- 오너 ↔ CEO
- CEO ↔ 실무 역할

이다.

여기서 `오너`는 기준 권한 주체인 `board`를 solo-operator UX 관점에서 다시 부르는 표현이다.
즉 권한 모델을 바꾸는 게 아니라, **기본 인터페이스와 운영 동선**을 재정렬하는 제안에 가깝다.

오너가 실무자 전원과 직접 계속 대화하는 구조는 기본값으로 두지 않는다.

### 4. 하나의 회사가 여러 프로젝트를 유기적으로 수행할 수 있어야 한다

이 브랜치에서 기본으로 상정하는 것은:
- 회사 = 역할과 운영 기억을 가진 조직
- 프로젝트 = 그 조직이 수행하는 개별 제품 / 작품 / 운영 라인

즉 같은 회사의 에이전트가 여러 프로젝트를 오가며 일할 수 있어야 한다.

중요한 점은,
프로젝트 A의 노하우가 프로젝트 B에 **자동으로 전이되는 것**보다
CEO가 좋은 운영 방식을 회사 공용 지침, 실행 패킷(production packet) 규약, 반복 운영 규칙, playbook으로 승격시켜
다음 프로젝트에 재사용할 수 있어야 한다는 것이다.

### 5. agent 산출물의 가정은 명시적으로 추적한다

agent가 전략, 예산, 시장 관련 산출물을 만들 때,
그 안에 포함된 가정(assumption)은 confidence level과 검증 방법을 명시해야 한다.

이유는 단순하다.
**오너가 "이 숫자/판단이 검증된 것인지 추정인지" 구분할 수 없으면 좋은 판단을 내릴 수 없다.**

가정 레지스트리(assumption registry)는 전략/예산 산출물에만 적용하며,
CEO가 의사결정 패키지를 올릴 때 미검증 가정 요약을 포함한다.

### 6. 실행 결과는 전략에 자동으로 피드백되어야 한다

agent가 전략을 세우고, 실행하고, 끝.
이 구조에서는 틀린 가정이 수정 없이 반복된다.

따라서 실행 결과가 기대와 크게 다를 때(threshold 초과)
자동으로 회고(retrospective) 이슈를 생성하고,
그 학습이 프로젝트 규약 또는 회사 playbook에 반영되는 루프가 필요하다.

이것은 "자동 학습"이 아니라,
**실행 데이터가 전략 재검토의 트리거가 되는 구조**다.

### 7. review / approval는 항상 강제하지 않는다

- `review`는 품질 검토
- `approval`는 거버넌스 결정

둘 다 중요하지만 모든 작업에 강제하면 오히려 오너 피로만 커진다.
따라서 필요한 경우에만 선택적으로 켜는 구조를 기본값으로 본다.

## 이 문서군을 읽는 법

루트 인덱스와 전체 읽기 순서는 [`README.md`](./README.md)를 본다.
핵심 개념 매핑은 [`CONCEPT-MAP.md`](./CONCEPT-MAP.md)를 먼저 보면 좋다.

### 개념 / 모델 문서
- [`AI-COMPANY.md`](./AI-COMPANY.md) — 역할/책임 모델
- [`ORCHESTRATION-PATTERNS.md`](./ORCHESTRATION-PATTERNS.md) — 운영 패턴/lifecycle
- [`MEMORY-SURFACES.md`](./MEMORY-SURFACES.md) — 회사 공용 플레이북 / 프로젝트 브리프 / 에이전트 작업 방식 표면
- [`TEMPLATE-SEEDS.md`](./TEMPLATE-SEEDS.md) — examples를 템플릿 시드로 키우는 방향
- [`PACKAGE-DRAFTS.md`](./PACKAGE-DRAFTS.md) — 템플릿 시드를 실제 회사 패키지 초안으로 내리는 기준

### 제품 gap / 실행 순서 문서
- [`BACKLOG.md`](./BACKLOG.md) — 시뮬레이션으로 드러난 gap
- [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md) — backlog를 어떤 순서로 다룰지

### 예시 문서
- [`examples/README.md`](./examples/README.md)
- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md)
- [`examples/ai-jobdori-package-draft.md`](./examples/ai-jobdori-package-draft.md)
- [`examples/ai-jobdori-comparison.md`](./examples/ai-jobdori-comparison.md)
- [`examples/rovel-ai2.md`](./examples/rovel-ai2.md)
- [`examples/rovel-ai2-package-draft.md`](./examples/rovel-ai2-package-draft.md)
- [`examples/ai-saju2.md`](./examples/ai-saju2.md) — B2C SaaS 운영 템플릿 시드

### 운영 문서
- [`ops/claw-operations-log.md`](./ops/claw-operations-log.md)
- [`ops/claw-deployment.md`](./ops/claw-deployment.md)

## 이것은 upstream 문서를 대체하지 않는다

아래 문서는 계속 기준 문서다.

- [`../PRODUCT.md`](../PRODUCT.md) — 제품 정체성
- [`../SPEC-implementation.md`](../SPEC-implementation.md) — V1 계약
- [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md) — 배포/보안 용어

`ehowlsla`는 이 정의 위에서,
**오너 피로를 줄이고 CEO 중심 UX를 더 강하게 드러내는 overlay**를 제안하는 문서군이다.

## 현재 브랜치 판단

이 브랜치는 단순 컨셉 메모를 넘어서,
**실제 운영 가능한 구조를 설계하고 그 부족함을 backlog로 정리하는 단계**에 들어와 있다.

다음 작업도 아래 기준을 유지해야 한다.

- 범용 문서는 점점 더 범용적으로
- 예시 문서는 더 구체적으로
- backlog는 더 명확하게
- 제품 아이디어는 오너 피로를 줄이는 방향으로
