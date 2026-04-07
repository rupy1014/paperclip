# ehowlsla 문서 가이드

> **상태**: 제안
> **목적**: `doc/ehowlsla/` 문서군을 upstream Paperclip 문서 위의 운영 해석 레이어로 읽도록 돕는 진입점이다.
> **대상 독자**: `ehowlsla` 방향성을 이해하거나, 이 문서군을 실제 정리/확장하려는 기여자
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md), [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md)

`doc/ehowlsla/`는 upstream Paperclip 문서를 대체하는 폴더가 아니다.
이 폴더는 **Paperclip의 기준 제품 문서 위에 덧씌운 운영 해석 레이어**다.

즉:

- 루트 문서 = Paperclip의 기준 정의
- `doc/ehowlsla/` = 그 정의를 실제 운영 감각, 오너 UX, 예시 프로젝트, 운영 기록 관점에서 해석한 문서 묶음

## 먼저 읽을 루트 문서

`ehowlsla` 문서를 읽기 전에 아래 문서를 기준 문서로 둔다.

1. [`../PRODUCT.md`](../PRODUCT.md) — Paperclip의 제품 정체성
2. [`../SPEC-implementation.md`](../SPEC-implementation.md) — V1 동작 계약
3. [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md) — 배포/보안 모드 기준 용어

## 추천 읽기 순서

### 1. 방향과 용어
1. [`STRATEGY.md`](./STRATEGY.md) — 이 overlay가 무엇을 검증하는가
2. [`CONCEPT-MAP.md`](./CONCEPT-MAP.md) — 기준 용어와 overlay 용어 대응표

### 2. 운영 모델
3. [`AI-COMPANY.md`](./AI-COMPANY.md) — 역할/책임 모델
4. [`ORCHESTRATION-PATTERNS.md`](./ORCHESTRATION-PATTERNS.md) — 운영 패턴과 lifecycle
5. [`MEMORY-SURFACES.md`](./MEMORY-SURFACES.md) — 3층 기억 구조의 제품 표면

### 3. 템플릿/패키지 방향
6. [`TEMPLATE-SEEDS.md`](./TEMPLATE-SEEDS.md) — examples를 템플릿 시드로 키우는 방향
7. [`PACKAGE-DRAFTS.md`](./PACKAGE-DRAFTS.md) — 템플릿 시드를 실제 회사 패키지 초안으로 내리는 기준

### 4. 제품 gap과 예시
8. [`BACKLOG.md`](./BACKLOG.md) — 현재 gap과 필요한 제품 변화
9. [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md) — backlog를 어떤 순서로 다룰지
10. [`examples/README.md`](./examples/README.md) — 실제 적용 예시 모음

### 5. 운영 기록
11. [`ops/claw-deployment.md`](./ops/claw-deployment.md) — `claw` 호스트 배포 절차
12. [`ops/claw-operations-log.md`](./ops/claw-operations-log.md) — `claw` 운영 기록

## 문서 상태 범례

| 상태 | 의미 |
| --- | --- |
| 제안 | 아직 제품 기본값이 아니라 방향 제안 중심 |
| 예시 | 특정 프로젝트에 대입한 예시 |
| 운영 절차 | 특정 호스트/환경에서 따라야 하는 운영 절차 |
| 운영 기록 | 특정 시점의 운영 사실과 검증 기록 |

## 핵심 용어

자세한 정의는 [`CONCEPT-MAP.md`](./CONCEPT-MAP.md)를 본다.

- **보드 운영자(owner)**: 기준 권한 주체는 `board`이고, `ehowlsla`에서는 solo operator UX를 강조할 때 `owner`라고 부른다.
- **CEO 브리핑**: 오너가 기본 진입점으로 보는 요약 화면이라는 overlay UX 용어다.
- **실행 패킷(production packet)**: 내부 실행 단위. `issue + reserved documents + work-products + state`를 한 운영 단위로 묶는 개념이다.
- **결과물 묶음(deliverable bundle)**: 오너/보드가 판단하는 결과물 묶음이다. CEO 요약, 핵심 문서, preview, decision request를 포함한다.
- **의사결정 패키지(decision package)**: 결과물 묶음 + CEO 평가 + 리스크/가정 요약 + 판단 선택지를 하나로 묶은 오너 최종 판단 단위다. 전략적 고위험 판단에만 쓴다.
- **가정 레지스트리(assumption registry)**: agent 산출물에 포함된 가정의 confidence level과 검증 방법을 명시한 목록이다.
- **실행→학습 루프(execution → learning loop)**: 실행 결과가 기대와 크게 다를 때 자동으로 회고를 생성하고 전략을 수정하는 피드백 구조다.
- **회사 공용 플레이북(company playbook)**: 일반 지식 저장소가 아니라, 여러 프로젝트에 재사용되는 회사 공용 운영 기억이다.
- **프로젝트 브리프(project brief)**: 프로젝트 전용 맥락, 목표, 실행 환경/저장소 설정, 패킷 상태를 담는 표면이다.

> 규칙: umbrella noun으로 bare `package`를 쓰지 않는다.  
> `draft_package`, `casting_package`, `vn_package` 같은 값은 **artifact key 이름**으로만 유지한다.

## 폴더 지도

- **방향/개념**: `STRATEGY.md`, `CONCEPT-MAP.md`
- **운영 모델**: `AI-COMPANY.md`, `ORCHESTRATION-PATTERNS.md`, `MEMORY-SURFACES.md`
- **템플릿/패키지**: `TEMPLATE-SEEDS.md`, `PACKAGE-DRAFTS.md`
- **제품 gap/실행순서**: `BACKLOG.md`, `P0-EXECUTION-PLAN.md`
- **예시**: `examples/README.md`
- **운영 문서**: `ops/claw-deployment.md`, `ops/claw-operations-log.md`

## 이 폴더를 읽을 때의 원칙

1. **기준 용어를 먼저 둔다**
2. **overlay 용어는 UX 의미가 중요할 때만 쓴다**
3. **`packet`, `bundle`, `decision package`는 각각 다른 개념이다**
4. **`board`와 `owner`는 명시적으로 매핑될 때만 같은 주체로 읽는다**
5. **`ehowlsla`는 upstream replacement가 아니라 운영 해석 레이어다**
