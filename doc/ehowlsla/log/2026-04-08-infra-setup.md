# 2026-04-08: 인프라 설정 — pm2 + Cloudflare Tunnel

## 변경 사항 (upstream 대비)

### 1. bitexingai 어댑터 추가

OpenRouter 유사 LLM 프록시인 bitexingai.com을 Paperclip 어댑터로 추가.

| 항목 | 내용 |
|------|------|
| 패키지 | `packages/adapters/bitexingai/` (`@paperclipai/adapter-bitexingai`) |
| 프로토콜 | OpenAI-compatible `/v1/chat/completions` |
| 설정 | `baseUrl`, `apiKey`, `model`, `timeoutSec`, `maxOutputTokens`, `temperature`, `extraHeaders` |
| 모델 탐색 | `GET /models` 동적 + 8개 정적 시드 (gpt-4o, claude-sonnet-4, gemini-2.5-flash 등) |
| 등록 | `server/src/adapters/registry.ts`, `builtin-adapter-types.ts` |

**upstream에 없는 파일:**
- `packages/adapters/bitexingai/` (전체)
- `server/package.json` — `@paperclipai/adapter-bitexingai: workspace:*` 의존성 추가

### 2. watchdog_targets 기능

스케줄 기반 외부 URL 모니터링 기능.

| 항목 | 내용 |
|------|------|
| DB | `watchdog_targets` 테이블 (마이그레이션 0056) |
| 스키마 | `packages/db/src/schema/watchdog_targets.ts` |
| API | `server/src/routes/watchdog.ts`, `server/src/services/watchdog.ts` |
| UI | `ui/src/pages/WatchdogTargets.tsx`, `WatchdogTargetDetail.tsx` |
| 공유 | `packages/shared/src/types/watchdog.ts`, `validators/watchdog.ts` |

### 3. jobdori-pipeline 어댑터

AI Jobdori 전용 파이프라인 어댑터 (현재 미사용).

- `packages/adapters/jobdori-pipeline/`

### 4. UI/라우팅 변경

- `ui/src/App.tsx` — watchdog 라우트 추가
- `ui/src/components/Sidebar.tsx` — watchdog 메뉴 항목
- `ui/src/lib/queryKeys.ts` — watchdog 쿼리키
- `server/src/app.ts` — watchdog 라우트 마운트
- `server/src/services/index.ts` — watchdog 서비스 등록
- `packages/shared/src/constants.ts`, `types/index.ts`, `validators/index.ts` — watchdog 타입/상수 re-export

## 운영 설정 (코드 외)

### pm2 프로세스 관리

| 파일 | 위치 | 내용 |
|------|------|------|
| `ecosystem.config.cjs` | `~/paperclip/` | paperclip + cloudflared 앱 정의 |
| `com.paperclip.pm2.plist` | `~/Library/LaunchAgents/` | 부팅 시 `pm2 resurrect` 자동 실행 |

pm2 앱 목록:
- `paperclip` — `pnpm dev:once`, autorestart, max 10회, 5초 딜레이
- `cloudflared` — `~/bin/cloudflared tunnel run`, autorestart

### Cloudflare Tunnel

| 항목 | 값 |
|------|-----|
| 터널 이름 | `my-local-tunnel` |
| 터널 ID | `fd4dada1-bdf1-4998-8c71-50148fa4c291` |
| 설정 파일 | `~/.cloudflared/config.yml` |
| cloudflared 바이너리 | `~/bin/cloudflared` (v2026.3.0, arm64) |

인그레스:
- `paperclip.jeommyo.com` → `localhost:3100`
- `llm-mux.newchar.app` → `localhost:8317`

Paperclip `allowed-hostname` 등록 필요: `pnpm paperclipai allowed-hostname <hostname>`

### DB 수동 수정 이력

| 날짜 | 내용 | 원인 |
|------|------|------|
| 2026-04-08 | `issue_relations` 테이블 수동 CREATE | Drizzle가 마이그레이션 0049를 "적용됨"으로 기록했지만 DDL 미실행. 에이전트 heartbeat 시 `relation "issue_relations" does not exist` 크래시 |

수동 적용 스크립트:
```bash
ssh ehowlsla@claw 'source ~/.zshrc 2>/dev/null; cd ~/paperclip/server && pnpm exec tsx /tmp/fix-migration.ts'
# DB 접속: postgresql://paperclip:paperclip@127.0.0.1:54329/paperclip
```

### 마이그레이션 journal 정리 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-08 | 57 journal → 54 files 불일치 수정. ehowlsla 로컬 마이그레이션 0050~0055 제거, upstream 0050~0052 추가 |

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| jobdori 회사 삭제 불가 | 미해결 | `DELETE /api/companies/<id>` → 500. DB에 연관 데이터(agents, issues) 존재 |
| CEO 에이전트 이름 "CEO 2" | 미해결 | jobdori의 "CEO"와 이름 충돌. jobdori 삭제 후 rename 필요 |
| watchdog 기능 미검증 | 미해결 | 코드 배포됨, 기능 테스트 미완 |
| `listBitexingaiModels({})` 빈 config | 의도적 | 서버 registry에서 config 전달 불가. 빈 config → 정적 시드 모델 반환 |
