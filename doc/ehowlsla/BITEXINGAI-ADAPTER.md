# BitexingAI 어댑터 컨셉

> **상태**: 제안
> **목적**: `bitexingai`를 Paperclip의 새 LLM 프록시 어댑터로 추가할 때 필요한 설계 의도, 설정 스키마, 모델 전략, 보안/비용 처리, 구현 범위를 한 문서에 정리한다.
> **대상 독자**: `bitexingai` 어댑터를 설계/구현/검토할 엔지니어와 `ehowlsla` 운영 레이어에서 Mac Mini 기반 LLM 선택폭을 넓히려는 운영자
> **관련 문서**: [`README.md`](./README.md), [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md), [`ORCHESTRATION-PATTERNS.md`](./ORCHESTRATION-PATTERNS.md), [`examples/ai-saju2.md`](./examples/ai-saju2.md)
> **정합 기준**: [`../PRODUCT.md`](../PRODUCT.md), [`../SPEC-implementation.md`](../SPEC-implementation.md), [`../../packages/adapter-utils/src/types.ts`](../../packages/adapter-utils/src/types.ts)

## 개요

`bitexingai.com`은 공개 문서가 거의 없고 로그인 이후 콘솔 중심으로 쓰는 LLM 프록시로 파악된다.
현재까지의 조사 기준으로는 다음 성격을 가진다.

- OpenAI 호환 `/v1/chat/completions`
- Claude 호환 `/v1/messages`
- Gemini 호환 `/v1beta/models/*`
- Bearer token 기반 인증
- GPT, Gemini, Claude, DeepSeek, Qwen 계열을 함께 노출하는 멀티 모델 프록시

이 문서에서 제안하는 방향은 **새 어댑터 패키지 `packages/adapters/bitexingai/`를 만들고, v1에서는 OpenAI-compatible 경로를 기본 구현으로 채택하는 것**이다.

이 선택의 이유는 단순하다.

- Paperclip의 `ServerAdapterModule` 인터페이스에 가장 짧게 맞출 수 있다.
- 모델 선택 UI와 비용 집계 흐름을 기존 OpenAI류 프로바이더 사고방식으로 연결하기 쉽다.
- 나중에 다른 OpenAI-compatible 프록시를 붙일 때 `models.ts`, 요청 빌더, 응답 파서 일부를 재사용하기 좋다.
- `ehowlsla` Phase 6의 "외부 프로젝트 감시/복구" 이전에, Mac Mini 위의 다양한 LLM 접근 경로를 확보하는 인프라 선행 작업으로 의미가 있다.

즉 이 어댑터의 1차 목적은 "새 추상화 발명"이 아니라 **Paperclip에서 bitexingai를 안정적으로 선택 가능한 LLM 런타임으로 편입하는 것**이다.

## 문서의 가정 범위

bitexingai는 공개 개발자 문서가 없으므로 이 문서는 구현 계약서가 아니라 **컨셉 문서**다.
아래 항목은 실제 콘솔 접근 후 재확인이 필요하다.

- 정확한 API origin URL
- `/v1/models` 응답 shape
- 모델 ID naming convention
- 비용 단위와 환율 기준
- Gemini 계열의 요청당 과금 데이터 노출 여부

따라서 이 문서의 원칙은 다음이다.

1. 추측 대신 보수적으로 설계한다.
2. v1은 OpenAI-compatible만 고정한다.
3. 모델/가격은 정적 seed + 동적 조회로 다룬다.
4. 보안상 위험한 부분(`baseUrl`, `apiKey`, 네트워크 egress)은 문서에서 먼저 제한한다.

## 어댑터 설계

### 어댑터 타입과 패키지

- 패키지 경로: `packages/adapters/bitexingai/`
- 어댑터 타입: `bitexingai`
- 표시 이름: `BitexingAI`
- 통신 방식: HTTPS JSON API
- 세션 모델: v1에서는 무상태(stateless) 실행

v1에서 `bitexingai`는 `claude_local`, `codex_local` 같은 CLI 세션형 어댑터가 아니다.
성격은 로컬 CLI보다는 "원격 LLM API 어댑터"에 가깝다.

따라서 초안 패키지 구조는 아래 정도면 충분하다.

```text
packages/adapters/bitexingai/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    └── server/
        ├── index.ts
        ├── execute.ts
        ├── test.ts
        └── models.ts
```

권장 역할은 다음과 같다.

- `src/index.ts`
  - `type`
  - `label`
  - 정적 `models`
  - `agentConfigurationDoc`
- `src/server/execute.ts`
  - `/chat/completions` 호출
  - 응답 파싱
  - `AdapterExecutionResult` 생성
- `src/server/test.ts`
  - `baseUrl`, `apiKey`, `model` 검증
  - `/models` 또는 초소형 hello probe
- `src/server/models.ts`
  - 정적 seed 목록
  - `/models` 동적 조회
  - TTL cache

### `ServerAdapterModule` 대응

이 어댑터는 최소한 아래 surface를 가진다.

| 필드 | v1 결정 |
| --- | --- |
| `type` | `bitexingai` |
| `execute` | 구현 |
| `testEnvironment` | 구현 |
| `models` | 정적 seed 제공 |
| `listModels` | 구현 |
| `agentConfigurationDoc` | 구현 |
| `getConfigSchema` | 구현 권장 |
| `sessionCodec` | 미구현 |
| `listSkills` / `syncSkills` | 미구현 |
| `getQuotaWindows` | 미구현 |
| `detectModel` | 미구현 |

핵심은 `models`와 `listModels`를 동시에 제공하는 것이다.

- `models`: 인증 전에도 UI가 비어 보이지 않게 하는 기본 seed
- `listModels`: 실제 계정이 접근 가능한 모델을 런타임에 조회하는 canonical source

### OpenAI-compatible를 기본으로 쓰는 이유

bitexingai가 Claude/Gemini 포맷도 받더라도 v1은 OpenAI-compatible만 지원한다.

이유:

- 하나의 프록시에 포맷 3개를 한 번에 넣으면 adapter semantics가 흐려진다.
- Paperclip 입장에서는 "모델 선택 가능한 안정적 원격 실행"이 먼저지, vendor-native fidelity가 우선이 아니다.
- OpenAI-compatible는 `model`, `messages`, `usage` shape가 가장 일반적이라 `AdapterExecutionResult`로 변환하기 쉽다.

v1 요청 경로 원칙:

- `baseUrl`은 `/v1`로 끝나는 API root를 받는다.
- 모델 조회는 `GET {baseUrl}/models`
- 실행은 `POST {baseUrl}/chat/completions`

즉 `baseUrl`을 루트 origin이 아니라 **OpenAI-compatible API root**로 본다.
예시는 `https://<console-issued-host>/v1` 형태다.

## Config 스키마

### 설계 원칙

- UI는 `AdapterConfigSchema`의 평면 필드로 렌더링 가능해야 한다.
- 비밀 정보는 `apiKey` 단일 필드로 입력받되 저장 시 회사 시크릿 경로로 정규화한다.
- 네트워크 경로를 열어 두는 `baseUrl`은 단순 편의 필드가 아니라 보안 민감 필드로 취급한다.

### 권장 UI 스키마

| key | label | type | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `baseUrl` | API Base URL | `text` | 예 | 없음 | OpenAI-compatible root. `/v1`로 끝나야 한다. |
| `apiKey` | API Key | `text` | 예 | 없음 | Bearer token. UI에서는 secret field로 취급하고 로그에 남기지 않는다. |
| `model` | Model | `combobox` | 예 | 없음 | seed 목록 + `listModels()` 결과를 함께 보여준다. |
| `timeoutSec` | Timeout (sec) | `number` | 아니오 | `180` | 전체 요청 제한 시간 |
| `maxOutputTokens` | Max Output Tokens | `number` | 아니오 | 없음 | 모델별 상한이 다르므로 미설정 허용 |
| `temperature` | Temperature | `number` | 아니오 | 없음 | v1에서는 선택 노출만 하고 기본값은 provider 기본값 사용 |
| `extraHeadersJson` | Extra Headers JSON | `textarea` | 아니오 | 없음 | 벤더별 추가 헤더가 필요할 때만 사용 |
| `disableDynamicModels` | Disable Dynamic Model Discovery | `toggle` | 아니오 | `false` | `/models` 조회가 불안정할 때 seed만 사용 |
| `pricingProfile` | Pricing Profile | `select` | 아니오 | `auto` | `auto`, `token`, `request`, `unknown` |
| `allowInsecureHttp` | Allow Insecure HTTP | `toggle` | 아니오 | `false` | 로컬 실험 전용. 운영 기본값은 항상 `false` |

### 권장 저장 shape

문서상 권장하는 저장 JSON은 아래와 같다.

```json
{
  "baseUrl": "https://example.bitexingai-proxy.com/v1",
  "apiKey": "pc_secret://company/<id>/bitexingai-api-key",
  "model": "gpt-5-mini",
  "timeoutSec": 180,
  "maxOutputTokens": 4096,
  "temperature": 0.2,
  "extraHeaders": {
    "HTTP-Referer": "https://paperclip.local"
  },
  "disableDynamicModels": false,
  "pricingProfile": "auto",
  "allowInsecureHttp": false
}
```

여기서 중요한 점:

- UI 입력값은 `extraHeadersJson`일 수 있지만 런타임 config는 `extraHeaders` 객체로 정규화한다.
- `apiKey`는 평문 입력을 허용하되 persistence 시 시크릿 레퍼런스로 바뀌는 흐름을 기본값으로 둔다.
- `baseUrl`은 trailing slash를 제거하고 `/v1` suffix를 검증한다.

### 필수 검증

`testEnvironment`와 저장 전 검증에서 아래를 확인한다.

1. `baseUrl`이 비어 있지 않은가
2. `baseUrl`이 `http://`인지 `https://`인지
3. `allowInsecureHttp=false`일 때 `https://`만 허용되는가
4. `apiKey`가 비어 있지 않은가
5. `model`이 비어 있지 않은가
6. `/models` 조회 또는 hello probe가 실제로 인증되는가

## 모델 목록

### 모델 전략

bitexingai는 모델 수가 많고 변경 속도도 빠를 가능성이 높다.
따라서 문서상 모델 전략은 "완전한 하드코딩 목록"이 아니라 아래 두 층이다.

1. **정적 seed 목록**
   - 인증 전에도 dropdown이 동작하게 한다.
   - 대표 계열만 담는다.
2. **동적 `/models` 조회**
   - 실제 계정에 보이는 모델을 canonical source로 삼는다.
   - 결과는 짧은 TTL cache를 둔다.

### 초기 seed 목록

아래 목록은 "초기 UX용 seed"다.
정확한 canonical ID는 실제 bitexingai `/models` 응답으로 덮어쓴다.

| 계열 | seed 후보 |
| --- | --- |
| OpenAI | `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5.4` |
| Claude | `claude-sonnet-4`, `claude-opus-4.1` |
| Gemini | `gemini-3-pro`, `gemini-3-flash` |
| DeepSeek | `deepseek-chat`, `deepseek-reasoner` |
| Qwen | `qwen-max`, `qwen-plus`, `qwen2.5-coder-32b-instruct` |

이 seed 목록의 목적은 "정확한 공급자 카탈로그 복제"가 아니라:

- 첫 설정 시 모델 field를 비워두지 않기
- 운영자가 익숙한 대표군을 빠르게 선택하게 하기
- `/models` 실패 시 최소한의 fallback을 제공하기

### 동적 조회 규칙

`listModels()`는 아래 원칙을 따른다.

- `disableDynamicModels=true`이면 정적 seed만 반환
- 기본값은 `GET {baseUrl}/models`
- 응답에서 `id`, `owned_by`, `name` 계열 필드를 최대한 보존
- 동일 ID 중복 제거
- 모델 ID 오름차순 정렬
- 60초 정도의 TTL cache

### UI 표시 규칙

- 라벨은 기본적으로 `id`
- `owned_by`나 provider prefix가 있으면 group label로 활용 가능
- seed와 동적 조회 결과가 겹치면 동적 결과를 우선
- 저장된 `model`이 더 이상 `/models`에 없으면 경고를 띄우되 즉시 파괴적으로 막지는 않는다

## 보안 고려사항

### 1. API key 관리

- `apiKey`는 회사 단위 secret으로 저장한다.
- activity log, transcript, test output에 절대 평문을 남기지 않는다.
- `Authorization: Bearer ...` 헤더는 에러 메시지에도 그대로 노출되면 안 된다.
- `agentConfigurationDoc`에도 "평문 보관 금지"를 명시한다.

### 2. `baseUrl`은 SSRF 표면이다

이 어댑터는 추후 "다른 OpenAI-compatible 프록시에도 재사용"될 가능성이 있다.
그 말은 곧 `baseUrl`이 임의 URL이 될 수 있다는 뜻이다.

따라서 운영 기본값은 아래가 맞다.

- `https://`만 허용
- `localhost`, `127.0.0.1`, link-local, RFC1918 대역은 기본 거부
- 예외는 로컬 개발 플래그 또는 trusted mode에서만 허용
- path/query/fragment가 섞인 URL은 저장 전에 정규화

즉 이 어댑터는 단순 HTTP 클라이언트가 아니라 **잠재적 SSRF 진입점**으로 취급해야 한다.

### 3. 네트워크 egress 최소화

- 호출 대상은 `baseUrl` 한 곳으로 제한한다.
- 자동 재시도는 짧고 보수적으로 둔다.
- 실패 시 응답 body 전문을 저장하지 않는다.
- `testEnvironment`의 hello probe도 최소 토큰으로 제한한다.

### 4. 멀티테넌시와 회사 경계

- 회사 A의 시크릿이 회사 B 어댑터 테스트에 섞이면 안 된다.
- 모델 조회 결과 cache key에도 `baseUrl`과 secret fingerprint를 반영한다.
- `listModels()` 결과는 전역 캐시가 아니라 credential-sensitive cache여야 한다.

### 5. 외부 프로젝트 감시/복구와의 결합

Phase 6 맥락에서 이 어댑터는 외부 코드베이스를 직접 수정하는 에이전트의 LLM backend가 될 수 있다.
그래서 보안 기준은 더 높아야 한다.

- 외부 `cwd` write 권한과 임의 외부 LLM endpoint 권한을 동시에 줄 때는 owner가 명시적으로 인지해야 한다.
- 승인 없이 모델/endpoint를 바꾸면 안 된다.
- 운영 문서에는 어떤 agent가 어떤 `baseUrl`과 어떤 model family를 쓰는지 남겨야 한다.

## 비용 추적

### 비용 이벤트에 필요한 값

Paperclip의 cost ledger는 최소한 아래를 원한다.

- `provider`
- `biller`
- `billingType`
- `model`
- `inputTokens`
- `cachedInputTokens`
- `outputTokens`
- `costCents`

즉 bitexingai 어댑터는 "응답 텍스트만 반환"해서는 안 된다.
토큰 사용량과 비용을 가능한 범위까지 `AdapterExecutionResult`에 실어야 한다.

### v1 비용 계산 원칙

1. 응답에 provider-reported cost가 있으면 그 값을 우선 사용한다.
2. 응답에 cost는 없고 token usage만 있으면 가격표로 추정한다.
3. Gemini류처럼 요청당 과금이라 token usage만으로 충분치 않으면 `pricingProfile`을 사용한다.
4. 가격을 알 수 없으면 `billingType: "unknown"`으로 기록하고 `costUsd`는 `null` 대신 `0`으로 뭉개지지 않게 주의한다.

문서상 권장 매핑은 아래와 같다.

| 상황 | 처리 |
| --- | --- |
| 응답에 `usage` + `cost` 있음 | 그대로 사용 |
| 응답에 `usage`만 있음 | 모델별 price table로 `costUsd` 계산 |
| 응답에 `usage`도 불완전, 요청당 과금 모델 | `pricingProfile=request` 기준으로 계산 |
| 아무 가격 정보도 신뢰할 수 없음 | 토큰은 기록, 비용은 `unknown` 취급 후 운영자에게 경고 |

### 권장 ledger 식별자

- `provider`: `bitexingai`
- `biller`: 기본은 `bitexingai`
- `model`: 응답의 실제 `model`
- `billingType`
  - OpenAI/Claude/DeepSeek/Qwen 계열 기본값: `metered_api`
  - 요청당 과금이 확실한 모델: `unknown` 또는 명시 profile 기반 처리

### 가격표 전략

v1에서는 외부 문서가 불안정하므로 **하드코딩된 가격표를 제품 진실 원천으로 삼지 않는다**.
권장 방식은 아래다.

- 리포지토리 안의 정적 price table은 fallback으로만 둔다.
- 실제 운영 가격은 adapter config 또는 별도 서버 설정으로 override 가능하게 한다.
- 비용 정확도가 중요한 회사는 월말 정산 기준으로 reconciliation한다.

즉 비용 집계의 목표는 "완벽한 회계"가 아니라 **예산 hard-stop을 작동시킬 만큼 일관된 추적**이다.

## 구현 스텝

### 1. 패키지 scaffold

- `packages/adapters/bitexingai/` 생성
- `src/index.ts`에서 `type`, `label`, `models`, `agentConfigurationDoc` 정의
- `src/server/index.ts`에서 `execute`, `testEnvironment`, `listModels` export

### 2. 모델 discovery

- `models.ts`에서 정적 seed 목록 작성
- `GET {baseUrl}/models` 호출 구현
- 중복 제거 + cache + 실패 fallback 처리

### 3. 실행 경로

- `execute.ts`에서 `POST {baseUrl}/chat/completions`
- Paperclip prompt를 OpenAI `messages`로 변환
- 첫 번째 assistant message text를 결과 요약으로 변환
- `usage`와 `model`을 `AdapterExecutionResult`로 매핑

### 4. 환경 테스트

- `test.ts`에서 URL, 인증, 모델 접근성 검증
- `/models` 성공 여부 확인
- 필요하면 ultra-cheap hello probe 추가
- 실패 메시지는 운영자가 바로 수정할 수 있게 구체적으로 작성

### 5. 서버 registry 등록

- `server/src/adapters/registry.ts`에 builtin 등록
- `/companies/:companyId/adapters/:type/models` 경로에서 `listModels()` 노출
- 필요하면 UI adapter 목록 라벨 확인

### 6. 비용 연동

- provider/model/billingType/costUsd 매핑
- heartbeat 비용 ledger와 예산 평가가 정상 동작하는지 확인
- 사용량만 있고 비용이 불확실한 경우의 fallback rule 문서화

### 7. 운영 문서/배포

- `agentConfigurationDoc`를 운영자 기준으로 작성
- Mac Mini 운영 문서에 API key 저장 위치와 교체 절차 기록
- 특정 외부 복구 agent가 bitexingai를 쓸 경우 모델/비용 가드를 함께 문서화

## 구현 범위

### v1에 포함

- 새 builtin 어댑터 `bitexingai`
- OpenAI-compatible `/chat/completions`만 지원
- 정적 seed + 동적 `/models`
- Bearer token 인증
- 기본 비용/토큰 추적
- `testEnvironment`
- `getConfigSchema`

### v1.1 이후 후보

- Claude-native `/v1/messages`
- Gemini-native `/v1beta/models/*`
- streaming transcript fidelity 개선
- provider-reported detailed pricing 파싱
- generic openai-compatible base adapter 추출

## 제외 범위

이번 문서 기준으로 **하지 않는 것**은 아래다.

- `bitexingai` 전용 코드 작성 외에 범용 플러그인 프레임워크 재설계
- 세 포맷(OpenAI/Claude/Gemini) 동시 지원
- 세션 resume, conversation checkpoint 같은 stateful API 추상화
- vendor별 tool calling 완전 호환
- bitexingai 가격 정책을 Paperclip 코어 상수로 고정하는 일
- 공개 문서가 없는 상태에서 endpoint shape를 과도하게 확정하는 일

즉 v1의 범위는 명확하다.

> **"BitexingAI를 Paperclip에서 고를 수 있게 만들되, OpenAI-compatible 최소 경로로 안전하게 시작한다."**

## 완료 기준

이 문서를 기준으로 구현이 끝났다고 말하려면 아래 질문에 답할 수 있어야 한다.

1. 왜 `bitexingai`를 별도 패키지로 추가하는가
2. 왜 v1은 OpenAI-compatible만 쓰는가
3. 어떤 config 필드가 필요한가
4. 모델 목록은 어떻게 seed되고 어떻게 동적으로 갱신되는가
5. `apiKey`와 `baseUrl`에서 어떤 보안 위험이 있는가
6. 토큰/비용은 Paperclip ledger에 어떻게 들어가는가
7. 이번 단계에서 구현하는 것과 하지 않는 것은 무엇인가
