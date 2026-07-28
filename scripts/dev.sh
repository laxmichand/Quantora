#!/usr/bin/env bash
set +e

# ─── Quantora Local Development Launcher ──────────────────────────────────────
# Starts NestJS + Angular immediately, FastAPI if Python version supports it.
# Usage:  bash scripts/dev.sh   or   make dev
# ──────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NESTJS_DIR="$ROOT_DIR/apps/api-nest"
ANGULAR_DIR="$ROOT_DIR/apps/web-angular"
FASTAPI_DIR="$ROOT_DIR/apps/ai-fastapi"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}  [dev]${NC} $1"; }
ok()    { echo -e "${GREEN}  [dev]${NC} $1"; }
warn()  { echo -e "${YELLOW}  [dev]${NC} $1"; }
err()   { echo -e "${RED}  [dev]${NC} $1"; }

cleanup() {
  echo ""
  info "Shutting down Quantora services..."
  kill "$PID_NEST" 2>/dev/null || true
  kill "$PID_FASTAPI" 2>/dev/null || true
  kill "$PID_ANGULAR" 2>/dev/null || true
  wait 2>/dev/null
  ok "All services stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Prerequisites ────────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v node    >/dev/null 2>&1 || { err "node is required"; exit 1; }
command -v python3 >/dev/null 2>&1 || warn "python3 not found — AI service won't start"

PYTHON_VERSION=""
PYTHON_MAJOR=0
PYTHON_MINOR=0
if command -v python3 &>/dev/null; then
  PYTHON_VERSION="$(python3 --version 2>/dev/null | cut -d' ' -f2)"
  PYTHON_MAJOR="$(echo "$PYTHON_VERSION" | cut -d. -f1)"
  PYTHON_MINOR="$(echo "$PYTHON_VERSION" | cut -d. -f2)"
fi
ok "node $(node -v) | python3 $PYTHON_VERSION"

# ─── Install npm deps (if missing) ────────────────────────────────────────────
if [ ! -d "$ROOT_DIR/node_modules" ]; then
  info "Installing npm dependencies..."
  cd "$ROOT_DIR" && npm install --silent
  ok "npm dependencies installed"
fi

# ─── Start JS services (NestJS + Angular) ────────────────────────────────────

info "Starting NestJS API (port 3000)..."
cd "$NESTJS_DIR" && npx nest start --watch &
PID_NEST=$!
sleep 0.5

info "Starting Angular frontend (port 4200)..."
cd "$ANGULAR_DIR" && npx ng serve --proxy-config proxy.conf.json &
PID_ANGULAR=$!
sleep 0.5

# ─── Start FastAPI (only if Python 3.12 or below) ────────────────────────────
PID_FASTAPI=""
START_AI=false
if command -v python3 &>/dev/null; then
  if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -le 12 ]; then
    START_AI=true
  fi
fi

if [ "$START_AI" = true ]; then
  PYTHON_READY="$FASTAPI_DIR/.venv/.deps_installed"
  if [ ! -f "$PYTHON_READY" ]; then
    info "Installing Python dependencies..."
    cd "$FASTAPI_DIR"
    python3 -m venv .venv 2>/dev/null
    source .venv/bin/activate
    pip install --quiet -r "$FASTAPI_DIR/requirements.txt" 2>&1 | tail -1
    if [ $? -eq 0 ]; then
      touch "$PYTHON_READY"
      
      ok "Python dependencies installed"
    else
      warn "Some Python deps failed — install manually: cd apps/ai-fastapi && pip install -r requirements.txt"
    fi
    deactivate
  fi

  info "Starting FastAPI AI Service (port 8000)..."
  cd "$FASTAPI_DIR" && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
  PID_FASTAPI=$!
else
  warn "Python $PYTHON_VERSION has no wheels for asyncpg/pandas. AI service requires Python ≤3.12."
  warn "Install Python 3.12: brew install python@3.12"
  warn "Then: python3.12 -m venv apps/ai-fastapi/.venv && source apps/ai-fastapi/.venv/bin/activate && pip install -r apps/ai-fastapi/requirements.txt"
  warn "AI service not started. Frontend + API are running."
fi

# ─── Wait for services to start ──────────────────────────────────────────────
sleep 2

# ─── URLs ─────────────────────────────────────────────────────────────────────
echo ""
ok "┌─────────────────────────────────────────────────────────────────┐"
ok "│  Quantora is running!                                          │"
ok "│                                                                 │"
if [ -n "$PID_FASTAPI" ] && kill -0 "$PID_FASTAPI" 2>/dev/null; then
  ok "│  Frontend   → http://localhost:4200                             │"
  ok "│  API        → http://localhost:3000/api/health                  │"
  ok "│  AI Service → http://localhost:8000/health                      │"
  ok "│  API Docs   → http://localhost:3000/api/docs                    │"
  ok "│  AI Docs    → http://localhost:8000/docs                        │"
else
  ok "│  Frontend   → http://localhost:4200                             │"
  ok "│  API        → http://localhost:3000/api/health                  │"
  ok "│  API Docs   → http://localhost:3000/api/docs                    │"
  ok "│                                                                 │"
  ok "│  AI Service: not started (Python $PYTHON_VERSION incompatibility)           │"
fi
ok "│                                                                 │"
ok "│  Press Ctrl+C to stop all services                              │"
ok "└─────────────────────────────────────────────────────────────────┘"
echo ""

wait
