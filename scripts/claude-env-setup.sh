#!/bin/bash
# Claude Code bulut ortamı setup script'i — repodan bağımsız.
# Ortam ayarlarındaki "Setup script" alanına bu dosyanın TAMAMI yapıştırılır;
# böylece bu ortamda açılan her oturumda, hangi repo olursa olsun, çalışır.
#
# Yeni bir skill eklemek için aşağıdaki SKILLS listesine satır ekleyin.
# Her adım bağımsız: biri başarısız olsa da oturum açılmaya devam eder.

log() { echo "[claude-env-setup] $*"; }

# ---------------------------------------------------------------------------
# A) Global skill'ler (~/.claude/skills — her repoda görünür)
#    Biçim: "<kaynak repo> <skill adı> [<skill adı> ...]"
# ---------------------------------------------------------------------------
SKILLS=(
  # Skill bulucu
  "https://github.com/vercel-labs/skills find-skills"
  # Oyun geliştirme (HTML5 Canvas/WebGL) ve Google Play sayfası denetimi
  "https://github.com/github/awesome-copilot game-engine"
  "https://github.com/coreyhaines31/marketingskills aso"
  # Three.js
  "https://github.com/cloudai-x/threejs-skills threejs-fundamentals threejs-geometry threejs-materials threejs-lighting threejs-textures threejs-animation threejs-loaders threejs-shaders threejs-postprocessing threejs-interaction"
  # Capacitor (Android/iOS paketleme)
  "https://github.com/cap-go/capgo-skills debugging-capacitor safe-area-handling ios-android-logs capacitor-testing"
  # Firebase (CRM ve danışmanlık portalı)
  "https://github.com/firebase/agent-skills firebase-basics firebase-auth-basics firebase-firestore firebase-hosting-basics firebase-security-rules-auditor firestore-rules-creation firebase-ai-logic-basics"
  # Gemini API
  "https://github.com/google-gemini/gemini-skills gemini-api-dev"
  # Çalışma disiplini: planlama, hata ayıklama, test, kod incelemesi (Superpowers)
  "https://github.com/obra/superpowers brainstorming dispatching-parallel-agents executing-plans finishing-a-development-branch receiving-code-review requesting-code-review subagent-driven-development systematic-debugging test-driven-development using-git-worktrees verification-before-completion writing-plans writing-skills"
  # Arayüz tasarımı (UI/UX Pro Max)
  "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ui-ux-pro-max ui-styling design-system banner-design"
  # Yapay zekâ kokan metinleri temizleme
  "https://github.com/hardikpandya/stop-slop stop-slop"
  # Pazarlama (oyun ve okul tanıtımı)
  "https://github.com/coreyhaines31/marketingskills copywriting copy-editing ad-creative ads social content-strategy launch marketing-ideas marketing-psychology seo-audit image video"
  # Video (Remotion)
  "https://github.com/remotion-dev/skills remotion-best-practices remotion-create remotion-markup remotion-captions remotion-multimedia remotion-render remotion-studio remotion-docs remotion-interactivity"
  # Kısa cevap modları: /i-have-adhd ("stop adhd mode" ile kapanır), /caveman ("stop caveman" ile kapanır)
  "https://github.com/ayghri/i-have-adhd i-have-adhd"
  "https://github.com/JuliusBrussee/caveman caveman"
)

# ---------------------------------------------------------------------------
# B) Agent Reach ve bağımlılıkları
# ---------------------------------------------------------------------------

# 1) Sistem paketleri: gh CLI ve ffmpeg (podcast transkripsiyonu için)
apt-get update -qq >/dev/null 2>&1 || log "apt-get update başarısız"
apt-get install -y -qq --no-install-recommends gh ffmpeg >/dev/null 2>&1 \
  || log "gh/ffmpeg kurulamadı"

# 2) Node araçları: mcporter (Exa arama ve LinkedIn MCP için)
npm install -g mcporter >/dev/null 2>&1 || log "mcporter kurulamadı"

# 3) uv/uvx (LinkedIn MCP sunucusunu çalıştırmak için)
pip install -q uv >/dev/null 2>&1 || log "uv kurulamadı"
export PATH="$HOME/.local/bin:$PATH"

# 4) Agent Reach: zip indirme engelli olabildiği için git clone ile kur
SRC="$HOME/.agent-reach/src"
rm -rf "$SRC"
if git clone -q --depth 1 https://github.com/Panniantong/agent-reach.git "$SRC"; then
  pip install -q "$SRC" >/dev/null 2>&1 || log "agent-reach pip kurulumu başarısız"
else
  log "agent-reach klonlanamadı"
fi

# 5) Kanallar ve yapılandırma
if command -v agent-reach >/dev/null 2>&1; then
  agent-reach install --env=auto --system --channels=all >/dev/null 2>&1 \
    || log "agent-reach install bazı adımlarda başarısız (cookie/key gerektiren kanallar için normal)"
fi

mkdir -p "$HOME/.config/yt-dlp"
# yt-dlp düz "node" adını bulamıyor; tam yol verilmeli
NODE_BIN="$(readlink -f "$(command -v node)" 2>/dev/null)"
if [ -n "$NODE_BIN" ]; then
  echo "--js-runtimes node:$NODE_BIN" > "$HOME/.config/yt-dlp/config"
fi

if command -v mcporter >/dev/null 2>&1; then
  mcporter config add exa https://mcp.exa.ai/mcp --scope home >/dev/null 2>&1 || true
  mcporter config add linkedin --command uvx --arg mcp-server-linkedin@latest \
    --env UV_HTTP_TIMEOUT=300 --scope home >/dev/null 2>&1 || true
fi


# ---------------------------------------------------------------------------
# A) devam: skill'leri kur
# ---------------------------------------------------------------------------
mkdir -p "$HOME/.claude/skills"
command -v agent-reach >/dev/null 2>&1 \
  && { agent-reach skill --install >/dev/null 2>&1 || log "agent-reach skill kurulamadı"; }

for entry in "${SKILLS[@]}"; do
  read -r src names <<<"$entry"
  # shellcheck disable=SC2086  # skill adları bilerek kelimelere bölünür
  (cd /tmp && npx -y skills add "$src" --skill $names --agent claude-code -g -y >/dev/null 2>&1) \
    || log "skill kurulamadı: $names"
done

# Graphify: kod tabanını sorgulanabilir bilgi grafiğine çevirir (/graphify)
if command -v uv >/dev/null 2>&1 && uv tool install -q graphifyy >/dev/null 2>&1; then
  graphify install >/dev/null 2>&1 || log "graphify skill kurulamadı"
  # Ürettiği graphify-out/ klasörü hiçbir repoya karışmasın
  mkdir -p "$HOME/.config/git"
  grep -qxF 'graphify-out/' "$HOME/.config/git/ignore" 2>/dev/null \
    || echo 'graphify-out/' >> "$HOME/.config/git/ignore"
else
  log "graphify kurulamadı"
fi

# ---------------------------------------------------------------------------
# C) Key/cookie hook'u: her oturum başında ortam değişkenlerinden ayarlar
# ---------------------------------------------------------------------------
mkdir -p "$HOME/.claude/hooks"
cat > "$HOME/.claude/hooks/agent-reach-keys.sh" <<'KEYS_EOF'
#!/bin/bash
# Agent Reach key/cookie ayarı — her oturum başında SessionStart hook'u çalıştırır.
# Değerleri ortamın environment variables alanından okur; tanımlı olmayanları atlar.
# Değerler asla komut satırı argümanı olarak geçirilmez (stdin kullanılır).
#
#   EXA_API_KEY          Exa web araması
#   GROQ_API_KEY         Xiaoyuzhou podcast transkripsiyonu
#   TWITTER_AUTH_TOKEN   Twitter/X (TWITTER_CT0 ile birlikte)
#   TWITTER_CT0
#   REDDIT_COOKIE        Reddit, Cookie-Editor "Header String" çıktısı
#   XUEQIU_COOKIE        Xueqiu, Cookie-Editor "Header String" çıktısı
#
# Xiaohongshu burada yok: xiaohongshu-mcp Docker container'ı gerektiriyor.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
command -v agent-reach >/dev/null 2>&1 || exit 0

log() { echo "[agent-reach-keys] $*" >&2; }
configured=()

if [ -n "$EXA_API_KEY" ] && command -v mcporter >/dev/null 2>&1; then
  mcporter config remove exa --scope home >/dev/null 2>&1
  if mcporter config add exa "https://mcp.exa.ai/mcp?exaApiKey=${EXA_API_KEY}" --scope home >/dev/null 2>&1; then
    configured+=(exa)
  else
    log "Exa ayarlanamadı"
  fi
fi

if [ -n "$GROQ_API_KEY" ]; then
  printf '%s' "$GROQ_API_KEY" | agent-reach configure groq-key --stdin >/dev/null 2>&1 \
    && configured+=(groq) || log "Groq key ayarlanamadı"
fi

if [ -n "$TWITTER_AUTH_TOKEN" ] && [ -n "$TWITTER_CT0" ]; then
  printf 'auth_token=%s; ct0=%s' "$TWITTER_AUTH_TOKEN" "$TWITTER_CT0" \
    | agent-reach configure twitter-cookies --stdin >/dev/null 2>&1 \
    && configured+=(twitter) || log "Twitter cookie'leri ayarlanamadı"
fi

# Xueqiu ve Reddit için agent-reach'te stdin'li configure komutu yok; dosyaya doğrudan yazılır.
AR_PY="$(head -1 "$(command -v agent-reach)" | sed 's/^#!//')"

if [ -n "$XUEQIU_COOKIE" ]; then
  "$AR_PY" - <<'EOF' && configured+=(xueqiu) || log "Xueqiu cookie'si ayarlanamadı"
import os
from agent_reach.config import Config
Config().set("xueqiu_cookie", os.environ["XUEQIU_COOKIE"].strip())
EOF
fi

if [ -n "$REDDIT_COOKIE" ]; then
  python3 - <<'EOF' && configured+=(reddit) || log "Reddit cookie'si ayarlanamadı"
import json, os, time
from pathlib import Path
cookies = {}
for part in os.environ["REDDIT_COOKIE"].split(";"):
    name, sep, value = part.strip().partition("=")
    if sep and name:
        cookies[name] = value
if "reddit_session" not in cookies:
    raise SystemExit("reddit_session cookie missing")
path = Path.home() / ".config" / "rdt-cli" / "credential.json"
path.parent.mkdir(parents=True, exist_ok=True)
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w") as f:
    json.dump({"cookies": cookies, "source": "env", "saved_at": time.time()}, f)
EOF
fi

[ ${#configured[@]} -gt 0 ] && log "ayarlandı: ${configured[*]}"
exit 0
KEYS_EOF
chmod +x "$HOME/.claude/hooks/agent-reach-keys.sh"

python3 - <<'PY_EOF' || log "global hook yazılamadı"
import json
from pathlib import Path
path = Path.home() / ".claude" / "settings.json"
data = json.loads(path.read_text()) if path.exists() else {}
command = 'bash "$HOME/.claude/hooks/agent-reach-keys.sh"'
groups = data.setdefault("hooks", {}).setdefault("SessionStart", [])
if not any(h.get("command") == command for g in groups for h in g.get("hooks", [])):
    groups.append({"hooks": [{"type": "command", "command": command}]})
path.write_text(json.dumps(data, indent=2) + "\n")
PY_EOF

log "tamamlandı"
exit 0
