# Sprint 1 — Execution Report

> **Sprint:** 1 — Engineering Foundation  
> **Date:** July 26-27, 2026  
> **Status:** Complete ✅  
> **Duration:** 1 day + UI polish

---

## Sprint Goal

> Monorepo running locally with Docker. Every service healthy. CI passing.

**Goal Met:** ✅ Yes

---

## Tasks Completed

### 1.1 Monorepo Setup ✅

**Objective:** Set up Turborepo monorepo with workspaces.

**Files Created:**

| File                 | Purpose                                                     |
| -------------------- | ----------------------------------------------------------- |
| `package.json`       | Root workspace config — defines `apps/*` and `packages/*`   |
| `turbo.json`         | Turborepo task config — build, dev, lint, test, clean       |
| `tsconfig.base.json` | Shared TypeScript settings — all apps inherit               |
| `.prettierrc`        | Code formatting — single quotes, semicolons, 100 char width |
| `.eslintrc.js`       | Linting rules — no `any`, warn on `console.log`             |

**Commands:**

```bash
npm install          # Install all dependencies
npm run dev          # Run all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
```

**Verification:** `npm install` completes without errors.

---

### 1.2 Docker Compose ✅

**Objective:** Containerize infrastructure services.

**File:** `docker-compose.yml`

**Services Running:**

| Service | Image          | Port | Purpose                        |
| ------- | -------------- | ---- | ------------------------------ |
| Redis   | redis:7-alpine | 6379 | Cache, sessions, rate limiting |

**Removed:** PostgreSQL (moved to Supabase cloud)

**Commands:**

```bash
docker compose up -d       # Start all services
docker compose down        # Stop all services
docker compose ps          # Check status
docker compose logs redis  # View Redis logs
```

**Verification:** `docker compose up -d` starts Redis successfully.

---

### 1.3 NestJS Backend ✅

**Objective:** Create NestJS app skeleton with health check.

**Files Created/Updated:**

| File                                  | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `apps/api-nest/src/main.ts`           | App entry — CORS, Swagger, Logging, Port config |
| `apps/api-nest/src/app.module.ts`     | Root module — imports Prisma, Health            |
| `apps/api-nest/src/app.controller.ts` | Routes — GET /api, GET /api/health              |
| `apps/api-nest/src/app.service.ts`    | Business logic — getStatus(), getHealth()       |
| `apps/api-nest/package.json`          | Dependencies — NestJS, Prisma, Swagger, bcrypt  |

**Routes:**

```
GET /api         → { name, version, status, timestamp }
GET /api/health  → { status, timestamp, uptime }
```

**Commands:**

```bash
cd apps/api-nest
npm install
npm run start:dev     # Start in dev mode (port 3000)
npm run build         # Build for production
```

**Verification:** `npm run start:dev` starts server, `curl http://localhost:3000/api/health` returns OK.

---

### 1.4 Prisma + Supabase ✅

**Objective:** Set up Prisma ORM connected to Supabase PostgreSQL.

**Files Created:**

| File                                         | Purpose                             |
| -------------------------------------------- | ----------------------------------- |
| `apps/api-nest/prisma/schema.prisma`         | Database schema — 8 tables          |
| `apps/api-nest/src/prisma/prisma.service.ts` | Prisma service — connect/disconnect |
| `apps/api-nest/src/prisma/prisma.module.ts`  | Prisma module — global injection    |

**Tables Created in Supabase:**

| Table           | Columns                                                 | Purpose            |
| --------------- | ------------------------------------------------------- | ------------------ |
| `users`         | id, email, password_hash, name, role, language          | User accounts      |
| `portfolios`    | id, user_id, name, benchmark                            | User portfolios    |
| `holdings`      | id, portfolio_id, stock_symbol, quantity, avg_buy_price | Portfolio holdings |
| `goals`         | id, user_id, name, target_amount, deadline, type        | Financial goals    |
| `subscriptions` | id, user_id, plan, status                               | Subscription plans |
| `alerts`        | id, user_id, type, stock_symbol, condition              | Price alerts       |
| `watchlists`    | id, user_id, name, stock_symbols                        | Stock watchlists   |
| `audit_logs`    | id, user_id, action, entity, details                    | Action tracking    |

**Commands:**

```bash
cd apps/api-nest
npx prisma db push        # Sync schema to Supabase
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open database GUI (port 5555)
npm run db:seed           # Seed demo data
```

**Supabase Connection:**

```
Host:     db.[PROJECT-REF].supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: [YOUR-PASSWORD]
```

**Verification:** `npx prisma db push` completes, `npm run db:seed` creates demo data.

---

### 1.5 FastAPI AI Service ✅

**Objective:** Create Python FastAPI service for AI/ML tasks.

**Files Created:**

| File                               | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `apps/ai-fastapi/main.py`          | FastAPI app — health check, CORS, routes |
| `apps/ai-fastapi/requirements.txt` | Python dependencies                      |
| `apps/ai-fastapi/app/config.py`    | Settings — reads from .env               |
| `apps/ai-fastapi/app/__init__.py`  | Package init                             |

**Routes:**

```
GET /         → { name, version, status, docs }
GET /health   → { status, service, version, timestamp, uptime }
GET /api/v1/status → { service, status, environment }
```

**Commands:**

```bash
cd apps/ai-fastapi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Verification:** `uvicorn main:app --reload` starts server, `curl http://localhost:8000/health` returns OK.

---

### 1.6 Angular Frontend ✅

**Objective:** Set up Angular with Material UI.

**Files Updated:**

| File                                                       | Purpose                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| `apps/web-angular/package.json`                            | Name → `@quantora/web`                                  |
| `apps/web-angular/proxy.conf.json`                         | Proxy `/api` → NestJS, `/ai` → FastAPI                  |
| `apps/web-angular/src/styles.scss`                         | CSS variables theming system (50+ vars, 4 palettes)     |
| `apps/web-angular/src/app/app.component.html`              | Custom sidebar (no mat-sidenav), toolbar                |
| `apps/web-angular/src/app/app.component.ts`                | Sidebar collapse state, nav items                       |
| `apps/web-angular/src/app/app.module.ts`                   | Material modules (toolbar, icon, button, card, tooltip) |
| `apps/web-angular/src/app/core/services/theme.service.ts`  | Theme switching via data-theme attribute                |
| `apps/web-angular/src/app/core/components/theme-switcher/` | Theme dropdown component                                |
| `apps/web-angular/src/assets/themes/`                      | 4 prebuilt Material theme CSS files                     |

**UI Components:**

- **Custom sidebar** — plain `<aside>`, no Material MDC conflicts. 260px expanded, 72px collapsed
- **Collapsible sidebar** — chevron button, smooth 200ms width transition, tooltips on collapsed icons
- **Theme switcher** — native select dropdown with 4 theme palettes (Slate, Indigo, Emerald, Rose)
- **CSS variables theming** — 50+ custom properties, instant theme swap with 0.3s transitions
- **Toolbar** — title, tagline, theme dropdown, notifications, profile
- **Dashboard** — stat cards, stock table, AI score badges (all theme-aware)

**Theme Palettes:**

| Theme   | Sidebar               | Accent           | Content BG           |
| ------- | --------------------- | ---------------- | -------------------- |
| Slate   | Dark blue (#0f172a)   | Blue (#3b82f6)   | Light gray (#f0f2f5) |
| Indigo  | Deep purple (#1e1b4b) | Indigo (#6366f1) | Lavender (#f5f3ff)   |
| Emerald | Dark green (#022c22)  | Green (#10b981)  | Mint (#ecfdf5)       |
| Rose    | Dark rose (#1c1017)   | Rose (#f43f5e)   | Pink (#fff1f2)       |

**Commands:**

```bash
cd apps/web-angular
npm install
ng serve --proxy-config proxy.conf.json    # Start (port 4200)
```

**Verification:** `ng serve` starts, opens browser at `http://localhost:4200`.

---

### 1.7 Nginx Reverse Proxy ✅

**Objective:** Route traffic to correct services.

**File:** `infrastructure/nginx/nginx.conf`

**Routing:**

| Path     | Target           | Rate Limit |
| -------- | ---------------- | ---------- |
| `/api/*` | NestJS (:3000)   | 60 req/min |
| `/ai/*`  | FastAPI (:8000)  | 30 req/min |
| `/*`     | Angular (static) | —          |

**Features:**

- Security headers (X-Frame-Options, X-Content-Type-Options)
- Gzip compression
- Rate limiting with burst

**Commands:**

```bash
docker compose up nginx    # Start Nginx
curl http://localhost/api/health   # Test via Nginx
```

---

### 1.8 Swagger API Docs ✅

**Objective:** Auto-generated API documentation.

**Endpoint:** `http://localhost:3000/api/docs`

**What it shows:**

- All endpoints with examples
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

**Tags:**

- health — Health check endpoints
- auth — Authentication endpoints
- users — User management
- portfolios — Portfolio management
- stocks — Stock data
- scores — AI scoring
- chat — AI chat

---

### 1.9 Logging ✅

**Objective:** Log every HTTP request.

**File:** `apps/api-nest/src/common/interceptors/logging.interceptor.ts`

**Output Format:**

```
GET /api/health 200 35 - 12ms - ::1 - Mozilla/5.0...
```

**What it logs:**

- HTTP method
- URL
- Status code
- Response size
- Duration
- Client IP
- User agent

---

### 1.10 Health Checks ✅

**Objective:** Monitor service health.

**Files:**

| File                                            | Purpose         |
| ----------------------------------------------- | --------------- |
| `apps/api-nest/src/health/health.module.ts`     | Health module   |
| `apps/api-nest/src/health/health.controller.ts` | Health endpoint |

**Endpoint:** `GET /api/health`

**Response (success):**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

**What it checks:**

- Database connection (Supabase PostgreSQL)

---

### 1.11 Seed Infrastructure ✅

**Objective:** Populate database with demo data.

**File:** `apps/api-nest/prisma/seeds/seed.ts`

**Data Created:**

| Entity       | Details                                                |
| ------------ | ------------------------------------------------------ |
| Admin User   | admin@quantora.com / admin123                          |
| Demo User    | demo@quantora.com / demo123                            |
| Portfolio    | "My Investment Portfolio" (NIFTY_50 benchmark)         |
| Holdings     | ITC ×50, HDFCBANK ×25, INFY ×30, RELIANCE ×15, TCS ×20 |
| Goal         | "Retirement Fund" — ₹50L target, ₹12.5L current        |
| Subscription | Free plan                                              |

**Commands:**

```bash
cd apps/api-nest
npm run db:seed    # Seed database
```

**Verification:** `npm run db:seed` completes, data visible in Prisma Studio.

---

### 1.12 CI Pipeline ✅

**Objective:** Automated testing on every push/PR.

**File:** `.github/workflows/ci.yml`

**Jobs:**

| Job       | What It Does                        |
| --------- | ----------------------------------- |
| Lint      | Check code style for API and Web    |
| Build API | Compile NestJS                      |
| Build Web | Compile Angular                     |
| Test API  | Run unit tests (with Redis service) |

**Triggers:**

- Push to `main` or `develop`
- Pull request to `main` or `develop`

**Services (for testing):**

- Redis (container)

**Environment Variables (from GitHub Secrets):**

- `DATABASE_URL` — Supabase connection string

---

### 1.13 Prettier + ESLint ✅

**Objective:** Consistent code formatting and linting.

**Files:**

| File           | Purpose          |
| -------------- | ---------------- |
| `.prettierrc`  | Formatting rules |
| `.eslintrc.js` | Linting rules    |

**Prettier Rules:**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**ESLint Rules:**

```javascript
{
  "no-unused-vars": "warn",
  "no-explicit-any": "warn",
  "no-console": "warn"
}
```

**Commands:**

```bash
npm run format    # Format all files
npm run lint      # Lint all files
```

---

### 1.14 Husky + Commitlint ✅

**Objective:** Enforce code quality on every commit.

**Files:**

| File                   | Purpose                         |
| ---------------------- | ------------------------------- |
| `.husky/pre-commit`    | Runs lint-staged before commit  |
| `.husky/commit-msg`    | Validates commit message format |
| `commitlint.config.js` | Commit message rules            |
| `.lintstagedrc`        | What to lint on staged files    |

**Commit Message Format:**

```
type(scope): description

feat(auth): add login endpoint
fix(portfolio): correct holdings calculation
docs(api): update Swagger documentation
```

**Allowed Types:**

```
feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

**Allowed Scopes:**

```
api, web, ai, auth, portfolio, stocks, goals, chat, news, scores, prisma, docker, nginx, ci, deps
```

**Lint-Staged Actions:**

```
*.ts, *.tsx → eslint --fix + prettier --write
*.js, *.jsx → eslint --fix + prettier --write
*.json, *.md → prettier --write
```

---

## Database Summary

### Supabase (PostgreSQL)

**Connection:**

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Tables:** 8 tables created

**Seed Data:**

- 2 users (admin + demo)
- 1 portfolio
- 5 holdings
- 1 goal
- 1 subscription

### MongoDB Atlas

**Connection:**

```
mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net
```

**Status:** Connected, ready for Sprint 3

### Redis

**Connection:**

```
redis://localhost:6379
```

**Status:** Running in Docker

---

## How to Run

### Start Everything

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Start NestJS backend
cd apps/api-nest
npm run start:dev

# 3. Start FastAPI AI service
cd apps/ai-fastapi
uvicorn main:app --reload --port 8000

# 4. Start Angular frontend
cd apps/web-angular
ng serve --proxy-config proxy.conf.json
```

### Access Points

| Service       | URL                              |
| ------------- | -------------------------------- |
| Frontend      | http://localhost:4200            |
| Backend API   | http://localhost:3000/api        |
| Swagger Docs  | http://localhost:3000/api/docs   |
| AI Service    | http://localhost:8000            |
| AI Docs       | http://localhost:8000/docs       |
| Health Check  | http://localhost:3000/api/health |
| Prisma Studio | http://localhost:5555            |
| Nginx         | http://localhost:80              |

---

## Environment Variables

### apps/api-nest/.env

```env
PORT=3000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net
REDIS_URL=redis://localhost:6379
JWT_SECRET=[GENERATE-A-RANDOM-SECRET-KEY]
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-[YOUR-KEY]
AI_SERVICE_URL=http://localhost:8000
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### apps/ai-fastapi/.env

```env
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-[YOUR-KEY]
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

---

## What's Ready for Sprint 2

| Component | Status       | Ready For                             |
| --------- | ------------ | ------------------------------------- |
| NestJS    | ✅ Running   | Auth module, Guards, JWT              |
| Prisma    | ✅ Connected | User queries, RBAC                    |
| Supabase  | ✅ Seeded    | User registration, login              |
| Redis     | ✅ Running   | Sessions, rate limiting               |
| Angular   | ✅ Running   | Login/Register pages, themes, sidebar |
| Swagger   | ✅ Running   | Auth endpoint docs                    |

---

## UI Enhancements (July 27, 2026)

### Theme Switching System

- **CSS Variables** — 50+ custom properties per theme, zero hardcoded colors
- **4 palettes** — Slate (default), Indigo, Emerald, Rose
- **Instant swap** — `data-theme` attribute on `<body>`, 0.3s CSS transitions
- **Persistence** — theme choice saved in `localStorage`

### Collapsible Sidebar

- **Custom implementation** — plain `<aside>` div, no Material `mat-sidenav` conflicts
- **Expanded** — 260px, full labels, logo + "Quantora" text
- **Collapsed** — 72px, centered icons only, tooltips on hover
- **Smooth transition** — 200ms width animation
- **Footer button** — chevron toggle with tooltip

### Architecture Decision

- Replaced `mat-sidenav` + `mat-list-item` (MDC) with plain HTML elements
- Eliminated Material MDC CSS variable conflicts (`--mdc-list-*`)
- Full CSS control over layout, spacing, and transitions
- Only Material components used: `mat-icon`, `mat-toolbar`, `mat-card`, `mat-tooltip`, `mat-icon-button`

---

## Security Audit (July 27, 2026)

### Findings

| Category                 | Status   | Details                                                                            |
| ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| .env leak detection      | ✅ Clean | No .env files in git, properly gitignored                                          |
| Hardcoded secrets        | ✅ Clean | No MongoDB/PostgreSQL/Redis credentials in source                                  |
| render.yaml secrets      | ✅ Clean | No inline secrets (using `sync: false`)                                            |
| Critical vulnerabilities | ✅ Fixed | `tar@6.2.1` (bcrypt chain) overridden to `^7.4.3`                                  |
| High vulnerabilities     | ⚠️ 68    | All in dev dependencies (webpack, vite, babel, jest, karma) — no production impact |
| Moderate vulnerabilities | ⚠️ 19    | `@nestjs/common`, `body-parser`, `multer` — fixable with NestJS 11 upgrade         |
| API keys                 | ✅ Clean | No AWS/OpenAI keys in source                                                       |

### CI Security Checks (5 automated gates)

1. **Dependency audit** — `npm audit --audit-level=critical` (fails on critical vulns)
2. **.env leak detection** — checks no `.env` files are committed to git
3. **Hardcoded secrets scan** — regex patterns for MongoDB, PostgreSQL, Redis, Bearer tokens, API keys
4. **Gitignore verification** — confirms `.env` is in `.gitignore`
5. **render.yaml audit** — ensures no inline secrets in deployment config

### Remaining Risks

| Risk                     | Mitigation                        | Sprint    |
| ------------------------ | --------------------------------- | --------- |
| 68 high dev-only vulns   | Build tools, no production impact | Monitor   |
| NestJS 10 moderate vulns | Upgrade to NestJS 11 when stable  | Sprint 3+ |
| No CSP headers           | Add via Nginx/render.yaml         | Sprint 2  |
| No rate limiting         | Add in Sprint 2                   | Sprint 2  |

---

## Known Issues

| Issue                       | Severity | Workaround          |
| --------------------------- | -------- | ------------------- |
| Prisma 7.x breaking changes | Medium   | Pinned to 5.22.0    |
| No SSL for local Redis      | Low      | Use Redis in Docker |
| MongoDB not used yet        | Low      | Ready for Sprint 3  |

---

## Next Sprint

**Sprint 2 — Identity & Security**

- User registration (bcrypt + validation)
- User login (JWT + refresh tokens)
- JWT strategy + guards
- RBAC (user, pro, admin roles)
- Profile management
- Password reset
- Audit logging
- Rate limiting per user tier
- Auth E2E tests
- Login/Register Angular components

---

_Sprint 1 completed on July 26-27, 2026._
