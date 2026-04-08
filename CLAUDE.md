# Paperclip — ehowlsla overlay

## Git 구조

upstream 오픈소스(`paperclipai/paperclip`)를 fork(`rupy1014/paperclip`)해서 확장하는 구조.
upstream 업데이트를 받으면서 ehowlsla overlay 커밋을 유지한다.

| remote | repo | 용도 |
|--------|------|------|
| `origin` | `paperclipai/paperclip` | upstream (fetch only, push 권한 없음) |
| `fork` | `rupy1014/paperclip` | 내 fork (push 대상) |

- 작업 브랜치: `ehowlsla-deploy`
- **"커밋, 푸시, 배포"** = `git push fork ehowlsla-deploy` → rsync → `pm2 restart paperclip`
- upstream 동기화: `git fetch origin && git rebase origin/master` (마이그레이션 충돌 주의)

## Mac Mini 배포 (claw)

### 접속 정보

| 항목 | 값 |
|------|-----|
| SSH | `ssh ehowlsla@claw` |
| OS | macOS (Darwin 25.2.0, arm64 M2) |
| Node | v24.14.0 (fnm) |
| pnpm | 9.15.4 |
| 레포 경로 | `~/paperclip` |
| 서버 포트 | `3100` (API + UI dev proxy) |
| 외부 URL | `https://paperclip.jeommyo.com` |
| 배포 모드 | `authenticated` / `private` |
| 프로세스 관리 | pm2 (paperclip, cloudflared) |

### SSH 환경 주의

SSH non-interactive 세션에서 `fnm`, `nvm` 등 PATH가 자동 설정되지 않음.
모든 원격 명령 앞에 `source ~/.zshrc 2>/dev/null;` 을 붙여야 한다.

```bash
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; cd ~/paperclip && node -v"
```

### 배포 절차

1. **파일 전송** — 로컬에서 rsync로 변경 파일 복사 (git push 권한 없음)
   ```bash
   rsync -avR <changed-files> ehowlsla@claw:~/paperclip/
   ```

2. **마이그레이션 충돌 처리** — upstream master에 이미 존재하는 마이그레이션 번호와 겹칠 수 있음.
   로컬에서 생성된 마이그레이션(0050~0055)을 삭제하고, Mac Mini에서 `drizzle-kit generate`로 재생성:
   ```bash
   # 충돌 마이그레이션 삭제
   rm packages/db/src/migrations/005X_*.sql
   rm packages/db/src/migrations/meta/005X_snapshot.json
   # journal 복원
   git checkout HEAD -- packages/db/src/migrations/meta/_journal.json
   # 재생성
   pnpm --filter @paperclipai/db exec drizzle-kit generate
   ```

3. **upstream 파일 복원** — rsync가 `ui/src/` 전체를 복사하므로, upstream에서 변경된 파일을 덮어쓸 수 있음.
   ```bash
   git checkout HEAD -- <upstream-only-files>
   ```

4. **의존성 설치 + 빌드**
   ```bash
   pnpm install --frozen-lockfile
   pnpm build  # UI typecheck 에러가 upstream 이슈일 수 있음
   ```

5. **서버 시작 (pm2)**
   ```bash
   ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; cd ~/paperclip && pm2 restart paperclip"
   ```
   수동 실행이 필요한 경우:
   ```bash
   pnpm dev:once    # 포그라운드 1회 실행
   pnpm dev         # watch 모드 (파일 변경 감지 + 자동 재시작)
   ```

### pm2 프로세스 관리

claw의 paperclip 서버와 cloudflared 터널은 pm2로 관리된다. 크래시 시 자동 재시작되며, Mac Mini 재부팅 시 launchd를 통해 자동 복구된다.

```bash
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 list"          # 상태 확인
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 logs paperclip" # 실시간 로그
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 restart paperclip" # 재시작
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 restart all"      # 전체 재시작
```

| pm2 앱 | 역할 | 설정 |
|--------|------|------|
| `paperclip` | Paperclip 서버 (port 3100) | autorestart, max 10회, 5초 딜레이 |
| `cloudflared` | Cloudflare Tunnel | autorestart, max 10회, 3초 딜레이 |

설정 파일: `~/paperclip/ecosystem.config.cjs`
부팅 자동시작: `~/Library/LaunchAgents/com.paperclip.pm2.plist` → `pm2 resurrect`

배포 후 서버 반영:
```bash
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 restart paperclip"
# pm2 save는 프로세스 목록 변경 시에만 필요
```

### Cloudflare Tunnel (외부 접근)

`my-local-tunnel` 터널을 통해 외부에서 접근 가능하다.

| 호스트명 | 서비스 | 용도 |
|----------|--------|------|
| `paperclip.jeommyo.com` | `localhost:3100` | Paperclip UI/API |
| `llm-mux.newchar.app` | `localhost:8317` | LLM mux (별도) |

터널 설정: `~/.cloudflared/config.yml`
cloudflared 인증서가 `jeommyo.com` 존 전용이므로, `newchar.app`에 서브도메인을 추가하려면 Cloudflare 대시보드에서 직접 CNAME 추가 필요.

```bash
# 새 호스트네임 추가 절차
# 1. DNS 등록
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; ~/bin/cloudflared tunnel route dns my-local-tunnel <hostname>"
# 2. config.yml에 ingress 추가
# 3. Paperclip allowed-hostname 등록
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; cd ~/paperclip && pnpm paperclipai allowed-hostname <hostname>"
# 4. 터널 + 서버 재시작
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; pm2 restart all"
```

### 마이그레이션 journal 정리

rsync 배포 후 journal과 실제 파일 수가 불일치할 수 있다.
서버 시작 시 `Migration journal/file count mismatch` 에러가 나면:

```bash
ssh ehowlsla@claw 'source ~/.zshrc 2>/dev/null; cd ~/paperclip && python3 -c "
import json, glob, os
with open(\"packages/db/src/migrations/meta/_journal.json\") as f:
    journal = json.load(f)
files = set(os.path.basename(p).replace(\".sql\",\"\") for p in glob.glob(\"packages/db/src/migrations/*.sql\"))
journal_tags = set(e[\"tag\"] for e in journal[\"entries\"])
print(\"In journal but no file:\", sorted(journal_tags - files))
print(\"File but not in journal:\", sorted(files - journal_tags))
"'
```

- journal에만 있고 파일 없는 항목: journal에서 제거
- 파일은 있고 journal에 없는 항목: journal에 추가
- 정리 후 `Files == Journal` 확인

### CLI를 이용한 Paperclip 설정

claw는 `authenticated` 모드로 동작한다. API 호출 시 Bearer 토큰이 필요하다.

#### 인증 토큰

CLI 인증 정보는 `~/.paperclip/auth.json`에 저장되어 있다.
```bash
ssh ehowlsla@claw "cat ~/.paperclip/auth.json"
# → credentials."http://localhost:3100".token 값을 사용
```

토큰이 없으면 CLI로 로그인:
```bash
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; cd ~/paperclip/cli && npx tsx src/index.ts auth login --api-base http://localhost:3100"
```

#### CLI 실행 방법

claw에서 CLI를 실행하려면:
```bash
ssh ehowlsla@claw "source ~/.zshrc 2>/dev/null; cd ~/paperclip/cli && npx tsx src/index.ts <command> --api-base http://localhost:3100 --json"
```

주요 CLI 명령어:
```bash
# 회사 목록
company list --api-base http://localhost:3100 --json

# 회사 삭제
company delete <id> --api-base http://localhost:3100 --confirm <prefix> --yes
```

#### curl로 직접 API 호출

CLI가 불편하면 curl + Bearer 토큰으로 직접 호출 가능:
```bash
TOKEN="pcp_board_..."  # auth.json에서 추출
API="http://localhost:3100"

# 회사 목록
curl -s -H "Authorization: Bearer $TOKEN" $API/api/companies

# 회사 생성
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"회사이름"}' $API/api/companies

# 에이전트 생성 (pending_approval 상태로 생성됨)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"에이전트명","role":"engineer","adapterType":"claude_local","adapterConfig":{"cwd":"/path/to/project"}}' \
  $API/api/companies/<company-id>/agent-hires

# 에이전트 승인
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{}' $API/api/approvals/<approval-id>/approve

# 프로젝트 생성
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"프로젝트명","description":"설명"}' \
  $API/api/companies/<company-id>/projects
```

에이전트 role enum: `ceo`, `cto`, `cmo`, `cfo`, `engineer`, `designer`, `pm`, `qa`, `devops`, `researcher`, `general`

### 현재 상태 (2026-04-08)

- `origin/master` 위에 ehowlsla overlay 커밋 적용됨
- 마이그레이션: `0056_certain_wild_child.sql` (watchdog_targets 테이블)
- 서버 포트 3100에서 `authenticated` / `embedded-postgres` 모드로 pm2 구동 중
- 외부 접속: `https://paperclip.jeommyo.com` (Cloudflare Tunnel)
- DB 마이그레이션은 dev-runner 시작 시 자동 적용됨
- `issue_relations` 테이블은 Drizzle 자동 마이그레이션 누락으로 수동 생성됨 (0049)

#### 현재 회사 설정 (ai-saju2)

| 항목 | 값 |
|------|-----|
| 회사 | `운세냥 Inc` (`11b6dd42...`) |
| 에이전트 | CEO 2 (ceo), CMO (cmo), saju-infra-engineer (engineer, cwd: ai-saju2), Data-Growth (researcher) |
| 프로젝트 | `Growth Operations`, `Product Development` |
| 이전 회사 | `jobdori` (`0d5b6500...`) — 삭제 대기 (DELETE API 500 에러) |

### 주의사항

- Mac Mini에는 git push 권한 없음 — rsync/scp로 파일 동기화
- `pnpm build`에서 upstream UI 테스트 파일(`CommentThread.test.tsx`, `CommandPalette.tsx`) 타입 에러 발생 가능 — ehowlsla 변경과 무관
- Cloudflare Tunnel `my-local-tunnel`이 paperclip (`paperclip.jeommyo.com`) + llm-mux 양쪽 서빙
- 새 어댑터 패키지 추가 시 `server/package.json`의 dependencies에도 workspace 참조를 추가해야 한다 (`"@paperclipai/adapter-xxx": "workspace:*"`)
