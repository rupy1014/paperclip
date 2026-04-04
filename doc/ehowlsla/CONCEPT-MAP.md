# ehowlsla 개념 매핑

> **상태**: 제안
> **목적**: Paperclip의 기준 용어와 `ehowlsla` overlay 용어를 짧고 일관되게 매핑한다.
> **대상 독자**: `doc/ehowlsla/` 문서를 수정하거나 새 문서를 추가하는 기여자
> **관련 문서**: [`README.md`](./README.md), [`STRATEGY.md`](./STRATEGY.md), [`AI-COMPANY.md`](./AI-COMPANY.md), [`ORCHESTRATION-PATTERNS.md`](./ORCHESTRATION-PATTERNS.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md), [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md)

## 기본 규칙

1. 기준 용어를 먼저 둔다.
2. overlay 용어는 UX 해석이 필요할 때만 쓴다.
3. bare `package`는 umbrella noun으로 쓰지 않는다.
4. `packet`과 `bundle`은 다른 개념으로 유지한다.

## 핵심 용어 대응표

| 기준 용어 | ehowlsla 용어 | 사용 규칙 |
| --- | --- | --- |
| `board` | 보드 운영자(owner) | 기준 권한 주체는 `board`다. solo-operator UX를 강조할 때만 `owner`를 병기한다. |
| board dashboard | CEO 브리핑 | 오너 기본 진입점 UX를 설명할 때만 쓴다. 기준 제품 명칭으로 대체하지 않는다. |
| company | company | 그대로 유지한다. |
| issue | issue / packet root issue | 기준은 `issue`다. 실행 패킷의 anchor를 설명할 때만 보조적으로 붙인다. |
| documents + work-products | 결과물 자산 | 결과물 묶음을 구성하는 자산을 설명할 때 쓴다. |
| review | review | 품질 검토 의미로 그대로 유지한다. |
| approval | approval | 거버넌스/허용 결정 의미로 그대로 유지한다. |
| company knowledge / shared brain | company playbook | 범용 위키가 아니라 재사용 가능한 회사 운영 기억을 뜻할 때만 쓴다. |
| project-level context | project brief | 프로젝트 전용 목표/맥락/설정을 뜻할 때 쓴다. |
| agent instructions / role config | agent working style | 개인 작업 습관/실행 스타일 설명에 한정한다. |
| production packet | 실행 패킷 | `issue + reserved documents + work-products + state`의 내부 실행 단위다. |
| deliverable bundle | 결과물 묶음 | 오너/보드가 판단하는 결과물 묶음이다. |
| `local_trusted` | `local_trusted` | 기준 명칭을 그대로 유지한다. |
| `authenticated + private` | `authenticated + private` | 기준 명칭을 그대로 유지한다. |
| `authenticated + public` | `authenticated + public` | 기준 명칭을 그대로 유지한다. |
| package | legacy artifact key only | `draft_package` 같은 artifact key 이름에서만 제한적으로 유지한다. |

## actor 매핑

| 층 | 기준 표현 | ehowlsla 표현 | 규칙 |
| --- | --- | --- | --- |
| 권한 | board | owner | owner는 UX용 호칭일 뿐 권한 모델을 바꾸지 않는다. |
| 운영 창구 | manager / lead / assignee | CEO | 오너가 기본적으로 CEO와만 소통하는 UX를 설명할 때 쓴다. |
| 기본 경로 | board → tasks/issues | owner → CEO → operating roles | 권한 제한이 아니라 기본 운영 동선이다. |

## work 매핑

| 개념 | ehowlsla 용어 | 의미 |
| --- | --- | --- |
| 내부 실행 단위 | 실행 패킷(production packet) | 하나의 발행 후보 / 작품 production unit / 제작 단위를 내부적으로 다루는 단위 |
| 오너 판단 단위 | 결과물 묶음(deliverable bundle) | CEO 요약, 핵심 문서, preview, decision request를 포함하는 결과물 묶음 |

### 구분 규칙

- 실행 패킷 = 내부 실행 단위
- 결과물 묶음 = 오너 판단 단위
- 둘을 같은 뜻으로 섞어 쓰지 않는다

## 기억 구조 매핑

| 층 | ehowlsla 용어 | 의미 |
| --- | --- | --- |
| 회사 공용 기억 | company playbook | 여러 프로젝트에서 재사용되는 운영 표준 |
| 프로젝트 전용 기억 | project brief | 해당 프로젝트만의 목표, 설정, packet 상태 |
| 에이전트 개인 지식 | agent working style | 개인 습관, 체크 순서, 도구 숙련 팁 |

### 구분 규칙

- playbook은 공용 표준이다.
- project brief는 프로젝트 특수사항이다.
- agent working style은 개인 생산성 계층이지 공용 표준이 아니다.

## lifecycle 용어

| 용어 | 의미 |
| --- | --- |
| review | 결과물이 충분히 좋은가 |
| approval | 이 행동을 허용할 것인가 |
| release | 외부 공개 / 반영 / 오픈 |
| retry | 실패 후 복구 재시도 |
| archive | 종료 후 보관 |

`ehowlsla`는 review와 approval를 모두 유지하지만,
둘을 항상 mandatory로 두지 않는 쪽을 기본값으로 본다.

## deployment mode 용어

배포 모드 naming은 overlay에서 새로 만들지 않는다.
아래 기준 명칭을 그대로 유지한다.

- `local_trusted`
- `authenticated + private`
- `authenticated + public`

세부 의미는 [`../DEPLOYMENT-MODES.md`](../DEPLOYMENT-MODES.md)를 따른다.

## 헷갈리면 안 되는 것

- `packet` ≠ `bundle`
- `owner` ≠ `board` unless explicitly mapped
- `CEO 브리핑` ≠ 기준 dashboard 명칭
- `company playbook` ≠ 일반 위키
- bare `package` ≠ 허용된 umbrella noun
