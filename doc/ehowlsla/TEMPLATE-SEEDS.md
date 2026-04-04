# 템플릿 시드

> **상태**: 제안
> **목적**: `examples/` 문서를 실제 importable template seed로 키우는 방향을 정리한다.
> **대상 독자**: 템플릿/템플릿 시드 전략을 정리하려는 독자
> **관련 문서**: [`README.md`](./README.md), [`examples/README.md`](./examples/README.md)
> **정합 기준**: [`../SPEC-implementation.md`](../SPEC-implementation.md)


이 문서는 `ehowlsla` 브랜치에서
**현재 Paperclip 템플릿 생태계가 어디까지 와 있는지**와
**`examples/` 문서를 어떻게 실제 템플릿 시드로 발전시킬지**를 정리한다.

핵심 판단은 이렇다.

> 지금 Paperclip에는 회사 패키지 포맷과 최소 예시는 있지만,
> 풍부한 검증된 템플릿 카탈로그는 아직 초기 단계다.
> 따라서 `ehowlsla/examples/*`는 단순 예시를 넘어서
> 실전 템플릿 시드 역할을 하게 만드는 편이 가장 현실적이다.

## 1. 지금 공식적으로 있는 것

### 1) 회사 패키지 포맷

V1 스펙에는 이미 회사 import/export와 portable package 구조가 있다.

기본 구조:
- `COMPANY.md`
- `agents/<slug>/AGENTS.md`
- `teams/<slug>/TEAM.md`
- `projects/<slug>/PROJECT.md`
- `projects/<slug>/tasks/<slug>/TASK.md`
- `tasks/<slug>/TASK.md`
- `skills/<slug>/SKILL.md`
- `.paperclip.yaml`

즉 “템플릿을 담는 그릇”은 이미 있다.

### 2) 최소 예시 회사 패키지

저장소와 스펙 문서에는 `Lean Dev Shop` 같은 최소 예시가 있다.
이건 완성된 산업별 템플릿이라기보다,
**회사 패키지가 어떤 구조를 가져야 하는지 보여주는 기준 예시**에 가깝다.

### 3) 템플릿/레지스트리 방향

README와 `doc/CLIPHUB.md`를 보면,
장기적으로는 ClipHub/Clipmart 스타일의 템플릿 생태계를 지향한다.

여기서 이름은 아직 정리 중인 로드맵 용어로 보는 편이 맞다.
README는 `Clipmart`, 설계 문서는 `ClipHub`를 쓰지만,
ehowlsla 관점에서는 둘 다 **공개 템플릿 레지스트리/마켓 방향**을 가리키는 개념으로 취급한다.

하지만 현재 ehowlsla 관점에서는
**“공식 마켓이 이미 풍부하다”보다 “포맷과 방향이 정리되어 있다”**는 쪽이 더 정확하다.

## 2. 지금 부족한 것

현재 부족한 것은 포맷이 아니라 **검증된 실전 템플릿 묶음**이다.

아직 약한 것:
- solo-owner 운영에 바로 쓸 수 있는 템플릿
- 콘텐츠 회사 / 스튜디오 / 하이브리드 운영용 템플릿
- 템플릿별 설정 팁, adapter/runtime 팁
- “이 템플릿을 가져오면 어디부터 고쳐야 하는가” 같은 운용 노하우

즉 지금 필요한 것은 템플릿 엔진보다
**쓸만한 템플릿 시드 + 적용 가이드**다.

## 3. ehowlsla에서 examples를 어떻게 볼까

이 문서 역시 현재 제품 기본값 설명서가 아니라,
`examples/`를 template seed로 발전시키기 위한 overlay proposal이다.


`examples/` 문서는 단순 사례 소개에서 끝나면 아쉽다.
이 브랜치에서는 examples를 아래처럼 본다.

- **예시 문서**: 특정 프로젝트에 컨셉을 대입해 설명한다
- **템플릿 시드**: 나중에 importable company package로 발전할 수 있는 구조를 정리한다

즉 `examples/ai-jobdori.md`, `examples/rovel-ai2.md`는
“좋은 설명 문서”이면서 동시에
**미래 템플릿의 설계 노트** 역할을 해야 한다.

## 4. 템플릿 시드가 최소한 갖춰야 할 것

각 예시 문서는 아래 6가지를 설명할 수 있어야 한다.

1. **회사 정체성**
   - 이 회사가 무엇을 하는가
2. **역할 구조**
   - CEO, 리드, 실무 역할
3. **프로젝트 구조**
   - 프로젝트를 어떻게 나누는가
4. **패킷/결과물 구조**
   - 오너가 무엇을 판단 단위로 보는가
5. **런타임 연결 방식**
   - process/local CLI, private API, external dependency
6. **가져와서 제일 먼저 고칠 것**
   - repo 경로, API 키, adapter, schedules, playbook

이 6가지를 설명할 수 있으면,
문서가 단순 use case를 넘어 template seed로 기능하기 시작한다.

## 5. importable package로 가려면 무엇이 더 필요할까

문서를 실제 회사 패키지로 바꾸려면,
대략 아래 매핑이 필요하다.

### 공통 매핑

- 회사 설명 → `COMPANY.md`
- 역할 설명 → `agents/*/AGENTS.md`
- 팀 묶음 → `teams/*/TEAM.md`
- 프로젝트 설명 → `projects/*/PROJECT.md`
- recurring 운영 루틴 → `tasks/*/TASK.md` 또는 프로젝트 starter task
- adapter/runtime/env 차이 → `.paperclip.yaml`

### ehowlsla에서 중요하게 추가로 필요한 것

- CEO-only owner communication 원칙
- optional review / approval 기본값
- 실행 패킷 reserved document keys
- 회사 공용 playbook / project brief / 개인 working style 구분

즉 표준 포맷만 맞춘다고 좋은 템플릿이 되는 건 아니고,
`ehowlsla`가 정리한 운영 원칙도 같이 들어가야 한다.

## 6. ai-jobdori를 템플릿 시드로 보면

강한 점:
- deterministic 파이프라인이 분명하다
- 역할 구성이 작고 이해하기 쉽다
- 운영 루틴이 명확하다
- publish candidate 중심 결과물 구조가 있다

템플릿으로 옮길 때 핵심:
- `Daily Operations`, `Content Improvement` 프로젝트
- 편집장 / 큐레이터 / 작가 / 엔지니어 역할
- `daily-rss-intake`, `weekly-review`, `publish-retry` 같은 starter task/routine
- 외부 큐/배포/API 의존성은 `.paperclip.yaml` 또는 템플릿 README에서 명시

즉 ai-jobdori는 **가장 빨리 importable seed로 만들 수 있는 예시**다.

## 7. rovel.ai2를 템플릿 시드로 보면

강한 점:
- 콘텐츠 스튜디오형 회사 구조가 분명하다
- packet 개념이 강하게 필요하다
- 멀티 프로젝트/멀티 작품 운영을 설명하기 좋다

어려운 점:
- 도메인 특수성이 더 크다
- 모든 작품이 같은 production line으로 가지 않는다
- asset/reference/packet 표현이 더 중요하다

템플릿으로 옮길 때 핵심:
- `Platform & Studio Ops`, `Works in Production` 프로젝트
- Executive Producer / Story / Casting & Asset / VN / QA / Platform 역할
- 작품 승격 기준과 editor-pick 기준
- `source`, `adaptation_brief`, `casting_package`, `release_candidate` 같은 reserved keys

즉 rovel은 **더 강력한 템플릿 시드**지만,
ai-jobdori보다 템플릿으로 굳히는 데 더 많은 규약이 필요하다.

## 8. 지금 당장 가장 실용적인 방향

현재 단계에서 가장 현실적인 접근은:

1. 예시 문서를 템플릿 시드 문서로 보강
2. 각 예시에 “package mapping / first customization points” 추가
3. package draft 문서로 한 번 더 내린다
4. 나중에 실제 company package로 추출 가능한 구조를 유지

즉 지금은
**문서 → 템플릿 시드 → package draft → importable package**
순서가 맞다.

바로 package부터 만들면 오히려 너무 이르게 굳어질 수 있다.

프로젝트별 package draft는 아래를 본다.

- [`examples/ai-jobdori-package-draft.md`](./examples/ai-jobdori-package-draft.md)
- [`examples/rovel-ai2-package-draft.md`](./examples/rovel-ai2-package-draft.md)

## 9. 템플릿 시드를 읽는 사람에게 주는 팁

템플릿을 그대로 믿고 가져오면 안 되고,
최소한 아래를 먼저 고쳐야 한다.

### 반드시 먼저 바꿀 것
- 회사 이름과 목표
- repo/workspace 경로
- adapter 선택
- env / secrets / 외부 API 경로
- publish / release 기준
- owner feedback 방식

### 그대로 재사용해도 좋은 것
- 역할 구조
- packet 구조
- review checklist 구조
- 반복 운영 routine의 뼈대
- CEO 중심 handoff 패턴

## 10. 한 줄 결론

`ehowlsla/examples/*`는 지금부터
**“사례 문서”이면서 동시에 “미래 Paperclip 템플릿 시드”**
로 관리하는 것이 가장 실용적이다.
