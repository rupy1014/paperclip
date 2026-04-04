# claw Mac Mini 배포 가이드

> **상태**: 운영 절차
> **목적**: `claw` 호스트에 `ehowlsla` 브랜치를 배포할 때 따라야 하는 절차를 기록한다.
> **대상 독자**: `claw` 호스트 운영자
> **관련 문서**: [`../README.md`](../README.md), [`../STRATEGY.md`](../STRATEGY.md), [`claw-operations-log.md`](./claw-operations-log.md)
> **정합 기준**: [`../../DEVELOPING.md`](../../DEVELOPING.md), [`../../DEPLOYMENT-MODES.md`](../../DEPLOYMENT-MODES.md)


## 서버 정보

- **호스트**: `ssh ehowlsla@claw`
- **OS**: macOS Darwin 25.2.0 (ARM64 Mac Mini, M2)
- **RAM**: 16GB
- **디스크**: 228GB (144GB 여유)

## 배포 순서

### Step 1: 런타임 설치

```bash
# Homebrew 설치 (없으면)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 20 + pnpm
brew install node@20
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Git (macOS 기본 포함, 최신 버전 원하면)
brew install git
brew install gh  # GitHub CLI (선택)
```

### Step 2: 프로젝트 클론 및 브랜치

```bash
cd ~/
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
git checkout -b ehowlsla
git remote add upstream https://github.com/paperclipai/paperclip.git
```

### Step 3: 의존성 설치 및 빌드

```bash
pnpm install
pnpm build
```

### Step 4: 초기 설정 (onboard)

```bash
npx paperclipai onboard --yes
# embedded PostgreSQL 자동 생성
# config: ~/.paperclip/instances/default/config.json
```

### Step 5: 실행

```bash
npx paperclipai run
# → http://claw:3100 (또는 IP:3100)
```

### Step 6: 외부 접근 설정

로컬 네트워크에서 접근하려면:

```bash
# 배포 모드를 authenticated + private으로 설정
npx paperclipai configure --section deployment
# mode: authenticated
# exposure: private

# 허용 호스트 추가
npx paperclipai allowed-hostname claw
npx paperclipai allowed-hostname claw.local
```

## 접근 URL

```
http://claw:3100          # 같은 네트워크
http://claw.local:3100    # Bonjour/mDNS
http://<IP>:3100          # IP 직접
```

## 서비스 자동 시작 (launchd)

```bash
cat > ~/Library/LaunchAgents/com.paperclip.server.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.paperclip.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/ehowlsla/paperclip/cli/dist/index.js</string>
        <string>run</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/ehowlsla/paperclip</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/ehowlsla/.paperclip/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/ehowlsla/.paperclip/logs/stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

mkdir -p ~/.paperclip/logs
launchctl load ~/Library/LaunchAgents/com.paperclip.server.plist
```

## 트러블슈팅

```bash
# 상태 확인
npx paperclipai doctor

# 로그 확인
tail -f ~/.paperclip/logs/stdout.log

# DB 백업
npx paperclipai db:backup

# 서비스 재시작
launchctl unload ~/Library/LaunchAgents/com.paperclip.server.plist
launchctl load ~/Library/LaunchAgents/com.paperclip.server.plist
```