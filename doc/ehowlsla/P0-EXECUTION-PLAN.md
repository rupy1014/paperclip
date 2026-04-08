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
| Phase 3 | CEO 브리핑 화면 정의 + 의사결정 패키지 |
| Phase 4 | 선택형 review / approval 정책 |
| Phase 5 | 산출물 품질 체계 (가정 레지스트리 + 실행→학습 루프) |
| Phase 6 | 외부 프로젝트 감시/복구 (watchdog 루틴 + 외부 cwd 에이전트 + gate policy) |

## 이 문서의 역할

- [`BACKLOG.md`](./BACKLOG.md): 무엇이 필요한가
- [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md): 무엇부터 할 것인가
- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md), [`examples/rovel-ai2.md`](./examples/rovel-ai2.md), [`examples/ai-saju2.md`](./examples/ai-saju2.md): 이 계획이 실제 프로젝트에 왜 필요한가

## P0 목표

P0의 목적은 기능을 많이 추가하는 것이 아니다.

> **오너가 덜 피곤하게, CEO와만 대화하면서, 결과물 묶음(deliverable bundle) 단위로 프로젝트를 운영할 수 있게 만드는 것**

즉 P0는 아래 다섯 가지를 제품적으로 보이게 만드는 단계다.

1. CEO 브리핑 화면 + 의사결정 패키지
2. 결과물 묶음 UX
3. 실행 패킷 관례를 제품적으로 드러내기
4. 선택형 review / approval 정책
5. 산출물 품질 체계 (가정 레지스트리 + 실행→학습 루프)

## 왜 이 순서인가

이 다섯 가지는 서로 의존한다.

- 오너는 CEO 브리핑 화면이 있어야 전체를 안 보고도 운영할 수 있다.
- CEO 브리핑 화면은 결과물 묶음이 있어야 의미가 있다.
- 결과물 묶음은 실행 패킷 관례가 있어야 일관되게 묶인다.
- review / approval 정책은 그 packet에 대해 언제 통제를 켤지 정해줘야 한다.
- 산출물 품질 체계는 위 네 가지가 갖춰진 뒤에 "올라온 것을 얼마나 믿을 수 있는가"를 다룬다.

즉 순서는 아래가 맞다.

```text
실행 패킷 규약
  → 결과물 묶음 UX
    → CEO 브리핑 화면 + 의사결정 패키지
      → 선택형 review / approval 정책
        → 산출물 품질 체계 (가정 레지스트리 + 실행→학습 루프)
```

## phase 요약

| phase | 질문 | 끝나면 생기는 것 |
| --- | --- | --- |
| 1 | 내부 실행 단위를 어떻게 묶을까 | UI와 정책의 기준 단위 |
| 2 | 오너에게 어떤 결과물을 보여줄까 | deliverable 중심 UX 언어 |
| 3 | 오너가 어디서 판단할까 | CEO 중심 진입 화면 + 의사결정 패키지 |
| 4 | 어디에만 통제를 걸까 | optional gate 정책 |
| 5 | 산출물의 품질과 가정을 어떻게 검증할까 | 가정 레지스트리 + 실행→학습 자동 루프 |

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

### Phase 3 — CEO 브리핑 화면 + 의사결정 패키지 정의

#### 목표
오너가 일반 board dashboard 대신 **CEO가 압축한 브리핑**을 보게 만든다.
전략적 판단이 필요한 항목은 **의사결정 패키지(decision package)**로 묶어서 올린다.

#### 해야 할 것
브리핑 화면의 기본 섹션을 정한다.

1. 지금 회사가 밀고 있는 것
2. 오너에게 판단이 필요한 것 → **의사결정 패키지 단위**
3. 중간/최종 결과물 묶음
4. CEO 코멘트
5. 리스크 / 비용 / 막힘 요약 + **미검증 가정 요약**

#### 중요한 원칙
- 오너가 큐레이터/작가/엔지니어 task를 직접 triage하지 않게 한다.
- raw transcript / log는 drill-down으로만 둔다.
- CEO가 정리한 우선순위가 기본 진입점이 된다.

#### 의사결정 패키지 구조
전략적 판단이 필요한 항목은 결과물 묶음을 넘어 아래 구조로 묶는다.

```text
Decision Package
├── Context: 현재 상태
├── Deliverable Bundle: 산출물 요약 + 원본 링크
├── CEO Assessment: 강점 / 리스크 / 빠진 것
├── Assumption Registry: 미검증 가정 목록 (confidence + verification)
├── Decision Required: [승인] / [수정요청] / [보류] 선택지
└── Deadline
```

일상 운영은 결과물 묶음 수준으로 충분하다.
의사결정 패키지는 예산 집행, 신규 프로젝트 론칭, 전략 전환 같은 고위험 판단에만 쓴다.

#### 완료 조건
- 오너는 이 화면 하나만 보고도 “무엇을 판단해야 하는가”를 알 수 있다.
- “CEO랑만 얘기한다”가 UX로도 자연스러워진다.
- 의사결정 패키지에 미검증 가정이 몇 건인지 요약이 포함된다.

#### 산출물
- owner entry surface 정의
- CEO comment / risk / decision request 구조
- decision package 구조 및 사용 기준

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

### Phase 5 — 산출물 품질 체계 (가정 레지스트리 + 실행→학습 루프)

#### 목표
agent 산출물의 가정을 명시적으로 추적하고,
실행 결과가 전략에 자동으로 피드백되는 구조를 만든다.

#### 왜 필요한가
Phase 1-4가 "오너가 무엇을 보고 판단하는가"를 다룬다면,
Phase 5는 **"agent가 만든 것을 얼마나 믿을 수 있는가"**와
**"실행 후 틀린 것을 어떻게 고치는가"**를 다룬다.

실제 운영에서 드러난 문제:
- CMO가 만든 마케팅 전략에 인플루언서 단가가 추정치인지 실제 견적인지 구분이 안 됨
- Phase 1 실행 후 KPI 미달이어도 전략 수정 트리거가 없음
- 엔지니어가 구현 중 발견한 제약이 CMO의 채널 전략에 반영되지 않음

#### 해야 할 것

**A. 가정 레지스트리(Assumption Registry)**

전략/예산/시장 관련 agent 산출물에 가정 목록을 포함시킨다.

```yaml
assumptions:
  - claim: "가정 내용"
    confidence: low | medium | high
    source: estimate | benchmark | verified
    verification: "검증 방법"
```

- confidence level 기준을 company playbook에 정의
- CEO가 decision package 제출 시 "미검증 가정 N건, 고위험 M건" 자동 요약
- 가정이 검증/반증되면 confidence를 갱신하고 관련 전략을 수정

**B. 실행→학습 자동 루프(Execution → Learning Loop)**

```text
실행 완료
  → 결과 측정 (KPI / 비용 / 산출물 품질)
    → 기대 vs 실제 차이 > threshold?
      ├── YES → retrospective issue 자동 생성
      │         → CEO/리드가 원인 분석
      │           → 전략 수정 or playbook 승격
      └── NO  → 다음 cycle
```

- 프로젝트별 측정 기준과 threshold를 project brief에 정의
- threshold 기본값은 "기대 대비 ±30%" (회사 playbook에서 조정 가능)
- retro issue에는 원본 기대치, 실제 결과, 관련 가정이 자동 포함
- retro에서 나온 개선점은 프로젝트 규약 또는 회사 playbook에 반영

**C. 역할 간 교차 학습(Cross-Role Learning)**

한 역할의 실행 중 발견한 제약이 다른 역할의 계획에 영향을 줄 때,
CEO/리드가 영향 범위를 판단하고 수정 요청 이슈를 생성한다.

#### 완료 조건
- 전략 산출물에 가정 레지스트리가 포함되어 올라온다.
- 실행 결과가 기대와 크게 다를 때 retro 이슈가 자동 생성된다.
- retro에서 나온 학습이 playbook 승격까지 연결된다.
- 역할 간 제약 발견이 관련 역할에 전파된다.

#### 산출물
- assumption registry 포맷 및 confidence level 기준
- retrospective trigger 정책 (threshold, 측정 기준)
- cross-role learning 판단 기준
- 이 세 가지를 company playbook에 넣는 기본 템플릿

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

### ai-saju2 (운세냥)
가장 먼저 체감되는 것은:
1. 가정 레지스트리 (마케팅 전략의 가정 검증)
2. 실행→학습 루프 (CPA, 전환율 등 실행 결과 → 전략 수정)
3. 의사결정 패키지 (마케팅 Phase별 예산 집행 판단)
4. 역할 간 교차 학습 (엔지니어 ↔ CMO 제약 공유)

ai-saju2는 B2C SaaS로서 실행 결과가 숫자(매출, CPA, 전환율)로 즉시 측정되므로,
**Phase 5(산출물 품질 체계)의 검증에 가장 적합한 테스트베드**다.

즉 세 예시가 각각 다른 강점을 드러낸다.
- ai-jobdori: 결과물 묶음과 반복 파이프라인
- rovel.ai2: 실행 패킷과 멀티 프로젝트 구조
- ai-saju2: 산출물 품질 검증과 실행→학습 루프

## use case 요약

| use case | 유형 | 가장 먼저 체감되는 것 |
| --- | --- | --- |
| ai-jobdori | 콘텐츠 파이프라인 | 결과물 묶음 UX, CEO 브리핑, 선택형 approval |
| rovel.ai2 | 크리에이티브 스튜디오 | 실행 패킷 규약, 결과물 묶음 UX, CEO 브리핑, 선택형 review/approval |
| ai-saju2 | B2C SaaS 운영 | 가정 레지스트리, 실행→학습 루프, 의사결정 패키지, 교차 학습 |

### Phase 6 — 외부 프로젝트 감시/복구

Phase 5의 실행→학습 루프가 동작하면,
같은 패턴을 **Paperclip 외부 서비스**에도 확장할 수 있다.

**핵심 산출물**
- watchdog 루틴 (health check + error rate 모니터링)
- 외부 cwd 에이전트 설정 패턴
- 복구 수준별 gate policy (L1 advisory / L2 blocking / L3 escalation)
- 외부 서비스 장애의 learning event → constraint 전파 흐름

**선행 조건**
- Phase 4(gate policy)와 Phase 5(learning loop)가 동작해야 한다.
- 외부 서비스가 health check 또는 로그 접근을 제공해야 한다.

**첫 번째 적용 대상**: ai-saju2 report-worker (`~/sjtalk`)
- 같은 Mac mini에서 동작
- launchd로 관리
- PID lock + stall recovery 있으나 코드 버그 복구 불가
- 상세 시나리오: [`examples/ai-saju2.md`](./examples/ai-saju2.md)

**구현 범위**
1. `saju-infra-engineer` 에이전트 생성 (cwd: ~/sjtalk)
2. 3개 watchdog 루틴 (health, stall, error-rate)
3. gate policy 3개 (restart=advisory, deploy=blocking, strategy_change=blocking)
4. learning event 연동 (반복 장애 → constraint → playbook 승격)

**주의**: 이 Phase는 "외부 프로젝트를 Paperclip으로 마이그레이션"하는 것이 아니다.
외부 프로젝트는 그대로 두고, **운영 가시성과 복구 능력만** Paperclip에 통합하는 것이다.

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
5. ai-jobdori, rovel.ai2, ai-saju2 셋 다 같은 제품 표면 위에서 설명 가능하다.
6. 전략 산출물의 가정이 명시적으로 추적되고, 실행 결과가 전략에 피드백된다.
7. 외부 프로젝트(ai-saju2 report-worker)의 장애가 Paperclip 이슈로 자동 생성되고, 에이전트가 코드 수정까지 수행할 수 있다.

## 다음 문서 후보

이 문서 다음으로 바로 이어질 문서는 아래 셋 중 하나다.

1. `CEO 브리핑 화면 PRD`
2. `결과물 묶음 UX PRD`
3. `실행 패킷 규약/스펙`

현재 기준으로는 **실행 패킷 규약/스펙**이 가장 먼저다.
왜냐하면 그게 나머지 둘의 기준 단위가 되기 때문이다.

3층 기억 구조를 제품 표면으로 어떻게 드러낼지는
[`MEMORY-SURFACES.md`](./MEMORY-SURFACES.md)를 참고한다.
