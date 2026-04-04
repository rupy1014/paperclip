# P0 실행 계획

> **상태**: 제안
> **목적**: `BACKLOG.md`에 정리된 gap을 어떤 순서로 다룰지 정리한다.
> **대상 독자**: 제품 gap을 delivery order로 전환하려는 독자
> **관련 문서**: [`README.md`](./README.md), [`CONCEPT-MAP.md`](./CONCEPT-MAP.md), [`BACKLOG.md`](./BACKLOG.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md)


이 문서는 `ehowlsla` 브랜치의 범용 P0를 **실행 순서가 있는 계획**으로 정리한 문서다.

`BACKLOG.md`가 무엇이 필요한지를 정리한다면,
이 문서는 **무엇부터 어떤 순서로 손대야 하는지**를 정리한다.

즉 이 문서는 현재 제품 정의서가 아니라 **실행 순서 문서**다.

## 한눈에 보기

| 단계 | 핵심 산출물 |
| --- | --- |
| Phase 1 | 실행 패킷 규약 |
| Phase 2 | 결과물 묶음 UX 정의 |
| Phase 3 | CEO 브리핑 화면 정의 |
| Phase 4 | 선택형 review / approval 정책 |

## 이 문서의 역할

- [`BACKLOG.md`](./BACKLOG.md): 무엇이 필요한가
- [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md): 무엇부터 할 것인가
- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md), [`examples/rovel-ai2.md`](./examples/rovel-ai2.md): 이 계획이 실제 프로젝트에 왜 필요한가

## P0 목표

P0의 목적은 기능을 많이 추가하는 것이 아니다.

> **오너가 덜 피곤하게, CEO와만 대화하면서, 결과물 묶음(deliverable bundle) 단위로 프로젝트를 운영할 수 있게 만드는 것**

즉 P0는 아래 네 가지를 제품적으로 보이게 만드는 단계다.

1. CEO 브리핑 화면
2. 결과물 묶음 UX
3. 실행 패킷 관례를 제품적으로 드러내기
4. 선택형 review / approval 정책

## 왜 이 순서인가

이 네 가지는 서로 의존한다.

- 오너는 CEO 브리핑 화면이 있어야 전체를 안 보고도 운영할 수 있다.
- CEO 브리핑 화면은 결과물 묶음이 있어야 의미가 있다.
- 결과물 묶음은 실행 패킷 관례가 있어야 일관되게 묶인다.
- review / approval 정책은 그 packet에 대해 언제 통제를 켤지 정해줘야 한다.

즉 순서는 아래가 맞다.

```text
실행 패킷 규약
  → 결과물 묶음 UX
    → CEO 브리핑 화면
      → 선택형 review / approval 정책
```

## phase 요약

| phase | 질문 | 끝나면 생기는 것 |
| --- | --- | --- |
| 1 | 내부 실행 단위를 어떻게 묶을까 | UI와 정책의 기준 단위 |
| 2 | 오너에게 어떤 결과물을 보여줄까 | deliverable 중심 UX 언어 |
| 3 | 오너가 어디서 판단할까 | CEO 중심 진입 화면 |
| 4 | 어디에만 통제를 걸까 | optional gate 정책 |

## 실행 단계

### Phase 1 — 실행 패킷 규약 정의

가장 먼저 해야 한다.

#### 목표
현재 이미 있는 primitive:
- issue
- documents
- work-products
- runs
- optional approvals

를 하나의 **운영 단위**처럼 읽히게 만드는 규약을 만든다.

#### 해야 할 것
- 실행 패킷의 최소 구조 정의
  - 대표 issue
  - reserved document keys
  - work-product 묶음
  - 상태
  - 소유 역할
- 실행 패킷의 기본 상태 정의
  - `draft`
  - `internal_review`
  - `ready_for_owner`
  - `changes_requested`
  - `approved`
  - `released`
  - `archived`
- use case별 reserved document key 예시 정리
  - 콘텐츠형
  - 스튜디오형

#### 완료 조건
- 문서만 읽어도 “작품/발행 후보 하나를 어떻게 모델링하는지” 설명할 수 있다.
- ai-jobdori와 rovel 둘 다 같은 개념으로 설명 가능하다.

#### 산출물
- 제품 UI가 무엇을 묶어 보여줘야 하는지 기준
- use case 공통 packet vocabulary

---

### Phase 2 — 결과물 묶음 UX 정의

#### 목표
오너가 보는 기본 단위를 task 상태가 아니라 **결과물 묶음**으로 바꾼다.

#### 해야 할 것
- 패키지 카드/상세 구조 정의
  - 헤더
  - CEO 요약
  - 문서 묶음
  - preview / artifact / 링크
  - 누락 항목
  - 요청 액션
- 어떤 화면에서 이 패키지를 보여줄지 정의
  - issue detail 안의 패키지 영역
  - project 안의 대표 패키지 목록
  - CEO 브리핑 화면의 핵심 단위

#### 완료 조건
- ai-jobdori의 `publish_candidate`
- rovel의 `release_candidate`
를 같은 UI 개념으로 설명할 수 있다.

#### 산출물
- “오너는 결과물 묶음을 본다”는 제품 언어
- issue/project/briefing 화면 공통 card 구조

---

### Phase 3 — CEO 브리핑 화면 정의

#### 목표
오너가 일반 board dashboard 대신 **CEO가 압축한 브리핑**을 보게 만든다.

#### 해야 할 것
브리핑 화면의 기본 섹션을 정한다.

1. 지금 회사가 밀고 있는 것
2. 오너에게 판단이 필요한 것
3. 중간/최종 결과물 묶음
4. CEO 코멘트
5. 리스크 / 비용 / 막힘 요약

#### 중요한 원칙
- 오너가 큐레이터/작가/엔지니어 task를 직접 triage하지 않게 한다.
- raw transcript / log는 drill-down으로만 둔다.
- CEO가 정리한 우선순위가 기본 진입점이 된다.

#### 완료 조건
- 오너는 이 화면 하나만 보고도 “무엇을 판단해야 하는가”를 알 수 있다.
- “CEO랑만 얘기한다”가 UX로도 자연스러워진다.

#### 산출물
- owner entry surface 정의
- CEO comment / risk / decision request 구조

---

### Phase 4 — 선택형 review / approval 정책 정의

#### 목표
review / approval를 중요하게 유지하면서도,
기본값이 “모든 단계 강제”가 되지 않게 한다.

#### 해야 할 것
- 실행 패킷 또는 workflow 단위 정책 정의
  - review 필요 여부
  - approval 필요 여부
  - 누가 review를 충족하는가
  - 누가 approval을 충족하는가
  - blocking인지 advisory인지
- 고위험 행동만 approval 기본값으로 두기
  - publish
  - release
  - budget override
  - 긴급 실행

#### 완료 조건
- 오너가 모든 단계에서 버튼을 누르지 않아도 된다.
- 대신 정말 중요한 단계만 위로 올라온다.

#### 산출물
- packet/workflow별 gate policy
- blocking vs advisory 구분

---

## use case별 체감 순위

### ai-jobdori
가장 먼저 체감되는 것은:
1. 결과물 묶음 UX
2. CEO 브리핑 화면
3. 선택형 approval

### rovel.ai2
가장 먼저 체감되는 것은:
1. 실행 패킷 규약
2. 결과물 묶음 UX
3. CEO 브리핑 화면
4. 선택형 review / approval

즉 두 예시가 모두 중요하지만,
rovel 쪽이 packet 모델의 필요성을 더 강하게 드러낸다.

## use case 요약

| use case | 가장 먼저 체감되는 것 |
| --- | --- |
| ai-jobdori | 결과물 묶음 UX, CEO 브리핑, 선택형 approval |
| rovel.ai2 | 실행 패킷 규약, 결과물 묶음 UX, CEO 브리핑, 선택형 review/approval |

## 제외 범위

P0에서 하지 않는 것:
- 대규모 workflow 엔진
- 다중권한 엔터프라이즈 체계 확장
- Paperclip 자체의 VN 엔진화
- 도메인 전용 생성/캐스팅 알고리즘 흡수
- 모든 단계 mandatory approval

## 성공 기준

P0가 끝나면 아래가 가능해야 한다.

1. 오너가 CEO와만 대화하면서도 회사 운영이 가능하다.
2. 오너가 task 목록이 아니라 결과물 묶음 중심으로 판단한다.
3. 작품/발행 후보/제작 단위를 실행 패킷으로 설명할 수 있다.
4. review / approval가 필요한 단계에만 선택적으로 올라온다.
5. ai-jobdori와 rovel.ai2 둘 다 같은 제품 표면 위에서 설명 가능하다.

## 다음 문서 후보

이 문서 다음으로 바로 이어질 문서는 아래 셋 중 하나다.

1. `CEO 브리핑 화면 PRD`
2. `결과물 묶음 UX PRD`
3. `실행 패킷 규약/스펙`

현재 기준으로는 **실행 패킷 규약/스펙**이 가장 먼저다.
왜냐하면 그게 나머지 둘의 기준 단위가 되기 때문이다.

3층 기억 구조를 제품 표면으로 어떻게 드러낼지는
[`MEMORY-SURFACES.md`](./MEMORY-SURFACES.md)를 참고한다.
