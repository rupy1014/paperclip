# LLM 프록시 어댑터 (중국 리셀러)

> **상태**: 제안
> **목적**: `bitexingai` 문서를 단일 벤더 메모에서 확장해, 중국 리셀러 계열 OpenAI-compatible LLM 프록시를 Paperclip 어댑터 관점에서 어떻게 다룰지 정리한다. v1 기준의 어댑터 설계, 설정 스키마, 실제 운영 데이터, usage API 차이, 비용 추적 원칙을 한 문서에 모은다.
> **대상 독자**: `ehowlsla` 운영 레이어에서 `bitexingai`와 `12ai`를 포함한 LLM 프록시 벤더를 Paperclip에 연결하려는 엔지니어와 운영자
> **관련 문서**: [`README.md`](./README.md), [`P0-EXECUTION-PLAN.md`](./P0-EXECUTION-PLAN.md), [`ORCHESTRATION-PATTERNS.md`](./ORCHESTRATION-PATTERNS.md), [`examples/ai-saju2.md`](./examples/ai-saju2.md), [`../SPEC-implementation.md`](../SPEC-implementation.md)


## 1. 개요

`ehowlsla` 운영 기준에서 현재 검토 대상인 LLM 프록시 벤더는 하나가 아니다.
실제 사용 중인 `bitexingai`와 신규 검토 중인 `12ai`는 모두 "중국 리셀러 계열의 멀티 벤더 LLM 프록시"라는 공통 성격을 가진다.
둘 다 OpenAI-compatible 호출을 기본 경로로 지원하고, 실제 운영에서는 저비용 고쿼터 또는 무제한 쿼터를 앞세워 다양한 상위 모델을 프록시한다.

이 문서의 제안은 다음으로 정리된다.

- 문서 scope를 `bitexingai` 단일 서비스에서 "중국 리셀러 LLM 프록시 어댑터" 전반으로 확장한다.
- v1 실행 경로는 계속 OpenAI-compatible 표면을 우선한다.
- 벤더별 차이는 config 수준에서 흡수하고, 실행 경로는 최대한 공통화한다.
- usage API와 과금 구조는 벤더마다 달라서 별도 정규화 계층이 필요하다.
- `openrouter`는 백업 벤더로만 기록하고, 현재 기준으로는 deprecated 취급한다.

현재 확인된 공통 운영 특성은 아래와 같다.

- `Authorization: Bearer <key>` 인증
- OpenAI-compatible `POST /v1/chat/completions` 또는 동등 경로 지원
- 하나의 계정에서 여러 상위 모델 벤더를 노출
- 가격 정책과 usage API 형식은 벤더마다 크게 다름
- 모델 카탈로그는 빠르게 변하므로 정적 seed와 동적 조회를 병행해야 함

### 1.1 벤더 현황 비교

| 항목 | bitexingai | 12ai | openrouter |
| --- | --- | --- | --- |
| 상태 | 기존 활성 | 신규, 안정성 검토 중 | 백업, deprecated |
| LLM Base URL | `https://bitexingai.com/v1` | `https://new.12ai.org/v1` | `https://openrouter.ai/api/v1` |
| OpenAI 호출 | `POST /chat/completions` | `POST /chat/completions` | `POST /chat/completions` |
| Usage API | `GET https://api.bitexingai.com/api/usage/token/` | `GET https://new.12ai.org/api/usage/token/` | 별도 usage API를 이 문서 범위에서 표준화하지 않음 |
| Usage 도메인 | `api.bitexingai.com` | `new.12ai.org` | `openrouter.ai` |
| 대표 모델 | `gemini-2.5-flash` | `gemini-2.5-flash`, `gemini-2.5-pro`, `claude-opus-4-6`, `gpt-4.1-mini` 외 50+ | `openai/gpt-4.1-mini` |
| 과금 모델 | quota 기반, `4.99 CNY`로 `3.25억` 토큰 | `unlimited_quota: true` | 종량제, 리포트당 대략 `270원` 수준 관찰 |
| 특이사항 | LLM API와 usage API 도메인이 분리 | 같은 도메인에서 LLM/usage 분리, `supported_endpoint_types` 제공 | `HTTP-Referer`, `X-Title` 커스텀 헤더 필요 |

### 1.2 운영 판단

- `bitexingai`는 이미 활성 운영 데이터가 있어 기준 벤더로 본다.
- `12ai`는 모델 폭과 무제한 quota 매력이 크지만, 안정성 검토가 끝나기 전까지는 보조 선택지로 둔다.
- `openrouter`는 fallback은 가능하지만 현재 목표 어댑터의 기본 설계 기준으로 삼지 않는다.

이 문서의 전제도 명확히 한다.

- 본 문서는 실제 운영에서 확보한 데이터에 기반한 설계 문서다.
- 다만 리셀러 벤더 특성상 모델 목록과 요금 정책은 자주 바뀔 수 있으므로 정적 문서만으로 절대 진실을 고정하지 않는다.
- 따라서 v1은 검증 가능한 최소 표면을 공통화하고, 벤더별 변동 지점은 config와 정규화 레이어에 모은다.

## 2. 어댑터 설계

### 2.1 기본 설계 결정

- 어댑터 범주: `openai_proxy` 계열
- 표시 이름: `LLM Proxy Adapter (CN Resellers)` 또는 이에 준하는 멀티 벤더 이름
- 호환 벤더: `bitexingai`, `12ai`
- 백업 벤더 기록: `openrouter`는 deprecated fallback
- 통신 방식: HTTPS JSON API
- 실행 모델: 무상태 one-shot 실행

문서 관점의 권장 타입은 `openai_proxy`다.
이유는 `bitexingai` 전용 타입으로 고정하면 `12ai`를 붙일 때 다시 추상화를 해야 하기 때문이다.
다만 이미 레지스트리나 패키지 이름이 `bitexingai`로 잡혀 있다면, v1 구현 단계에서는 기존 타입을 유지하면서 config에 `vendor` 개념을 추가해도 된다.

즉 설계의 핵심은 이름보다 경계다.

- 실행 경로는 공통 OpenAI-compatible surface로 통일한다.
- 벤더별 차이는 `baseUrl`, `usageEndpoint`, `extraHeaders`, `pricingProfile`, `vendor` 메타데이터로 흡수한다.
- 모델 목록과 비용/usage 정규화는 벤더별 어댑터 분기 대신 config 기반 분기로 처리한다.

### 2.2 패키지 구조

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
        ├── models.ts
        └── usage.ts
```

문서 파일명은 유지하되, 실제 어댑터 책임은 멀티 벤더 프록시를 수용하는 쪽으로 확장한다.
권장 책임 분리는 아래와 같다.

- `src/index.ts`
  - `type`, `label`, 정적 `models`, `agentConfigurationDoc`
- `src/server/execute.ts`
  - `POST /chat/completions` 호출
  - 공통 응답 파싱
  - `AdapterExecutionResult` 변환
- `src/server/test.ts`
  - `baseUrl`, `usageEndpoint`, `apiKey`, `model` 검증
  - `/models` 또는 최소 probe 호출
- `src/server/models.ts`
  - 정적 seed 목록
  - `GET /models` 동적 조회
  - TTL 캐시
- `src/server/usage.ts`
  - 벤더별 usage endpoint 호출
  - 응답 스키마 정규화

### 2.3 `ServerAdapterModule` 대응

v1에서 기대하는 surface는 아래다.

| 필드 | v1 결정 |
| --- | --- |
| `type` | 구현 |
| `execute` | 구현 |
| `testEnvironment` | 구현 |
| `models` | 구현 |
| `listModels` | 구현 |
| `agentConfigurationDoc` | 구현 |
| `getConfigSchema` | 구현 |
| `sessionCodec` | 미구현 |
| `listSkills` / `syncSkills` | 미구현 |
| `getQuotaWindows` | 선택 구현 |
| `detectModel` | 선택 구현 |

핵심은 공통 실행 surface와 벤더별 메타데이터 surface를 분리하는 것이다.

- `models`는 인증 전 UI seed다.
- `listModels`는 실제 계정 기준의 canonical source다.
- `getQuotaWindows` 또는 동등 기능은 usage API가 있는 벤더에서만 점진적으로 붙일 수 있다.

### 2.4 왜 OpenAI-compatible만 쓰는가

`bitexingai`와 `12ai`는 더 넓은 endpoint family를 가질 수 있어도, v1은 OpenAI-compatible만 쓴다.

이유는 네 가지다.

1. Paperclip의 현재 어댑터 표면에 가장 짧게 맞는다.
2. `model`, `messages`, `usage` 구조가 가장 일반적이라 비용/사용량 추적에 유리하다.
3. `12ai`가 `supported_endpoint_types`로 `openai`, `anthropic`, `gemini`를 구분하더라도 v1에서 모두 수용하면 범위가 불필요하게 커진다.
4. 운영 기준 모델 대부분이 OpenAI-compatible 경로만으로도 충분히 호출 가능하다.

v1 경로 규칙은 아래로 고정한다.

- `baseUrl`은 OpenAI-compatible API root다.
- 모델 조회: `GET {baseUrl}/models`
- 실행: `POST {baseUrl}/chat/completions`
- usage 조회: `GET {usageEndpoint}`
- 저장 시 `baseUrl`은 trailing slash를 제거하고 `/v1` suffix를 기대한다.
- `usageEndpoint`는 벤더마다 별도 저장한다.

## 3. Config 스키마

### 3.1 설계 원칙

- UI는 선언형 `AdapterConfigSchema`만으로 렌더링 가능해야 한다.
- 비밀값은 `apiKey` 한 필드로 입력받고, 저장 시 회사 시크릿 참조로 정규화하는 흐름을 기본으로 둔다.
- `baseUrl`은 편의 필드가 아니라 보안 민감 필드로 본다.
- `usageEndpoint`도 네트워크 목적지이므로 `baseUrl`과 같은 수준으로 검증한다.
- 벤더별 차이는 config에서 흡수하되, 실행 경로가 vendor-specific 코드에 과도하게 잠기지 않게 설계한다.

### 3.2 권장 필드

| key | label | type | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `vendor` | Vendor | `select` | 아니오 | `bitexingai` | `bitexingai`, `12ai`, `custom`, 필요 시 `openrouter` |
| `baseUrl` | API Base URL | `text` | 예 | 없음 | OpenAI-compatible root. 일반적으로 `/v1`로 끝난다. |
| `usageEndpoint` | Usage Endpoint | `text` | 아니오 | 없음 | quota 또는 토큰 사용량 조회 endpoint. 벤더마다 도메인과 path가 다를 수 있다. |
| `apiKey` | API Key | `text` | 예 | 없음 | Bearer token. 저장 시 secret ref로 정규화하는 것을 권장한다. |
| `model` | Model | `combobox` | 예 | 없음 | 정적 seed와 동적 조회 결과를 함께 보여준다. |
| `timeoutSec` | Timeout (sec) | `number` | 아니오 | `180` | 전체 HTTP 요청 timeout |
| `maxOutputTokens` | Max Output Tokens | `number` | 아니오 | 없음 | 모델별 상한이 달라 미설정 허용 |
| `temperature` | Temperature | `number` | 아니오 | 없음 | provider 기본값을 존중하므로 강제 기본값은 두지 않는다. |
| `extraHeadersJson` | Extra Headers JSON | `textarea` | 아니오 | 없음 | 프록시별 추가 헤더가 필요할 때만 사용 |
| `disableDynamicModels` | Disable Dynamic Models | `toggle` | 아니오 | `false` | `/models` 조회가 불안정하면 정적 목록만 사용 |
| `pricingProfile` | Pricing Profile | `select` | 아니오 | `auto` | `auto`, `quota`, `token`, `request`, `unlimited`, `unknown` |
| `allowInsecureHttp` | Allow Insecure HTTP | `toggle` | 아니오 | `false` | trusted local 테스트 전용 |

기존 필드는 유지하고, 실제 운영에서 필요한 `vendor`와 `usageEndpoint`만 추가한다.
`pricingProfile`은 기존 의미를 보존하면서 `quota`와 `unlimited`를 더 명시적으로 다룬다.

### 3.3 권장 저장 shape

`bitexingai` 권장 shape:

```json
{
  "vendor": "bitexingai",
  "baseUrl": "https://bitexingai.com/v1",
  "usageEndpoint": "https://api.bitexingai.com/api/usage/token/",
  "apiKey": "pc_secret://company/<company-id>/bitexingai-api-key",
  "model": "gemini-2.5-flash",
  "timeoutSec": 180,
  "maxOutputTokens": 4096,
  "temperature": 0.2,
  "extraHeaders": {},
  "disableDynamicModels": false,
  "pricingProfile": "quota",
  "allowInsecureHttp": false
}
```

`12ai` 권장 shape:

```json
{
  "vendor": "12ai",
  "baseUrl": "https://new.12ai.org/v1",
  "usageEndpoint": "https://new.12ai.org/api/usage/token/",
  "apiKey": "pc_secret://company/<company-id>/12ai-api-key",
  "model": "gemini-2.5-flash",
  "timeoutSec": 180,
  "maxOutputTokens": 4096,
  "temperature": 0.2,
  "extraHeaders": {},
  "disableDynamicModels": false,
  "pricingProfile": "unlimited",
  "allowInsecureHttp": false
}
```

저장 단계의 정규화 규칙은 아래를 권장한다.

- `extraHeadersJson`은 런타임에서 `extraHeaders` 객체로 바꾼다.
- `apiKey`는 평문 입력을 허용하되 persistence 시 secret ref로 치환한다.
- `baseUrl`과 `usageEndpoint`는 trailing slash와 path shape를 정규화한다.
- `allowInsecureHttp=false`가 기본이다.
- `vendor` preset을 선택하면 기본 `baseUrl`과 `usageEndpoint`를 자동 제안할 수 있다.

### 3.4 필수 검증

`testEnvironment`와 저장 전 검증에서 최소한 아래를 확인한다.

1. `baseUrl`이 비어 있지 않은가
2. `baseUrl`이 유효한 URL인가
3. `usageEndpoint`가 설정되었다면 유효한 URL인가
4. `allowInsecureHttp=false`일 때 `https://`만 허용되는가
5. `apiKey`가 비어 있지 않은가
6. `model`이 비어 있지 않은가
7. `GET {baseUrl}/models`가 실제로 인증되는가
8. `usageEndpoint`가 있으면 같은 자격증명으로 응답하는가

## 4. 모델 목록

### 4.1 모델 전략

리셀러 프록시는 모델 종류가 많고 변경 속도도 빠르다.
따라서 모델 전략은 "하드코딩된 완전 목록"이 아니라 두 층으로 잡는다.

1. 정적 seed 목록
2. `GET /v1/models` 동적 조회

정적 seed의 목적은 UI 초기 경험과 fallback이다.
동적 조회의 목적은 실제 계정에서 접근 가능한 live catalog를 반영하는 것이다.

### 4.2 기본 제공 모델군

아래는 v1에서 UI seed로 제공하는 실제 모델 예시다.
canonical ID는 실제 `GET /v1/models` 응답이 우선한다.

| 계열 | 대표 seed 예시 | 주 사용 벤더 |
| --- | --- | --- |
| Gemini Flash | `gemini-2.5-flash` | bitexingai, 12ai |
| Gemini Pro | `gemini-2.5-pro` | 12ai |
| Claude Opus | `claude-opus-4-6` | 12ai |
| GPT 저비용 | `gpt-4.1-mini` | 12ai, openrouter |
| Claude Sonnet 계열 | `claude-sonnet-*` | 12ai 가능성 높음, 실제 catalog 우선 |

이전 문서에 있던 `GPT-5`, `Gemini-3` 같은 가상 예시는 제거한다.
v1 seed는 실제 운영에서 이미 보였거나, 현재 벤더 catalog에 존재 가능성이 높은 모델 ID만 다룬다.

### 4.3 벤더별 모델 특성

- `bitexingai`
  - 현재 확인된 대표 모델은 `gemini-2.5-flash`
  - 운영 목적은 초저비용 대량 토큰 처리에 가깝다
- `12ai`
  - `gemini-2.5-flash`, `gemini-2.5-pro`, `claude-opus-4-6`, `gpt-4.1-mini` 외 50+ 모델 제공
  - `supported_endpoint_types`를 통해 모델별 호출 형식 차이를 암시한다
- `openrouter`
  - 현재 문서에서는 `openai/gpt-4.1-mini` 정도만 백업 예시로 남긴다
  - v1 기본 seed source로 삼지 않는다

### 4.4 동적 조회 규칙

`listModels()`는 아래 규칙을 따른다.

- 기본 경로는 `GET {baseUrl}/models`
- `disableDynamicModels=true`면 seed만 반환
- 응답의 `id`를 canonical key로 쓴다
- `name`, `owned_by`, provider prefix가 있으면 label/grouping에 활용한다
- 동일 ID는 중복 제거한다
- 정렬은 ID 기준으로 안정적으로 맞춘다
- 캐시는 짧게 둔다. 권장 TTL은 60초다
- `12ai`처럼 50+ 모델이 노출되는 벤더는 UI 그룹핑이나 검색형 combobox가 사실상 필수다

### 4.5 운영 원칙

- 저장된 `model`이 더 이상 `/models`에 없더라도 바로 파괴적으로 막지 않는다.
- 대신 "현재 계정에서 더 이상 보이지 않는 모델" 경고를 준다.
- 모델 ID는 seed보다 동적 조회 결과를 우선한다.
- `12ai`의 `supported_endpoint_types` 정보가 확인되면, OpenAI-compatible로 호출 가능한 모델만 우선 노출하는 필터가 유용하다.
- 비용 프로필은 모델 family와 별개로 운영자가 override할 수 있어야 한다.

## 5. 보안 고려사항

### 5.1 API key 관리

- `apiKey`는 회사 단위 secret으로 저장한다.
- activity log, transcript, 테스트 출력에 평문을 남기지 않는다.
- `Authorization` 헤더와 원본 request body는 오류 메시지에도 그대로 노출하면 안 된다.
- 키 교체 절차는 Mac Mini 운영 문서에 별도로 기록한다.

### 5.2 `baseUrl`은 SSRF 표면이다

이 어댑터는 다른 OpenAI-compatible 프록시로도 재사용될 수 있다.
그 말은 곧 `baseUrl`이 임의 URL이 될 수 있다는 뜻이다.

운영 기본값은 아래를 따른다.

- `https://`만 허용
- `localhost`, `127.0.0.1`, RFC1918, link-local, metadata endpoint는 기본 거부
- 예외는 trusted local 개발에서만 허용
- path/query/fragment가 섞인 URL은 저장 전에 정규화

즉 이 필드는 단순 endpoint 문자열이 아니라 잠재적 SSRF 진입점으로 다뤄야 한다.

### 5.3 `usageEndpoint`도 별도 네트워크 표면이다

기존 문서에서 `baseUrl`만 통제하면 충분하다고 가정할 수 있었지만, 실제 운영 데이터는 그렇지 않다.

- `bitexingai`는 LLM API가 `bitexingai.com`, usage API가 `api.bitexingai.com`으로 분리된다.
- `12ai`는 같은 도메인을 쓰지만 `/v1`과 `/api/usage/token/`가 서로 다른 path contract를 가진다.

따라서 usage 조회는 "부가 기능"이 아니라 두 번째 outbound destination으로 취급해야 한다.

- `usageEndpoint`도 allowlist, URL 정규화, TLS 강제, DNS/IP 검증 대상이다.
- `baseUrl` 검증만 통과했다고 usage 호출을 자동 허용하면 안 된다.
- 벤더 preset을 쓸 때는 문서화된 공식 endpoint 쌍만 허용하는 방향이 안전하다.

### 5.4 네트워크와 로그

- 호출 대상은 `baseUrl`과 `usageEndpoint`로 제한한다.
- 자동 재시도는 짧고 보수적으로 둔다.
- 실패 시 응답 body 전문 저장을 피한다.
- `testEnvironment` probe는 최소 토큰, 최소 권한, 최소 빈도로 유지한다.
- `openrouter`처럼 추가 헤더가 필요한 벤더는 헤더 값까지 민감 정보로 취급한다.

### 5.5 회사 경계와 캐시

- 회사 A의 credential이 회사 B의 모델 목록 조회에 섞이면 안 된다.
- 모델 캐시 key에는 `baseUrl`과 secret fingerprint가 함께 들어가야 한다.
- usage 캐시를 둔다면 `usageEndpoint`와 secret fingerprint도 key에 포함해야 한다.
- 전역 모델 캐시는 금지하고 credential-sensitive cache를 쓴다.
- endpoint 변경과 model family 변경은 운영자가 인지할 수 있게 문서화한다.

### 5.6 Phase 6와 결합될 때의 추가 기준

외부 프로젝트 복구 에이전트가 같은 머신의 외부 코드베이스를 수정할 수 있다면,
외부 `cwd` write 권한과 외부 LLM endpoint 권한이 동시에 묶인다.

그래서 아래 기준이 필요하다.

- endpoint 변경은 승인 또는 명시적 운영 절차를 거친다.
- 어떤 에이전트가 어떤 모델군을 쓰는지 운영 문서에 남긴다.
- 고비용 모델이나 미검증 endpoint는 복구 자동화 기본값으로 두지 않는다.
- `12ai` 같은 신규 벤더는 안정성 검토가 끝나기 전까지 제한된 역할에만 연결한다.

## 6. 비용 추적

### 6.1 Paperclip에 넘겨야 하는 값

이 어댑터는 결과 텍스트만 반환해서는 안 된다.
가능한 범위까지 아래 값을 `AdapterExecutionResult` 또는 동등한 비용/usage 레코드에 싣는 것을 목표로 한다.

- `provider`
- `biller`
- `billingType`
- `model`
- `usage.inputTokens`
- `usage.cachedInputTokens`
- `usage.outputTokens`
- `usage.remainingTokens`
- `quota.unlimited`
- `costUsd`

### 6.2 실제 과금 모델

| 벤더 | 실제 운영 기준 | 권장 `pricingProfile` | 비고 |
| --- | --- | --- | --- |
| bitexingai | `4.99 CNY`로 `3.25억` 토큰 quota | `quota` | `remaining_tokens`가 핵심 운영 지표 |
| 12ai | `unlimited_quota: true` | `unlimited` | 사용량은 추적하되 hard quota는 없음 |
| openrouter | 종량제 | `token` 또는 `request` | 이 문서에서는 보조 벤더 |

운영 의미는 아래와 같다.

- `bitexingai`는 "비용이 이미 선지불된 quota 잔량"을 관리하는 느낌에 가깝다.
- `12ai`는 "잔량보다 사용 패턴과 안정성"을 추적하는 느낌에 가깝다.
- `openrouter`는 일반적인 metered API에 가깝다.

### 6.3 usage API

#### 6.3.1 도메인 분리

- `bitexingai`
  - LLM API: `https://bitexingai.com/v1`
  - Usage API: `https://api.bitexingai.com/api/usage/token/`
- `12ai`
  - LLM API: `https://new.12ai.org/v1`
  - Usage API: `https://new.12ai.org/api/usage/token/`

이 차이는 비용 추적뿐 아니라 보안 정책에도 직접 영향을 준다.
특히 `bitexingai`는 사용량 조회를 위해 두 번째 도메인을 명시적으로 허용해야 한다.

#### 6.3.2 응답 스키마

`bitexingai` 응답 스키마:

```json
{
  "plan_name": "4.99-WbmMwZ",
  "total_tokens": 325000000,
  "used_tokens": 50000000,
  "remaining_tokens": 275000000,
  "unlimited_quota": false,
  "model_limits": {},
  "expires_at": null
}
```

`12ai` 응답 스키마:

```json
{
  "code": true,
  "data": {
    "name": "apiToken",
    "total_granted": 0,
    "total_used": 40,
    "total_available": -40,
    "unlimited_quota": true,
    "model_limits_enabled": false,
    "expires_at": 0
  }
}
```

두 응답은 동일하지 않다.
`bitexingai`는 top-level quota 구조이고, `12ai`는 `data` 래퍼 안에 usage 정보를 넣는다.
또 `12ai`는 unlimited quota일 때 `total_available`가 음수처럼 보일 수 있으므로 잔량 숫자를 quota 잔액으로 그대로 해석하면 안 된다.

#### 6.3.3 권장 정규화 필드

| 정규화 필드 | bitexingai 매핑 | 12ai 매핑 |
| --- | --- | --- |
| `quotaPlanName` | `plan_name` | `data.name` |
| `quotaTotalTokens` | `total_tokens` | `null` |
| `quotaUsedTokens` | `used_tokens` | `data.total_used` |
| `quotaRemainingTokens` | `remaining_tokens` | `null` 또는 계산 안 함 |
| `quotaUnlimited` | `unlimited_quota` | `data.unlimited_quota` |
| `quotaExpiresAt` | `expires_at` | `data.expires_at` |
| `modelLimitsEnabled` | `model_limits` 존재 여부 | `data.model_limits_enabled` |

정규화 원칙은 아래를 권장한다.

1. 원본 응답은 디버깅용으로만 짧게 유지하고, 운영 레이어는 정규화 필드를 본다.
2. `quotaRemainingTokens`는 실제 의미가 확실할 때만 채운다.
3. `unlimited_quota=true`면 잔량 숫자보다 사용량 누적과 장애 여부를 우선 지표로 본다.

### 6.4 실행 응답의 비용 계산 원칙

1. 실행 응답에 provider-reported cost가 있으면 그 값을 우선 사용한다.
2. 실행 응답에 cost는 없고 token usage만 있으면 정적 가격표 또는 운영 override로 추정한다.
3. `bitexingai`는 quota 소모를 우선 기록하고, 월말 cost 환산은 운영 보조 계산으로 둔다.
4. `12ai`는 `unlimited` 정책이므로 cost 대신 사용량과 모델별 빈도를 추적한다.
5. 가격을 신뢰할 수 없으면 `billingType: "unknown"`으로 기록하고 운영자에게 경고한다.

권장 식별자는 아래와 같다.

- `provider`: 실제 실행 벤더 ID
- `biller`: 기본값은 벤더와 동일, 별도 청구 주체가 생기면 확장
- `billingType`
  - `bitexingai`: `prepaid_quota`
  - `12ai`: `unlimited_subscription` 또는 `unknown`
  - `openrouter`: `metered_api`

### 6.5 운영 원칙

- 리포지토리 안의 가격표는 truth source가 아니라 fallback이다.
- 운영 환경에서는 가격표 override가 가능해야 한다.
- 예산 hard-stop이 목적이지, 월말 회계 정합성을 여기서 완벽히 해결하려 하지는 않는다.
- 비용 정확도가 중요한 회사는 월말 reconciliation을 별도로 한다.
- `12ai`는 unlimited라 해도 공급자 정책 변경 가능성을 전제로 추적 로직을 느슨하게 유지한다.

## 7. 구현 스텝

### 7.1 패키지 준비

- 기존 `packages/adapters/bitexingai/`를 유지하더라도 내부 문서와 config는 멀티 벤더 프록시를 수용하도록 정리
- `src/index.ts`에서 `type`, `label`, `models`, `agentConfigurationDoc` 정의
- `src/server/index.ts`에서 `execute`, `testEnvironment`, `listModels`, `getConfigSchema` export

### 7.2 실행 경로 구현

- `POST {baseUrl}/chat/completions`
- Paperclip wake prompt를 OpenAI `messages`로 변환
- 첫 번째 assistant 응답을 요약/본문으로 파싱
- `usage`, `model`, `provider`, `billingType`, `costUsd`를 결과에 매핑
- `vendor` preset에 따라 `baseUrl`, `usageEndpoint`, 추가 헤더 기본값을 주입 가능하게 설계

### 7.3 모델 조회 구현

- 실제 운영에서 확인된 모델 seed 정의
- `GET {baseUrl}/models` 호출
- 중복 제거, 정렬, TTL cache 적용
- 실패 시 seed fallback
- `12ai`는 50+ 모델 대응을 위한 검색형 선택 UI를 전제로 검토

### 7.4 usage 조회 구현

- `GET {usageEndpoint}` 호출
- `bitexingai`와 `12ai` 응답 스키마 정규화
- usage endpoint가 비어 있으면 비용 추적은 실행 응답 기반 fallback으로 동작
- usage 조회 실패가 모델 실행을 막지는 않되 운영 경고는 남김

### 7.5 환경 테스트

- URL 형식 검증
- API key 존재 여부 검증
- 모델 존재 여부 검증
- `/models` probe 또는 최소 hello probe
- `usageEndpoint` probe
- 운영자가 바로 수정할 수 있는 오류 메시지 작성

### 7.6 서버 연결

- 서버 registry에 builtin 등록
- adapter docs 노출 경로 연결
- adapter config schema 조회 경로 연결
- 모델 목록 조회 경로에서 `listModels()` 사용
- usage snapshot이 있으면 비용/예산 레이어에 연결

### 7.7 v1 포함 범위

이번 단계에서 구현 범위에 포함되는 것은 아래다.

- 멀티 벤더 LLM 프록시 어댑터 문서화와 config 확장
- OpenAI-compatible `GET /models`, `POST /chat/completions`
- `bitexingai`와 `12ai` preset
- 정적 seed 목록과 동적 모델 조회
- Bearer token 인증
- usage API 응답 정규화
- 기본 사용량 파싱과 비용 추적 훅
- `testEnvironment`
- `getConfigSchema`

## 8. 제외 범위

이번 단계에서 하지 않는 것은 아래다.

- Claude-native `POST /v1/messages` 지원
- Gemini-native `POST /v1beta/models/*` 지원
- streaming transcript fidelity 개선
- 세션 resume, checkpoint, stateful conversation 관리
- vendor별 tool calling 완전 호환
- 범용 OpenAI-compatible base adapter 대추상화
- `openrouter`를 v1 기본 벤더로 승격
- 리셀러 벤더 가격 정책을 Paperclip 코어의 절대 진실로 고정
- usage API가 없는 다른 프록시 벤더까지 한 번에 일반화

이 문서 기준의 v1 범위는 한 줄로 정리할 수 있다.

> `bitexingai` 파일명을 유지하되, 실제 내용은 `bitexingai`와 `12ai`를 포괄하는 멀티 벤더 LLM 프록시 어댑터 문서로 확장하고, OpenAI-compatible 최소 경로와 usage API 정규화까지를 안전한 시작점으로 삼는다.
