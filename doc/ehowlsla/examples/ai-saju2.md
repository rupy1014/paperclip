# 예시 — ai-saju2 (운세냥)

> **상태**: 예시
> **목적**: `ai-saju2`를 `ehowlsla` overlay 관점에서 B2C SaaS 운영 모델에 대입한다. 특히 산출물 품질 체계(가정 레지스트리, 실행→학습 루프, 역할 간 교차 학습)의 검증에 초점을 맞춘다.
> **대상 독자**: B2C SaaS 프로젝트를 Paperclip 회사로 해석하려는 독자
> **관련 문서**: [`../README.md`](../README.md), [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md), [`../ORCHESTRATION-PATTERNS.md`](../ORCHESTRATION-PATTERNS.md)


이 문서는 `ai-saju2`(운세냥, jeommyo.com)를 Paperclip 회사로 설정하고 운영하는 예시다.

기존 두 예시(ai-jobdori, rovel.ai2)와 다른 점은,
이 프로젝트가 **"만드는 것"보다 "만든 것을 팔고 개선하는 것"**에 무게가 있다는 점이다.

## 프로젝트 성격

`ai-saju2`는 **AI 기반 사주 분석 B2C SaaS 서비스**다.

실제 자산:
- Next.js/Vercel 기반 프론트엔드 (jeommyo.com)
- Mac mini 기반 AI 리포트 생성 파이프라인 (13장, 5만자)
- Bootpay 결제, Kakao 로그인, Supabase DB
- 관리자 대시보드 (admin.jeommyo.com)
- Kakao AlimTalk CRM

제품 자체는 이미 라이브 상태이고,
지금 필요한 것은 마케팅 → 전환 → retention → viral 루프를 운영하는 것이다.

## 기준 모델 대응

- 내부 실행 단위: **실행 패킷(production packet)**
- 오너가 판단하는 결과물: **결과물 묶음(deliverable bundle)**
- 전략 판단 단위: **의사결정 패키지(decision package)**
- 기준 actor: `board`, overlay UX 호칭: `owner`

## 추천 회사 설정

### 회사
- 이름: `Unseonyaang` 또는 `운세냥 Inc`

### 역할
- CEO: 전체 방향, 오너 브리핑, Phase 전환 판단, 의사결정 패키지 제출
- CMO: 채널 전략, 캠페인 기획, KPI 설정, 크리에이티브 기획
- Engineer: 제품 구현, share card, 결제, 인프라, 성능
- Data/Growth: 전환 분석, A/B 테스트, retention 분석, KPI 측정

### 프로젝트
- `Growth Operations`: 마케팅 캠페인, 채널 운영, viral loop
- `Product Development`: 신규 기능, UX 개선, 기술 부채

같은 회사 안에서 두 프로젝트의 역할은 겹친다.
CMO가 Growth Operations에서 세운 전략이 Product Development의 feature 우선순위에 영향을 준다.

## 왜 이 예시가 특별한가

ai-jobdori와 rovel.ai2는 "제작 파이프라인" 중심이라
결과물 묶음과 실행 패킷 규약을 검증하기 좋다.

ai-saju2는 **산출물 품질 체계를 검증하기 가장 좋은 예시**다.
이유는 세 가지다.

### 1. 실행 결과가 숫자로 떨어진다

| 측정 항목 | 단위 | 측정 주기 |
| --- | --- | --- |
| DAU | 명 | 일간 |
| Landing → Input 전환율 | % | 일간 |
| Input → Payment 전환율 | % | 일간 |
| CPA (채널별) | 원 | 주간 |
| ARPU | 원 | 주간 |
| Share card 생성률 | % (결제자 대비) | 주간 |
| K-factor | 배수 | 월간 |

이 숫자들이 기대와 다르면 즉시 전략 수정이 필요하다.
실행→학습 루프의 threshold를 정하기 가장 쉬운 환경이다.

### 2. CMO 산출물에 검증 안 된 가정이 많다

실제 CMO 산출물에서 발견된 미검증 가정 예시:

```yaml
assumptions:
  - claim: "인플루언서 1건당 5-60만원"
    confidence: low
    source: estimate
    verification: "3곳 이상 DM 문의로 실제 단가 확인"
  - claim: "Phase 1 DAU 목표 50명"
    confidence: low
    source: estimate
    verification: "Phase 1 2주 실행 후 실제 측정"
  - claim: "landing → input 전환율 30%"
    confidence: medium
    source: benchmark
    verification: "유사 서비스 전환율 데이터 수집 + Phase 1 데이터"
  - claim: "Instagram이 주요 채널"
    confidence: medium
    source: estimate
    verification: "Phase 2 채널별 CPA 비교"
  - claim: "CPA 상한선 미정"
    confidence: low
    source: not_set
    verification: "19,800원 제품 가격 대비 마진 계산 후 설정"
```

이런 가정이 명시되지 않으면 CEO가 오너에게 "마케팅 예산 100만원 집행"을 추천할 때
오너는 어디가 검증된 것이고 어디가 희망인지 알 수 없다.

### 3. 역할 간 교차 학습이 명확하다

| 발견 역할 | 제약/인사이트 | 영향 받는 역할 |
| --- | --- | --- |
| Engineer | OG 이미지 동적 생성은 서버 비용이 크다 | CMO → OG card 우선순위 재조정 |
| Engineer | 모바일 결제 완료율 80% 미달 | CMO → 모바일 랜딩 전략 수정 |
| Data | 특정 채널 CPA가 제품 가격 50% 초과 | CMO → 해당 채널 예산 축소 |
| CMO | share card 바이럴이 예상보다 강함 | Engineer → share card UX 우선 개선 |

## 운영 패턴 대입

### 실행 패킷 — 마케팅 캠페인

```text
Production Packet: "Phase 1 마케팅 캠페인"
├── issue: Phase 1 마케팅 실행
├── reserved documents:
│   ├── channel_playbook: 채널별 전략 + 콘텐츠 계획
│   ├── budget_plan: 채널별 예산 배분
│   ├── kpi_targets: 측정 기준 + threshold
│   └── assumption_registry: 가정 목록
├── work-products:
│   ├── creative_assets: 카드뉴스, Reels, 커뮤니티 글
│   ├── campaign_configs: UTM, 광고 세팅
│   └── weekly_reports: 주간 KPI 실적
├── state: draft → executing → review → retro
└── owner_role: CMO (CEO가 오너에게 올릴 때 의사결정 패키지로 묶음)
```

### 의사결정 패키지 — Phase 1 론칭

```text
Decision Package: "ai-saju2 마케팅 Phase 1 론칭"
├── Context: 제품 라이브, 마케팅 0건, 유료 사용자 0명
├── Deliverable Bundle:
│   ├── channel-playbook.md (요약)
│   ├── metrics.md (요약)
│   └── roadmap.md (요약)
├── CEO Assessment:
│   ├── 강점: 한국 채널 이해도 높음, 3단계 순차 접근
│   ├── 리스크: CPA 상한선 미정, 인플루언서 단가 미검증
│   └── 빠진 것: Phase 1 실패 시 pivot 기준
├── Assumption Registry Summary:
│   ├── 미검증 가정: 5건
│   ├── 고위험(low confidence): 3건
│   └── 첫 번째 검증 필요: CPA 상한선 설정
├── Decision Required:
│   ├── [승인] Phase 1 예산 100만원 집행, 2주 후 retro
│   ├── [수정요청] CPA 상한선 먼저 정하고 재제출
│   └── [보류] organic share card 효과 먼저 검증
└── Deadline: 론칭 후 1주 이내
```

### 실행→학습 루프 — Phase 1 이후

```text
Phase 1 실행 (2주)
  → 주간 KPI 측정
    → DAU: 목표 50 vs 실제 15 (차이 70% > threshold 30%)
      → retro issue 자동 생성: "Phase 1 DAU 미달 원인 분석"
        → CMO: 채널별 유입 분석 → Instagram 유입 3명/일, 커뮤니티 12명/일
          → 학습: "커뮤니티 seeding이 Instagram보다 초기 효과 큼"
            → Phase 2 예산 재배분: Instagram 광고 축소, 커뮤니티 집중
              → company playbook 승격 후보: "B2C 초기 채널은 커뮤니티 우선"
```

### 역할 간 교차 학습 — 예시 흐름

```text
Engineer: "share card 이미지 서버 생성 비용 건당 15원, 월 10만건이면 150만원"
  → CEO 판단: CMO의 share card 우선 전략에 영향 있음
    → CMO에게 수정 요청 이슈 생성:
      "share card를 이미지 저장 방식에서 OG meta tag 방식으로 우선 변경 검토"
    → CMO: 채널 전략에서 "이미지 저장 → 갤러리 공유" 경로를 후순위로 변경
```

## 운영 루틴

| 루틴 | 주기 | 담당 | 설명 |
| --- | --- | --- | --- |
| weekly-growth-review | 주간 | Data → CEO | KPI 측정, threshold 체크, retro trigger |
| campaign-retro | 캠페인 종료 시 | CMO → CEO | 가정 검증 결과, 학습, 전략 수정 |
| monthly-strategy-review | 월간 | CEO → 오너 | Phase 진행 상황, playbook 승격 후보, 다음 phase 판단 |
| feature-prioritization | 격주 | CEO | Growth Operations 인사이트 → Product Development 우선순위 |

## 3층 기억 구조 대입

### 회사 공용 기억
- B2C SaaS 채널 우선순위 판단 기준
- CPA 상한선 계산 공식 (제품 가격 × margin rate)
- 가정 레지스트리 confidence level 기준
- retro threshold 기본값 (±30%)
- 마케팅 Phase 전환 기준

### 프로젝트 전용 기억 (Growth Operations)
- 현재 Phase와 KPI 목표
- 채널별 실행 현황
- 활성 캠페인 목록
- Phase 1에서 검증/반증된 가정 기록

### 에이전트 개인 지식
- CMO: 한국 SNS 채널 특성, 인플루언서 DM 협상 팁
- Engineer: Bootpay 결제 연동 주의점, Vercel 이미지 생성 제약
- Data: GA4 + Supabase 데이터 조인 방법, UTM 파싱 패턴

## 외부 서비스 감시 및 코드 수정 — report-worker

ai-saju2의 핵심 인프라인 **report-worker**(사주 리포트 생성 파이프라인)는
Paperclip 외부에서 독립적으로 동작한다.

현재 자체 복구 메커니즘:
- launchd `KeepAlive: true` → 프로세스 크래시 시 자동 재시작
- PID lock → 중복 실행 방지
- stall recovery → 10분 heartbeat 없으면 stalled job 자동 복구
- job timeout → 개별 job 무한 대기 방지

**하지만 근본 원인이 코드 버그인 경우** 자체 복구로는 해결이 안 된다.
같은 에러가 반복 발생하면서 stall recovery만 무한 반복되는 상태가 된다.

### Paperclip 통합 운영 모델

```text
에이전트: saju-infra-engineer
  cwd: ~/sjtalk
  adapter: claude-local
  역할: engineer
```

#### 감시 루틴

| 루틴 | 주기 | 체크 대상 | 이상 판단 |
| --- | --- | --- | --- |
| report-worker-health | 3분 | PID 파일 존재 + 프로세스 alive | pid 없거나 dead |
| report-worker-stall | 10분 | worker status의 lastHeartbeat | 10분 초과 무응답 |
| report-worker-error-rate | 30분 | 최근 30분 에러 로그 카운트 | 5건 이상 실패 |

#### 복구 수준별 행동

```text
L1 — 프로세스 죽음 (launchd 미복구 시)
  → 자동: launchctl kickstart -k gui/$(id -u)/com.ai-saju2.report-worker
  → gate: advisory (알림만)
  → learning event: 기록만

L2 — 반복 실패 / stalled job 누적
  → 에이전트가 이슈 할당받아 조사:
    1. ~/Library/Logs/ai-saju2/*.log 분석
    2. server/worker/report-worker.mjs 코드 확인
    3. 원인 파악 → 코드 수정 → npm test
    4. git commit (feature branch)
  → gate: blocking (CEO 승인 후 재시작)
  → learning event: 원인 + 수정 내역 기록
    → threshold 초과 시 retro issue 자동 생성

L3 — 외부 의존성 문제 (LLM API 장애, Supabase 다운 등)
  → 의사결정 패키지 제출:
    "report-worker 장애 — 외부 API 원인, 대응 옵션 3가지"
  → gate: blocking
  → 오너 판단 대기
```

#### 실제 시나리오 — report-worker 좀비 복구

```text
report-worker-error-rate 루틴이 30분간 8건 실패 감지
  → 이슈 자동 생성: "[Watchdog] report-worker 에러율 급증"
  → saju-infra-engineer 에이전트 할당
  → 에이전트가 ~/sjtalk에서 작업:
    1. tail -100 ~/Library/Logs/ai-saju2/*.err.log
       → "TypeError: Cannot read properties of undefined (reading 'birthYear')"
    2. grep -rn 'birthYear' server/worker/process-report-job.mjs
       → 입력 validation 누락 발견
    3. 코드 수정: null check 추가
    4. npm test → pass
    5. git checkout -b fix/report-worker-null-birth
    6. git commit -m "fix: null check for birthYear in report-worker"
  → gate policy 체크: 코드 수정 있음 → blocking
  → CEO에게 승인 요청 (decision package 아님, 단순 gate approval)
  → CEO 승인
  → launchctl kickstart → 서비스 재시작
  → learning event 생성:
    trigger: deviation_detected
    expected: "에러율 0"
    actual: "30분간 8건 실패"
    constraint: "report-worker 입력은 반드시 birthYear null check 필요"
  → constraint가 company playbook에 승격 후보로 등록
```

#### gate policy 설정

| action | mode | scope | 설명 |
| --- | --- | --- | --- |
| restart_external_service | advisory | company | L1 재시작은 알림만 |
| deploy | blocking | project:sjtalk | 코드 수정 후 배포는 승인 필요 |
| strategy_change | blocking | company | L3 외부 의존성 대응은 오너 판단 |

### 이 패턴이 ai-saju2에 특히 유용한 이유

1. **리포트 생성은 매출 직결** — worker 장애 = 결제 완료 사용자에게 리포트 미제공 = CS 폭주
2. **Mac mini 단일 머신** — Paperclip과 report-worker가 같은 머신에서 동작하므로 에이전트가 직접 접근 가능
3. **자체 복구 한계가 명확** — stall recovery는 "같은 에러로 재시도"만 하므로 코드 버그에 무력
4. **learning loop 연결 가능** — 반복 장애 패턴이 playbook으로 축적되면 같은 유형의 버그를 사전 방지

## 이 예시가 ehowlsla에 기여하는 것

| 컨셉 | ai-jobdori | rovel.ai2 | ai-saju2 |
| --- | --- | --- | --- |
| 결과물 묶음 | ◎ publish candidate | ◎ release candidate | ○ campaign package |
| 실행 패킷 | ○ | ◎ | ○ |
| CEO 브리핑 | ◎ | ◎ | ◎ |
| 가정 레지스트리 | △ | △ | ◎ 마케팅 가정 |
| 실행→학습 루프 | △ | △ | ◎ KPI 피드백 |
| 의사결정 패키지 | △ | ○ | ◎ 예산/전략 판단 |
| 역할 간 교차 학습 | △ | ○ | ◎ CMO ↔ Engineer |
| 외부 서비스 감시/복구 | △ | △ | ◎ report-worker watchdog |
| 외부 코드베이스 작업 | △ | △ | ◎ ~/sjtalk 직접 수정 |

즉 ai-saju2는 ehowlsla의 **Phase 5(산출물 품질 체계)를 검증하는 primary test bed**이면서,
동시에 **외부 프로세스 감시/코드 수정 패턴(패턴 14, 15)의 첫 번째 적용 사례**이기도 하다.
