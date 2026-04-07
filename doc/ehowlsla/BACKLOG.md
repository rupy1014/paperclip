# ehowlsla 브랜치 백로그

> **상태**: 제안
> **목적**: 실제 운영 시뮬레이션을 통해 드러난 제품 gap과 우선순위를 정리한다.
> **대상 독자**: 제품 gap을 분류하고 우선순위를 정하려는 독자
> **관련 문서**: [`README.md`](./README.md), [`CONCEPT-MAP.md`](./CONCEPT-MAP.md), [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md)


이 문서는 `ehowlsla` 브랜치에서 실제 운영 시뮬레이션을 해보면서 드러난
**필요 기능 / 개선 기능 / 과한 방향**을 정리한 문서다.

즉 이 문서는 **현재 제품 기본값 설명서가 아니라 gap 문서**다.

핵심 질문은 이것이다.

- 지금 Paperclip 컨셉으로 실제 프로젝트를 돌릴 수 있는가?
- 잘 돌긴 하지만 아직 무엇이 불편한가?
- 무엇이 꼭 필요하고, 무엇은 아직 과한가?

## 한눈에 보기

| 구분 | 핵심 |
| --- | --- |
| P0 | CEO 브리핑 + 의사결정 패키지, 결과물 묶음 UX, 실행 패킷 가시화, 선택형 review/approval, 산출물 품질 체계 |
| P1 | use case별 템플릿, asset/reference 카드, wave/program 뷰, company playbook surface |
| 하지 말 것 | 대규모 workflow 엔진, Paperclip 자체 VN 엔진화, 도메인 알고리즘 흡수, 모든 단계 mandatory approval |

## 판단 기준

이 백로그는 아래 세 use case를 기준으로 삼는다.

- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md)
- [`examples/rovel-ai2.md`](./examples/rovel-ai2.md)
- [`examples/ai-saju2.md`](./examples/ai-saju2.md)

즉 “멋져 보이는 기능”이 아니라,
**실제로 혼자 운영할 때 도움이 되는가**를 기준으로 우선순위를 잡는다.

3층 기억 구조를 제품적으로 어떻게 보여줄지는
[`MEMORY-SURFACES.md`](./MEMORY-SURFACES.md)를 참고한다.

---

## P0 — 가장 먼저 필요한 것

### 1. CEO 브리핑 화면

오너는 기본적으로 CEO와만 대화한다.
따라서 제품도 일반 board dashboard보다 **CEO가 정리한 브리핑 화면**이 먼저여야 한다.

오너가 봐야 할 것은:
- 지금 무엇을 밀고 있는가
- 어떤 결과물 묶음이 올라왔는가
- 무엇이 막혔는가
- 무엇을 판단해야 하는가

### 2. 결과물 묶음(deliverable bundle) UX

현재 오너가 실제로 판단해야 하는 단위는 task 상태가 아니라:
- `draft_package`
- `publish_candidate`
- `casting_package`
- `vn_package`
- `release_candidate`
같은 **결과물 묶음(deliverable bundle)**이다.

즉 document / work-product / preview / decision request를 한 묶음으로 보여줘야 한다.

### 3. 실행 패킷(production packet) 관례를 제품적으로 더 잘 드러내기

지금은 문서상으로는 정리되었지만,
제품 안에서는 아직 “작품 하나 / 발행 후보 하나 / 제작 단위 하나”를 패킷처럼 보기 어렵다.

필요한 방향:
- top-level issue
- reserved documents
- work-products
- optional gates
를 하나의 실행 패킷처럼 보여주기

### 4. 선택형 review / approval 정책

- 모든 작업에 강제 review 금지
- 모든 작업에 강제 approval 금지
- publish / budget exception / release 같은 고위험 단계만 선택적으로 켜기

이건 오너 피로를 줄이는 데 핵심이다.

### 5. 산출물 품질 체계

agent가 만든 산출물의 품질을 어떻게 판단할 것인가.
현재는 CEO가 올리면 오너가 파일을 읽고 직감으로 판단하는 구조다.

필요한 것:
- **가정 레지스트리**: 전략/예산 산출물에 포함된 가정의 confidence level과 검증 방법 명시
- **의사결정 패키지**: 결과물 묶음 + CEO 평가 + 리스크 + 미검증 가정 요약 + 판단 선택지
- **실행→학습 루프**: 실행 결과가 기대와 크게 다를 때 자동 retro → 전략 수정
- **역할 간 교차 학습**: 한 역할의 실행 제약이 다른 역할의 전략에 반영

### P0 요약

| 항목 | 왜 먼저 필요한가 |
| --- | --- |
| CEO 브리핑 화면 | 오너가 task board를 직접 보지 않게 하기 위해 |
| 결과물 묶음 UX | 오너 판단 단위를 task가 아니라 deliverable로 바꾸기 위해 |
| 실행 패킷 가시화 | 내부 실행 단위를 일관되게 설명하고 보여주기 위해 |
| 선택형 review / approval | 중요한 통제는 유지하면서 오너 피로를 줄이기 위해 |
| 산출물 품질 체계 | agent 산출물의 가정을 추적하고 실행 결과를 전략에 피드백하기 위해 |

---

## P1 — 있으면 매우 좋아지는 것

### 1. use case별 회사 템플릿

예:
- `JOB` 템플릿
- `Rovel Studio` 템플릿

조직도, 기본 프로젝트, 운영 루틴, reserved document keys까지 포함하는 식이 좋다.

### 2. asset/reference 카드

특히 Rovel 같은 프로젝트에서는:
- 캐릭터
- 배경
- BGM
- 누락 리소스
를 묶어서 보는 카드가 있으면 좋다.

### 3. wave/program 운영 뷰

대량 콘텐츠 QC나 batch review처럼,
프로그램/웨이브 단위 운영이 필요할 때 보는 뷰가 있으면 좋다.

### 4. 회사 공용 플레이북 / 재사용 가능한 기억 표면

멀티 프로젝트 회사가 유기적으로 움직이려면,
프로젝트 A의 좋은 운영 방식을 프로젝트 B에 재사용하기 쉬워야 한다.

필요한 방향:
- 회사 공용 규약과 체크리스트를 모아두는 표면
- 프로젝트 회고를 공용 playbook으로 승격하는 흐름
- 실행 패킷 템플릿 / 검토 체크리스트 / routine 패턴 재사용

그리고 이 표면은 최소한 아래를 구분해 보여줄 수 있어야 한다.
- 회사 공용 기억
- 프로젝트 전용 기억
- 에이전트 개인 지식

### P1 요약

| 항목 | 의미 |
| --- | --- |
| use case별 회사 템플릿 | 바로 가져다 쓸 수 있는 starter company |
| asset/reference 카드 | Rovel 같은 스튜디오형 프로젝트에 필요한 자산 가시화 |
| wave/program 운영 뷰 | batch review / 대량 운영용 뷰 |
| company playbook surface | 멀티 프로젝트 회사의 운영 기억 재사용 |

---

## 아직 과한 것

### 1. 대규모 workflow 엔진

처음부터 BPM처럼 모든 상태 전이를 커스텀 가능하게 만들 필요는 없다.
지금은 패턴과 실행 패킷, 브리핑이 먼저다.

### 2. Paperclip 자체의 VN 엔진화

`rovel.ai2`는 Rovel이 담당하고,
Paperclip은 그 위를 조율하는 운영 제어면으로 남는 편이 맞다.

### 3. 도메인 알고리즘을 Paperclip 코어에 흡수

예:
- 캐스팅 알고리즘
- 자산 생성 알고리즘
- story parser 자체

이런 것은 도메인 프로젝트의 책임에 두고,
Paperclip은 결과물 묶음과 decision flow를 다루는 편이 낫다.

### 4. 모든 단계 mandatory approval

이건 네 운영 스타일과 정면 충돌한다.
오히려 “사람 회사 같은 운영”을 망가뜨릴 가능성이 크다.

---

## 현재 컨셉의 장점

### 이미 잘 맞는 것
- 회사 / org / goal / issue 중심 모델
- CEO 중심 위임 구조
- hybrid orchestration
- deterministic 도구 유지 전략
- live run / routine / document / work-product primitive

### 실제 시뮬레이션에서 확인된 장점
- `ai-jobdori`는 지금도 꽤 잘 맞는다.
- `rovel.ai2`도 운영 모델링은 가능하다.
- 오너-CEO 구조가 실제 solo-owner 운영에 잘 맞는다.

---

## 현재 컨셉의 약점

### 1. 제품 표면이 아직 오너 기준으로 재정렬되지 않음
문서로는 맞는데, UI는 아직 board/operator 중심이다.

### 2. 결과물 묶음이 제품의 기본 단위로 드러나지 않음
API는 있는데, 오너가 보기 쉬운 형태는 아니다.

### 3. 실행 패킷 개념이 아직 문서 규약 수준임
제품 안에서 더 잘 보이게 해야 한다.

### 4. 선택형 review/approval 정책이 문서에는 있지만 제품 기본값은 아직 강하지 않음

### 5. 회사 공용 기억과 프로젝트 전용 기억의 경계가 아직 제품에 잘 드러나지 않음

문서로는 설명할 수 있지만,
제품 안에서는 무엇이 회사 표준이고 무엇이 프로젝트별 특수사항인지 더 잘 구분해 보여줄 필요가 있다.

### 6. 에이전트 개인 지식이 회사 표준으로 언제 승격되는지 흐름이 아직 없다

좋은 개인 작업 방식이 반복 검증되면
CEO나 리드가 이를 프로젝트 규약 또는 회사 공용 playbook으로 올릴 수 있어야 한다.

### 7. agent 산출물의 가정이 명시되지 않는다

agent가 전략/예산 문서를 만들 때 포함된 추정치나 가정이
검증된 사실인지 희망 사항인지 구분할 수 없다.
오너가 이를 구분하지 못하면 잘못된 가정 위에 의사결정을 하게 된다.

### 8. 실행 결과가 전략에 자동으로 피드백되지 않는다

agent가 전략을 세우고 실행까지 하지만,
실행 결과가 기대와 달라도 자동으로 전략을 재검토하는 트리거가 없다.
매번 오너가 직접 "이거 안 됐으니 바꿔"라고 지시해야 한다.

### 9. 역할 간 실행 제약이 전파되지 않는다

엔지니어가 구현 중 발견한 기술적 제약(비용, 성능, API 한계)이
CMO나 다른 전략 역할의 계획에 반영되는 구조가 없다.
역할 간 사일로가 생긴다.

## gap 요약

| gap | 현재 상태 |
| --- | --- |
| 오너 중심 제품 surface | 아직 board/operator 중심 |
| 결과물 묶음 가시성 | API는 있지만 기본 UI 단위는 아님 |
| 실행 패킷 모델 | 문서 규약 수준에 머물러 있음 |
| 선택형 review / approval | 문서에는 있으나 제품 기본값은 약함 |
| 3층 기억 구조 | 문서 설명은 가능하지만 제품 경계는 약함 |
| 개인 지식 승격 흐름 | 아직 제품 안에 명시적 흐름이 없음 |
| 산출물 가정 추적 | agent 산출물의 가정이 confidence level 없이 올라옴 |
| 실행→학습 루프 | 실행 결과가 전략 수정으로 자동 연결되지 않음 |
| 역할 간 교차 학습 | 한 역할의 실행 제약이 다른 역할에 전파되지 않음 |

---

## 바로 다음 액션

1. [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md)로 P0 실행 순서 확정
2. CEO 브리핑 화면 PRD
3. 결과물 묶음 UI PRD
4. 실행 패킷 규약/스펙
5. 이후 use case 템플릿 정의

핵심은 이거다.

> 이 브랜치의 방향은 “더 많은 기능 추가”가 아니라,
> 실제 프로젝트를 AI 회사처럼 굴릴 때 오너가 덜 피곤하고 더 잘 판단하게 만드는 것이다.
