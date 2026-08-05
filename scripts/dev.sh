#!/usr/bin/env bash
set +e

# ─── Quantora Local Development Launcher ──────────────────────────────────────
# One command to run the whole stack locally:
#   npm start          # start everything (frontend + API + optional AI)
#   npm run stop       # stop everything started by this script
#   npm run local      # same as start
#   npm run dev:api    # just the NestJS API
#   npm run dev:web    # just the Angular frontend
#   npm run dev:ai     # just the FastAPI AI service
# ──────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NESTJS_DIR="$ROOT_DIR/apps/api-nest"
ANGULAR_DIR="$ROOT_DIR/apps/web-angular"
FASTAPI_DIR="$ROOT_DIR/apps/ai-fastapi"
ENV_FILE="$ROOT_DIR/.env"

API_PORT=3000
WEB_PORT=4200
AI_PORT=8000

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}  [dev]${NC} $1"; }
ok()    { echo -e "${GREEN}  [dev]${NC} $1"; }
warn()  { echo -e "${YELLOW}  [dev]${NC} $1"; }
err()   { echo -e "${RED}  [dev]${NC} $1"; }

port_in_use() { lsof -ti:"$1" >/dev/null 2>&1; }

# ─── subcommands ──────────────────────────────────────────────────────────────
case "$1" in
  stop)
    info "Stopping Quantora services on ports $API_PORT/$WEB_PORT/$AI_PORT..."
    for p in $API_PORT $WEB_PORT $AI_PORT; do
      lsof -ti:$p 2>/dev/null | xargs kill 2>/dev/null
    done
    sleep 1
    ok "Stopped. (If anything still lingers, run: npm run stop)"
    exit 0
    ;;
  status)
    for pair in "$API_PORT:API" "$WEB_PORT:Web" "$AI_PORT:AI"; do
      p="${pair%%:*}"; name="${pair##*:}"
      if port_in_use "$p"; then ok "  $name on :$p — running"; else warn "  $name on :$p — stopped"; fi
    done
    exit 0
    ;;
esac

cleanup() {
  echo ""
  info "Shutting down Quantora services..."
  for p in $API_PORT $WEB_PORT $AI_PORT; do
    lsof -ti:$p 2>/dev/null | xargs kill 2>/dev/null
  done
  ok "All services stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Prerequisites ────────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v node    >/dev/null 2>&1 || { err "node is required (v24.x)"; exit 1; }
command -v python3 >/dev/null 2>&1 || warn "python3 not found — AI service won't start"
ok "node $(node -v)"

# ─── Environment file ─────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE.example" ]; then
    cp "$ENV_FILE.example" "$ENV_FILE"
    warn "Created .env from .env.example — edit it with real values, then re-run."
    exit 1
  else
    err "Missing .env — add one at the repo root (see .env.example)."
    exit 1
  fi
fi
if grep -q "DATABASE_URL=postgresql://" "$ENV_FILE" && grep -qiE "^DATABASE_URL=.*YOUR|^DATABASE_URL=$" "$ENV_FILE"; then
  warn ".env looks unconfigured — set DATABASE_URL/JWT_SECRET, then re-run."
fi

# ─── Install npm deps (if missing) ────────────────────────────────────────────
if [ ! -d "$ROOT_DIR/node_modules" ]; then
  info "Installing npm dependencies (first run — this takes a moment)..."
  (cd "$ROOT_DIR" && npm install --silent)
  ok "npm dependencies installed"
fi

# ─── Port checks ──────────────────────────────────────────────────────────────
PORT_OWNER=""
if port_in_use "$API_PORT"; then PORT_OWNER="$API_PORT (API)"; fi
if port_in_use "$WEB_PORT"; then PORT_OWNER="$PORT_OWNER $WEB_PORT (Web)"; fi
if port_in_use "$AI_PORT"; then PORT_OWNER="$PORT_OWNER $AI_PORT (AI)"; fi
if [ -n "$PORT_OWNER" ]; then
  warn "Port(s) already in use:$PORT_OWNER"
  warn "Run 'npm run stop' first, then try again."
  exit 1
fi

# ─── Start NestJS API ─────────────────────────────────────────────────────────
info "Starting NestJS API on :$API_PORT..."
(cd "$NESTJS_DIR" && npx nest start --watch) &
PID_NEST=$!

# Wait for API health
API_URL="http://localhost:$API_PORT/api/health"
for i in $(seq 1 30); do
  if curl -sf "$API_URL" >/dev/null 2>&1; then ok "API healthy — $API_URL"; break; fi
  if ! kill -0 "$PID_NEST" 2>/dev/null; then err "API failed to start — check apps/api-nest logs."; break; fi
  sleep 1
done

# ─── Start Angular frontend ───────────────────────────────────────────────────
info "Starting Angular frontend on :$WEB_PORT..."
(cd "$ANGULAR_DIR" && npx ng serve --proxy-config proxy.conf.json) &
PID_ANGULAR=$!

for i in $(seq 1 60); do
  if curl -sf "http://localhost:$WEB_PORT" >/dev/null 2>&1; then ok "Frontend ready — http://localhost:$WEB_PORT"; break; fi
  if ! kill -0 "$PID_ANGULAR" 2>/dev/null; then err "Frontend failed to start — check apps/web-angular logs."; break; fi
  sleep 1
done

# ─── FastAPI (only if Python ≤ 3.12) ─────────────────────────────────────────
PID_FASTAPI=""
START_AI=false
PYTHON_VERSION=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_VERSION="$(python3 --version 2>/dev/null | cut -d' ' -f2)"
  PYTHON_MAJOR="$(echo "$PYTHON_VERSION" | cut -d. -f1)"
  PYTHON_MINOR="$(echo "$PYTHON_VERSION" | cut -d. -f2)"
  if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -le 12 ]; then
    START_AI=true
  fi
fi

if [ "$START_AI" = true ]; then
  PYTHON_READY="$FASTAPI_DIR/.venv/.deps_installed"
  if [ ! -f "$PYTHON_READY" ]; then
    info "Installing Python dependencies..."
    (cd "$FASTAPI_DIR" && python3 -m venv .venv && source .venv/bin/activate && pip install --quiet -r requirements.txt) 2>&1 | tail -1
    if [ -f "$FASTAPI_DIR/.venv/bin/uvicorn" ]; then
      touch "$PYTHON_READY"
      ok "Python dependencies installed"
    else
      warn "Some Python deps failed — install manually: cd apps/ai-fastapi && pip install -r requirements.txt"
    fi
  fi

  info "Starting FastAPI AI Service on :$AI_PORT..."
  (cd "$FASTAPI_DIR" && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port "$AI_PORT") &
  PID_FASTAPI=$!
else
  warn "Python $PYTHON_VERSION has no wheels for asyncpg/pandas. AI service requires Python ≤3.12."
  warn "Install: brew install python@3.12  → then run 'npm run dev:ai'"
fi

# ─── URLs ─────────────────────────────────────────────────────────────────────
echo ""
ok "┌─────────────────────────────────────────────────────────────────┐"
ok "│  Quantora is running!                                          │"
ok "│                                                                 │"
ok "│  Frontend   → http://localhost:$WEB_PORT                               │"
ok "│  API        → http://localhost:$API_PORT/api/health                   │"
ok "│  API Docs   → http://localhost:$API_PORT/api/docs                     │"
if [ -n "$PID_FASTAPI" ] && kill -0 "$PID_FASTAPI" 2>/dev/null; then
  ok "│  AI Service → http://localhost:$AI_PORT/health                        │"
  ok "│  AI Docs    → http://localhost:$AI_PORT/docs                          │"
else
  ok "│  AI Service: not started (Python $PYTHON_VERSION incompatibility)           │"
fi
ok "│                                                                 │"
ok "│  Press Ctrl+C to stop all services                              │"
ok "└─────────────────────────────────────────────────────────────────┘"
echo ""

wait
