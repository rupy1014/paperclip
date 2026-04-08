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
- 프로젝트별 적용은 `examples/ai-jobdori.md`, `examples/rovel-ai2.md`, `examples/ai-saju2.md`를 본다.

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

### 9. 의사결정 패키지 제출

여러 agent 산출물을 하나의 **오너 의사결정 단위**로 묶어서 올리는 패턴이다.
결과물 묶음(deliverable bundle)이 "무엇을 만들었는가"라면,
의사결정 패키지(decision package)는 "오너가 무엇을 판단해야 하는가"까지 포함한다.

**구조**
```text
Decision Package
├── Context: 현재 상태 요약
├── Deliverable Bundle: 산출물 묶음 (요약 + 원본 링크)
├── CEO Assessment:
│   ├── 강점
│   ├── 리스크
│   └── 빠진 것
├── Assumption Registry: 검증 안 된 가정 목록
├── Decision Required:
│   ├── [승인] 조건과 범위
│   ├── [수정요청] 무엇을 고쳐야 하는지
│   └── [보류] 선행 조건
└── Deadline
```

**언제 쓰는가**
- 예산 집행 판단
- 신규 프로젝트 론칭 승인
- 전략 방향 전환
- 여러 역할의 산출물이 묶여야 의미가 있는 판단

**장점**
- 오너가 파일 여러 개를 읽지 않고 한 장으로 판단할 수 있다.
- CEO의 평가와 리스크 분석이 함께 올라와서 판단 품질이 높아진다.
- 가정 레지스트리를 통해 "검증 안 된 것"이 명시적으로 드러난다.

**주의점**
- 모든 결과물을 decision package로 포장하면 오히려 오너 피로가 커진다.
- 일상 운영은 결과물 묶음 수준으로 충분하고, 전략적 판단에만 쓴다.

### 10. 가정 레지스트리(Assumption Registry)

agent 산출물에 포함된 가정을 **명시적으로 기록하고 추적**하는 패턴이다.

**구조**
```yaml
assumptions:
  - claim: "인플루언서 1건당 5-60만원"
    confidence: low    # low / medium / high
    source: estimate   # estimate / benchmark / verified
    verification: "3곳 이상 DM 문의로 실제 단가 확인"
  - claim: "landing → input 전환율 30%"
    confidence: medium
    source: benchmark
    verification: "Phase 1 2주 데이터로 검증"
```

**언제 쓰는가**
- agent가 전략 문서, 예산 계획, 시장 분석을 산출할 때
- 외부 데이터에 기반한 판단을 포함할 때
- 오너가 "이 숫자가 맞나?"라고 물을 수 있는 내용이 있을 때

**장점**
- CEO가 자동으로 "검증 안 된 가정 N건, 고위험 M건" 리스크 요약을 생성할 수 있다.
- 오너가 어디를 먼저 검증해야 하는지 알 수 있다.
- 가정이 검증되면 confidence를 올리고, 틀리면 전략을 수정하는 근거가 된다.

**주의점**
- 모든 산출물에 가정 레지스트리를 강제하면 과한 부담이 된다.
- 전략/예산/시장 관련 산출물에만 적용하고, 코드나 기술 산출물에는 불필요하다.
- confidence level 기준을 회사 playbook에 정의해두는 편이 좋다.

### 11. 실행→학습 자동 루프(Execution → Learning Loop)

실행 결과를 측정하고, 기대 대비 차이가 클 때 **자동으로 회고 이슈를 생성**하여
전략 수정과 playbook 승격까지 연결하는 패턴이다.

**흐름**
```text
실행 완료
  → 결과 측정 (KPI / 비용 / 산출물 품질)
    → 기대 vs 실제 비교
      → 차이 > threshold?
        ├── YES → retrospective issue 자동 생성
        │         → 원인 분석 (CEO or 담당 역할)
        │           → 전략 수정 or playbook 승격
        └── NO  → 다음 cycle 계속
```

**언제 쓰는가**
- 마케팅 캠페인 결과가 KPI와 크게 차이날 때
- 반복 운영(routine)의 비용이나 시간이 예상을 벗어날 때
- agent 산출물의 가정이 실행 후 틀린 것으로 드러났을 때

**구성 요소**
- **측정 기준**: KPI, 비용, 소요 시간, 품질 점수 등 (프로젝트별 정의)
- **threshold**: "기대 대비 ±30%" 같은 차이 기준 (회사 playbook에 정의)
- **retrospective issue**: 자동 생성되는 회고 이슈. 원본 실행 결과와 기대치를 포함
- **학습 경로**: retro에서 나온 개선점을 프로젝트 규약 또는 회사 playbook에 반영

**장점**
- 실행 결과가 전략에 자동으로 피드백된다.
- "잘못된 가정"이 다음 cycle에 수정 없이 반복되는 것을 방지한다.
- playbook 승격의 구체적 계기가 생긴다.

**주의점**
- threshold를 너무 낮게 잡으면 retro 이슈가 과다 발생한다.
- 자동 생성된 retro도 결국 사람(CEO/리드)이 판단해야 한다.
- 모든 실행에 적용하면 과하다. B2C 전환율, 비용, 품질 같은 핵심 지표에만 건다.

### 12. 역할 간 교차 학습(Cross-Role Learning)

한 역할의 실행 과정에서 발견한 제약이나 인사이트가
**다른 역할의 전략/계획에 반영**되는 패턴이다.

**흐름**
```text
역할 A 실행 중 제약/인사이트 발견
  → 관련 역할 B에 영향 있는지 판단 (CEO or 리드)
    → 영향 있으면 역할 B에 수정 요청 이슈 생성
      → 역할 B가 계획/산출물 수정
```

**예시**
- 엔지니어가 share card 구현 중 "OG 이미지 동적 생성은 서버 비용이 크다" 발견
  → CMO의 채널 전략에서 OG 카드 우선순위 재조정
- QA가 "모바일에서 특정 결과 페이지 로딩 5초 이상" 발견
  → 마케팅의 모바일 광고 랜딩 전략 수정

**장점**
- 실행 과정의 현실 제약이 전략 수준으로 올라온다.
- 역할 간 사일로를 방지한다.

**주의점**
- 모든 발견을 cross-role로 전파하면 소음이 된다.
- CEO나 리드가 "영향 범위 판단"을 해야 한다.
- 해당 역할의 자율성을 침해하지 않는 선에서 전달한다.

### 13. 복구 / 재큐잉 경로

실패를 에러 메시지로만 남기지 않고,
다음 행동을 만드는 상태로 다루는 패턴이다.

**장점**
- 운영 복구 속도가 빨라진다.
- 실패가 시스템 안에서 추적 가능하다.

**주의점**
- 자동 재시도만 늘리면 문제를 숨길 수 있다.
- 언제 자동 복구하고 언제 사람에게 escalation할지 경계가 필요하다.

### 14. 외부 프로세스 감시 및 자동 복구(External Process Watchdog)

같은 머신(또는 접근 가능한 호스트)에서 돌아가는 **Paperclip 외부 서비스**를
Paperclip 에이전트가 주기적으로 감시하고, 이상 시 복구하는 패턴이다.

**전제 조건**
- 대상 서비스가 health check endpoint 또는 PID 파일을 제공한다.
- 에이전트의 `cwd`가 대상 서비스 코드베이스로 설정 가능하다.
- 서비스 재시작 수단이 존재한다 (launchd, systemd, pm2, shell script 등).

**흐름**
```text
운영 루틴(routine) — 주기적 health check
  → 정상 → 다음 주기 계속
  → 이상 감지 (프로세스 죽음 / stalled job / 에러율 급증)
    → severity 판단
      ├── low (단순 프로세스 죽음) → 자동 재시작 + 알림
      ├── medium (반복 실패 / stalled) → 이슈 생성 + 에이전트 조사
      └── high (코드 버그 추정) → 이슈 생성 + CEO escalation
```

**복구 수준 3단계**

| 수준 | 트리거 | 에이전트 행동 | Gate Policy |
| --- | --- | --- | --- |
| L1 재시작 | 프로세스 죽음, launchd 미복구 | `launchctl kickstart` 또는 `kill + restart` | advisory (알림만) |
| L2 조사+수정 | 반복 실패, stalled job 누적, 에러 로그 패턴 | 로그 분석 → 원인 파악 → 코드 수정 → git commit → 재시작 | blocking (CEO 승인 후 실행) |
| L3 전략 escalation | 근본 원인이 외부 의존성(API 변경, 인프라 등) | 의사결정 패키지 제출 → 오너 판단 | blocking |

**왜 adapter가 아닌가**

Paperclip adapter는 "에이전트 런타임을 연결하는 인터페이스"다.
이 패턴은 에이전트가 **기존 인프라에 접근해서 직접 작업하는 것**이므로
adapter보다는 **에이전트 + 루틴 + gate policy 조합**이 맞다.

adapter가 적합한 경우:
- 외부 서비스의 job queue를 Paperclip issue로 동기화할 때
- 외부 서비스의 이벤트를 Paperclip webhook으로 받을 때

에이전트가 적합한 경우:
- 외부 서비스의 코드를 읽고 수정할 때
- 로그를 분석하고 원인을 판단할 때
- 수정 후 서비스를 재시작할 때

**장점**
- 외부 서비스를 Paperclip으로 마이그레이션하지 않고도 운영 통합이 된다.
- gate policy로 "재시작은 자동, 코드 수정은 승인 필요" 분리가 가능하다.
- learning loop과 연결하면 반복 장애의 근본 원인이 playbook에 축적된다.

**주의점**
- 에이전트에게 외부 코드베이스 write 권한을 주는 것이므로 gate policy가 반드시 필요하다.
- 자동 재시작만 반복하면 근본 원인을 숨긴다. L2 이상 조사가 연결되어야 한다.
- 외부 서비스의 배포 파이프라인이 있다면 그것을 통해 배포해야지, 직접 파일 수정으로 우회하면 안 된다.

### 15. 외부 코드베이스 직접 작업(External Codebase Agent)

에이전트의 작업 디렉토리(`cwd`)를 **Paperclip 외부 프로젝트**로 설정하여,
해당 프로젝트의 코드를 읽고, 수정하고, 테스트하고, 배포하는 패턴이다.

패턴 14(감시/복구)의 L2 수준에서 실제로 발동되는 실행 패턴이다.

**에이전트 설정**
```yaml
agent:
  name: "saju-infra-engineer"
  role: engineer
  adapterType: claude-local
  adapterConfig:
    cwd: "/Users/ehowlsla/sjtalk"   # 외부 프로젝트 경로
    env:
      ENV_FILE: "/Users/ehowlsla/sjtalk/.env.local"
  capabilities: "외부 서비스 모니터링, 장애 분석, 코드 수정, 서비스 재시작"
```

**작업 흐름**
```text
이슈 할당 (감시 루틴 또는 CEO가 생성)
  → 에이전트가 ~/sjtalk 에서 작업 시작
    → 로그 읽기: ~/Library/Logs/ai-saju2/*.log
    → 코드 분석: server/worker/report-worker.mjs
    → 원인 파악 + 수정
    → 테스트 실행: npm test
    → git commit (feature branch)
  → Gate Policy 체크
    ├── 코드 수정 있음 → blocking gate → CEO 승인 대기
    └── 재시작만 필요 → advisory gate → 즉시 실행
  → 서비스 재시작: launchctl kickstart
  → 결과 보고 (work product)
```

**언제 쓰는가**
- 같은 머신에 Paperclip 외부 프로젝트가 공존할 때
- 해당 프로젝트의 장애 복구, 기능 추가, 버그 수정을 Paperclip 회사 운영에 통합할 때
- 프로젝트 전체를 Paperclip으로 마이그레이션하기엔 과하지만, 운영 가시성은 필요할 때

**장점**
- 외부 프로젝트의 코드 수정도 Paperclip의 이슈 → 실행 → 검토 → 승인 흐름을 탄다.
- 수정 이력이 Paperclip activity log + git history 양쪽에 남는다.
- learning loop과 연결하면 "어떤 종류의 장애가 반복되는가"가 축적된다.

**주의점**
- 외부 프로젝트의 CI/CD가 있다면 에이전트가 직접 배포하지 않고 PR을 올리는 것이 안전하다.
- `cwd` 설정만으로 에이전트에게 해당 디렉토리 전체 접근 권한이 생기므로 scope를 문서화한다.
- 비밀 정보(env 파일, credential)는 에이전트 adapterConfig.env로 주입하되 로그에 남기지 않도록 한다.

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
| 오너 의사결정 단위 | 의사결정 패키지 구조, CEO assessment 기준 |
| 산출물 가정 검증 | 가정 레지스트리 정책, confidence level 기준 |
| 실행 후 학습 흐름 | threshold 정책, retrospective 템플릿, playbook 승격 기준 |
| 역할 간 인사이트 전파 | cross-role learning 정책, 영향 범위 판단 기준 |
| 외부 서비스 감시 / 복구 | 루틴 주기, health check 대상, 복구 수준별 gate policy |
| 외부 코드베이스 에이전트 작업 | 에이전트 cwd, gate policy scope, 배포 경로 |

## examples와의 관계

이 문서는 범용 패턴 문서다.
구체 예시는 아래를 본다.

- [`examples/ai-jobdori.md`](./examples/ai-jobdori.md)
- [`examples/rovel-ai2.md`](./examples/rovel-ai2.md)
- [`examples/ai-saju2.md`](./examples/ai-saju2.md)
