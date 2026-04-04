# Paperclip 오케스트레이션 패턴

> **상태**: 제안
> **목적**: `ehowlsla`가 상정하는 운영 패턴과 lifecycle 용어를 고정한다.
> **대상 독자**: 운영 패턴, handoff, review/approval 흐름을 설계하려는 독자
> **관련 문서**: [`README.md`](./README.md), [`CONCEPT-MAP.md`](./CONCEPT-MAP.md), [`AI-COMPANY.md`](./AI-COMPANY.md), [`BACKLOG.md`](./BACKLOG.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md)


이 문서는 `ehowlsla` 브랜치에서 사용하는 **범용 오케스트레이션 패턴**을 정리한다.
특정 프로젝트별 구현 예시는 `examples/` 아래 문서를 참고하고,
여기서는 어떤 프로젝트에도 적용 가능한 운영 패턴과 수정 포인트를 설명한다.

## 이 문서의 역할

- [`examples/ai-jobdori-comparison.md`](./examples/ai-jobdori-comparison.md)는 왜 제어면이 필요한지 비교 관점에서 설명한다.
- [`AI-COMPANY.md`](./AI-COMPANY.md)는 누가 어떤 책임을 지는지 설명한다.
- 이 문서는 그 조직이 **어떤 패턴으로 움직이는지**를 설명한다.
- [`BACKLOG.md`](./BACKLOG.md)는 시뮬레이션 뒤에 남는 제품 갭과 다음 우선순위를 설명한다.
- 프로젝트별 적용은 `examples/ai-jobdori.md`, `examples/rovel-ai2.md`를 본다.

## 핵심 용어

- **품질 검토(review)**: 결과물이 충분히 좋은지 검토하는 단계
- **승인(approval)**: 게시, 예산 재개, 긴급 발행 같은 거버넌스 결정을 허용하는 단계
- **운영 루틴(routine)**: 반복적으로 issue나 run을 만들어내는 운영 트리거
- **도구 실행 단계(tool-backed execution)**: deterministic 스크립트/CLI/tool이 실제 작업을 수행하는 단계
- **control plane**: 역할, 승인, 비용, 복구, 추적을 관리하는 상위 운영 계층
- **실행 패킷(production packet)**: 내부 실행 단위. top-level issue와 reserved documents, work-products, 상태를 묶는 단위
- **결과물 묶음(deliverable bundle)**: 오너/보드가 판단하는 결과물 묶음. CEO summary, preview, 핵심 문서, decision request를 포함

## 왜 패턴 언어가 필요한가

Paperclip의 강점은 구조화다.
하지만 운영자가 실제로 시스템을 수정하려면,
“무엇이 어떤 패턴으로 움직이는가”를 짧게 말할 수 있어야 한다.

그래서 이 문서는 구현 세부보다 위의 층에서,
**회사가 움직이는 방식에 이름을 붙인다.**

## 범용 운영 흐름(lifecycle)

프로젝트마다 세부는 달라도,
대부분의 운영은 아래 형태로 압축할 수 있다.

```text
intake → triage → execute → review → approval → release / retry / archive
```

이 흐름의 의미:
- intake: 새로운 입력/요청/작품/이슈 수집
- triage: 우선순위, 범위, 역할 분배
- execute: 실제 작업/도구 실행/패키지 작성
- review: 품질 검토
- approval: 고위험 결정 승인
- release / retry / archive: 공개, 복구, 종료

중요한 점은,
이 lifecycle이 모든 프로젝트에서 완전히 동일해야 하는 것은 아니지만,
운영자가 현재 상태를 이해하는 기본 mental model로는 매우 유용하다는 것이다.

## 오너 인터페이스 원칙

오너는 기본적으로 **CEO와만 대화하는 것**을 기본값으로 둔다.

즉 오너는 보통 다음만 본다.
- 현재 무엇을 밀고 있는가
- 중간 산출물이 어떤가
- 결과물이 만족스러운가
- 비용/리스크/막힘이 있는가

큐레이터/작가/엔지니어 같은 실무 역할과의 직접 커뮤니케이션은 예외 상황으로 두고,
기본 피드백 루프는 `오너 → CEO → 실무 역할` 구조로 운영한다.

여기서 `오너`는 `board operator (owner)`라는 UX label로 읽는 편이 맞다.

## 패턴 카탈로그

### 1. 보드 지정 전략 작업

사람 보드 또는 오너가 전략적 이슈를 만들고,
특정 역할에게 명시적으로 맡기는 패턴이다.

**언제 쓰는가**
- 신규 프로젝트 시작
- 조직 변경
- 우선순위 재조정
- 사람이 반드시 의도를 명시해야 하는 일

**장점**
- 왜 이 일이 중요한지 명확하다.
- 목표 정렬이 강하다.

**주의점**
- 모든 일을 이 패턴으로만 운영하면 보드 병목이 생긴다.

### 2. 에이전트 큐 작업

에이전트가 backlog/todo의 작업을 자기 역할 범위 안에서 가져가 처리하는 패턴이다.

**언제 쓰는가**
- 반복적이지만 여전히 판단이 필요한 작업
- 같은 유형의 업무가 계속 쌓이는 운영

**장점**
- 미세 할당 부담이 줄어든다.
- 역할별 전문성이 살아난다.

**주의점**
- claim 규칙과 우선순위 기준이 문서화되어야 한다.

### 3. 운영 루틴 생성 작업

운영 루틴(routine)이 시간 기반 또는 이벤트 기반으로 recurring issue를 생성하는 패턴이다.

**언제 쓰는가**
- 일간 intake
- 주간 리뷰
- 월간 리뷰
- retry / cleanup / sweep

**장점**
- cron 자산을 회사 운영 루틴으로 승격할 수 있다.
- 실행 이력과 운영 의미를 함께 남길 수 있다.

**주의점**
- 운영 루틴은 실행 트리거이지, 최종 판단 주체가 아니다.

### 4. 도구 실행 단계

deterministic script/tool을, Paperclip이 감독하는 말단 실행기로 다루는 패턴이다.

**언제 쓰는가**
- parser
- renderer
- deploy script
- batch job
- build/test pipeline

**장점**
- 이미 검증된 실행기를 버리지 않는다.
- AI 판단과 deterministic 처리를 분리할 수 있다.

**주의점**
- 도구가 운영 정책까지 떠맡게 하면 다시 배치 스크립트 중심으로 퇴행한다.

### 5. 품질 검토 게이트

“이 결과물이 충분히 좋은가?”를 확인하는 단계다. 승인과는 다르다.

**장점**
- 품질 관리가 승인권자의 개인 감각에만 의존하지 않는다.
- 재작업 루프가 구조화된다.

**주의점**
- 품질 검토는 publish/go-live 권한과 동일하지 않다.
- 모든 작업에 강제하면 오너가 피곤해진다.

### 6. 승인 게이트

“이 행동을 허용할 것인가?”를 묻는 단계다. 이건 품질 검토보다 거버넌스에 가깝다.

**언제 쓰는가**
- 게시 승인
- 예산 초과 후 재개
- 긴급 발행/오픈
- 신규 역할 채용

**주의점**
- 기본값이 아니라 고위험 행동에만 거는 편이 좋다.

### 7. 역할 간 handoff

한 역할의 결과가 다음 역할의 입력이 되는 패턴이다.
사람 조직처럼 일하게 만들기 위한 핵심 구조다.

**장점**
- 역할 경계가 명확해진다.
- 사람 조직과 유사한 협업 구조를 만들 수 있다.

**주의점**
- handoff 기준이 문서화되지 않으면 병목과 책임 회피가 생긴다.

### 8. 프로젝트 간 운영 기억 승격

프로젝트 A에서 잘된 방식을 프로젝트 B에서도 쓰려면,
좋은 결과를 **회사 공용 규칙**으로 승격하는 패턴이 필요하다.

예:
- 잘 먹힌 결과물 묶음 형식
- review checklist
- casting 기준
- QA 기준
- retry / recovery 운영 방식

이 패턴의 기본 흐름은:

```text
project A 실행 → 회고/정리 → CEO가 공용 playbook으로 승격 → project B 적용
```

**장점**
- 같은 회사가 여러 프로젝트를 유기적으로 수행할 수 있다.
- 같은 실수를 반복하지 않게 된다.
- 회사가 단순 task runner가 아니라 운영 학습 조직에 가까워진다.

**주의점**
- 자동 학습처럼 기대하면 안 된다.
- 이 승격 작업은 CEO나 리드가 명시적으로 해줘야 한다.
- 프로젝트 전용 판단까지 무리하게 공용 규칙으로 올리면 오히려 품질이 떨어질 수 있다.

### 9. 복구 / 재큐잉 경로

실패를 에러 메시지로만 남기지 않고,
다음 행동을 만드는 상태로 다루는 패턴이다.

**장점**
- 운영 복구 속도가 빨라진다.
- 실패가 시스템 안에서 추적 가능하다.

**주의점**
- 자동 재시도만 늘리면 문제를 숨길 수 있다.
- 언제 자동 복구하고 언제 사람에게 escalation할지 경계가 필요하다.

## 오케스트레이션을 바꾸고 싶을 때 어디를 고칠까

| 바꾸고 싶은 것 | 먼저 볼 문서/설정 |
| --- | --- |
| 역할 책임 | `AI-COMPANY.md`, Agent Instructions |
| 회사 공용 규칙/재사용 방식 | `AI-COMPANY.md`의 3층 기억 구조, company playbook, 실행 패킷 규약 |
| 운영 루틴/주기 | routine 정의, schedule, concurrency 정책 |
| 품질 검토 기준 | reviewer 지침, CEO review 기준 |
| 승인 기준 | approval 정책, CEO/보드 기준 |
| deterministic 실행기 | 도구 실행 단계 경계, 실행 스크립트 |
| 결과물 묶음 기준 | 결과물 묶음 규칙, output 규칙, 예시 문서 |

## examples와의 관계

이 문서는 범용 패턴 문서다.
구체 예시는 아래를 본다.

- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md)
- [`examples/rovel-ai2.md`](./examples/rovel-ai2.md)
