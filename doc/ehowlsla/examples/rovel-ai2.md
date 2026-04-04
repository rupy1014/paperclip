# 예시 — rovel.ai2

> **상태**: 예시
> **목적**: `rovel.ai2`를 `ehowlsla` overlay 관점에서 어떻게 운영 모델에 대입할 수 있는지 보여준다.
> **대상 독자**: 스튜디오형 프로젝트를 Paperclip 회사로 해석하려는 독자
> **관련 문서**: [`../README.md`](../README.md), [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md), [`../ORCHESTRATION-PATTERNS.md`](../ORCHESTRATION-PATTERNS.md)


이 문서는 `rovel.ai2`를 Paperclip 회사로 어떻게 설정하고 운영할 수 있는지에 대한 예시다.

## 프로젝트 성격

`rovel.ai2`는 **콘텐츠 스튜디오 + 제품 개발팀 + 운영팀**이 함께 돌아가는 혼합형 프로젝트다.

기본 제품은 읽기 중심이지만,
내부 creator flow는:
- 업로드
- 파싱
- 역할 추출
- 캐스팅
- 자산 패키지 정리
- VN/story mode 구성
- QA / release

를 요구한다.

중요한 전제:
- 모든 작품이 곧바로 full VN production으로 가는 것은 아니다.
- 기본값은 텍스트 공개와 비주얼 리딩이다.
- **에디터픽 선정 작품만** 깊은 파싱·캐스팅·VN 시각화 라인으로 승격된다.

## 기준 모델 대응

- 내부 실행 단위: **실행 패킷(production packet)**
- 오너가 판단하는 결과물: **결과물 묶음(deliverable bundle)**
- 기준 actor: `board`, overlay UX 호칭: `owner`

## 추천 회사 설정

### 회사
- 이름: `Rovel Studio`

### 역할
- CEO / Executive Producer
- Story Lead
- Casting & Asset Lead
- VN Production Lead
- QA / Release Lead
- Platform Engineer

### 프로젝트
#### 최소 구성
- `Platform & Studio Ops`
- `Works in Production`

#### 확장 구성
중요 작품은 별도 프로젝트로 승격
- `작품 A 각색`
- `작품 B VN 오픈 준비`
- `작품 C 캐스팅 패키지`

이때 중요한 점은,
프로젝트를 나눈다고 해서 팀이 완전히 분리되는 것이 아니라
같은 회사의 CEO / Story Lead / QA Lead가 여러 작품 프로젝트를 오가며 일할 수 있다는 것이다.
작품 A에서 잘된 실행 패킷 형식이나 review 기준은 작품 B의 기본 방식으로 재사용할 수 있다.

## 추천 실행 패킷 / 결과물 묶음

현재 Paperclip 기준으로는 별도 `Work` 객체를 만들기보다,
작품 하나를 아래처럼 다루는 것이 현실적이다.

### 추천 실행 패킷
- `source`
- `adaptation_brief`
- `casting_package`
- `asset_package`
- `vn_package`
- `release_candidate`

즉:
**작품 하나 = top-level issue + reserved documents + work-products 묶음**

내부 실행 단위는 **실행 패킷**으로 보고,
오너가 판단하는 결과물은 **결과물 묶음**으로 보는 편이 자연스럽다.

여기서 내부 실행 단위는 **실행 패킷**이고,
오너가 보는 결과물 묶음은 **결과물 묶음**으로 읽는 편이 맞다.

## 런타임 연결 방식

### 추천 기본값
- `rovel.ai2` 저장소와 Paperclip을 같은 머신 또는 같은 사설망에 둔다.
- process adapter / local CLI 방식으로 `pnpm`, 변환 스크립트, worker, build를 실행한다.
- 작품 파이프라인 결과만 Paperclip documents/work-products에 귀속한다.

### 다른 머신에서 에이전트가 돌면
- `authenticated + private`
- agent API key
- VPN/Tailscale/내부망 우선

### 공개 인터넷이 필요한 경우
- 외부 원격 에이전트
- 외부 SaaS callback/webhook
- 오너가 공용 인터넷에서 직접 접속

이때만 `authenticated + public`을 고려한다.

## 지금 실제로 있는 것 vs 아직 목표인 것

### 지금 실제로 있는 것
- 읽기 중심 제품 정의
- creator flow 문서
- 콘텐츠 운영/QC 기준
- story review wave dispatch / stale requeue / resume 운영 문서
- `worker:start`, `worker:pm2` 같은 queue worker 실행 경로

### 아직 목표에 가까운 것
- 업로드부터 캐스팅, VN release까지가 하나의 완성된 제품 UX
- CEO 브리핑에서 작품 결과물 묶음이 자연스럽게 보이는 운영 UX
- 실행 패킷이 Paperclip 안에서 일관되게 보이는 표준 모델

## 오너 루프

오너는 보통:
- 이 작품을 왜 지금 밀어야 하는가
- adaptation 방향이 맞는가
- 캐스팅/자산 감각이 맞는가
- VN 패키지가 충분히 매력적인가
- 지금 오픈해도 되는가

만 보고,
기본적으로는 **CEO에게만 피드백**하면 된다.

## 짧은 운영 trace 예시

1. 오너가 CEO에게 새 작품 방향을 전달한다.
2. CEO가 `Works in Production` 안에 top-level issue를 만든다.
3. Story Lead가 `source`, `adaptation_brief`를 채운다.
4. Casting & Asset Lead가 `casting_package`, `asset_package`를 만든다.
5. VN Production Lead가 `vn_package`와 preview를 work-product로 올린다.
6. QA / Release Lead가 `release_candidate`를 점검한다.
7. CEO는 오너에게 결과물 묶음을 브리핑하고, 오너는 go / no-go를 준다.

## 지금 가능한 것

- 회사/조직 구조 만들기
- 프로젝트/이슈/문서/산출물 묶기
- 코드 작업 lane 운영
- 운영 루틴/반복 운영
- 오너-CEO 중심 구조를 문서상으로 유지
- 한 작품에서 검증된 운영 방식을 다른 작품 프로젝트에 재사용

즉 **시뮬레이션은 지금도 가능**하다.

## 부족한 점

### P0
- CEO 브리핑 전용 뷰
- 결과물 묶음 UI
- 선택형 review / approval 정책
- 실행 패킷 관례를 제품적으로 더 잘 드러내는 것

### P1
- 작품 제작용 프로젝트 템플릿
- asset/reference 전용 카드
- wave/program 단위 대량 콘텐츠 정리 UX

### 아직 과한 것
- Paperclip 자체의 VN 엔진화
- 캐스팅 알고리즘을 Paperclip 코어로 흡수
- 대규모 workflow 엔진 먼저 도입
- 모든 단계 mandatory approval

## 템플릿 시드로 옮길 때의 매핑

`rovel.ai2`는 더 강력한 템플릿 시드가 될 수 있지만,
`ai-jobdori`보다 먼저 규약을 더 많이 정리해야 한다.

실제 패키지 트리 초안은 [`rovel-ai2-package-draft.md`](./rovel-ai2-package-draft.md)를 본다.

### package로 옮길 때의 기본 매핑
- 회사 설명 → `COMPANY.md`
- Executive Producer / Story / Casting & Asset / VN / QA / Platform → `agents/*/AGENTS.md`
- `Platform & Studio Ops`, `Works in Production` → `projects/*/PROJECT.md`
- 작품 승격 review, release review, weekly production review → starter `TASK.md` 또는 recurring routine
- packet key / runtime / asset dependency 메모 → `.paperclip.yaml` + README

### 처음 가져와서 제일 먼저 고칠 것
- 작품 승격 기준(editor-pick 기준)
- repo/workspace/runtime 경로
- asset 생성/저장 경로
- preview / release 판단 기준
- 작품별 reserved document key 규칙

### 그대로 재사용하기 좋은 것
- CEO-only owner communication 구조
- 작품을 packet 단위로 다루는 모델
- 역할 분업 구조
- editor-pick만 deep production으로 보내는 운영 원칙
