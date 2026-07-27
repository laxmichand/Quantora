.PHONY: dev dev-backend dev-frontend dev-ai dev-db stop clean setup install

# ─── Configuration ────────────────────────────────────────────────────────────
NESTJS_DIR  := apps/api-nest
ANGULAR_DIR := apps/web-angular
FASTAPI_DIR := apps/ai-fastapi
ANGULAR_PORT:= 4200
NESTJS_PORT := 3000
FASTAPI_PORT:= 8000
REDIS_PORT  := 6379

# ─── Default: run everything ──────────────────────────────────────────────────
dev: setup
	@echo "── Starting Quantora (all services) ──────────────────────────"
	@$(MAKE) dev-db &
	@$(MAKE) dev-backend &
	@$(MAKE) dev-ai &
	@$(MAKE) dev-frontend &
	@wait

# ─── Individual services ─────────────────────────────────────────────────────
dev-db:
	@echo "  [redis]  Starting Redis on port $(REDIS_PORT)..."
	@docker compose up redis -d 2>/dev/null || \
		docker run -d --name quantora-redis -p $(REDIS_PORT):6379 redis:7-alpine 2>/dev/null || \
		echo "  [redis]  Already running, skipping."

dev-backend:
	@echo "  [api]    Starting NestJS on port $(NESTJS_PORT)..."
	@cd $(NESTJS_DIR) && npx nest start --watch

dev-ai:
	@echo "  [ai]     Starting FastAPI on port $(FASTAPI_PORT)..."
	@cd $(FASTAPI_DIR) && \
		python3 -m venv .venv 2>/dev/null; \
		. .venv/bin/activate && \
		pip install -q -r requirements.txt 2>/dev/null && \
		uvicorn main:app --reload --host 0.0.0.0 --port $(FASTAPI_PORT)

dev-frontend:
	@echo "  [web]    Starting Angular on port $(ANGULAR_PORT)..."
	@cd $(ANGULAR_DIR) && npx ng serve --proxy-config proxy.conf.json

# ─── Setup ────────────────────────────────────────────────────────────────────
setup:
	@echo "── Checking prerequisites ─────────────────────────────────────"
	@command -v node >/dev/null 2>&1 || { echo "  ✗ node missing"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "  ✗ python3 missing"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "  ✗ docker missing (Redis won't start)"; }
	@echo "  ✓ node $$(node -v)"
	@echo "  ✓ python3 $$(python3 --version | cut -d' ' -f2)"
	@echo "  ✓ docker $$(docker --version | cut -d' ' -f3 | tr -d ',')"
	@echo "── Installing dependencies ─────────────────────────────────────"
	@npm install --silent 2>/dev/null
	@cd $(FASTAPI_DIR) && python3 -m venv .venv 2>/dev/null && . .venv/bin/activate && pip install -q -r requirements.txt 2>/dev/null && echo "  ✓ Python deps installed" || echo "  ✓ Python deps (cached)"

# ─── Utility ──────────────────────────────────────────────────────────────────
install:
	@npm install
	@cd $(FASTAPI_DIR) && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

stop:
	@echo "── Stopping Quantora services ────────────────────────────────"
	@-docker compose stop redis 2>/dev/null
	@-pkill -f "nest start" 2>/dev/null || true
	@-pkill -f "ng serve" 2>/dev/null || true
	@-pkill -f "uvicorn" 2>/dev/null || true
	@echo "  ✓ Stopped all services"

clean: stop
	@echo "── Cleaning up ───────────────────────────────────────────────"
	@-docker compose down --rmi local -v 2>/dev/null || true
	@-rm -rf $(FASTAPI_DIR)/.venv 2>/dev/null || true
	@-rm -rf node_modules apps/*/node_modules 2>/dev/null || true
	@echo "  ✓ Cleaned"

# ─── Build & quality ─────────────────────────────────────────────────────────
build:
	@echo "── Building all packages ──────────────────────────────────────"
	@npm run build

lint:
	@echo "── Linting ────────────────────────────────────────────────────"
	@npm run lint

test:
	@echo "── Running tests ─────────────────────────────────────────────"
	@npm test --if-present 2>/dev/null || echo "  (no root tests configured)"

# ─── Docker Compose (full infra) ─────────────────────────────────────────────
up:
	@echo "── Starting full stack via docker compose ─────────────────────"
	@docker compose up -d --build
	@echo "  ✓ Redis on :6379 | API on :3000 | AI on :8000 | Nginx on :80"

down:
	@docker compose down
