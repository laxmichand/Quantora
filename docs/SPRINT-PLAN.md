# Quantora — Sprint Engineering Plan

> **Engineering-first. Production-ready. Every sprint follows the same template.**

---

## Sprint Template (Enterprise — 34 Sections)

Every sprint follows the full enterprise template. See `docs/templates/SPRINT-TEMPLATE.md`.

```
 1. Sprint Goal               18. Event-Driven Design
 2. Business Requirements     19. Security Design
 3. Functional Requirements   20. Scalability Design
 4. Non-Functional Reqs       21. Performance Design
 5. User Stories              22. Caching Strategy
 6. Use Cases                 23. Observability
 7. Acceptance Criteria       24. Feature Flags
 8. Architecture Diagram      25. Unit Tests
 9. C4 Architecture           26. Integration Tests
10. Sequence Diagrams         27. Contract Tests
11. Database Design           28. E2E Tests
12. Prisma Schema             29. Load Tests
13. API Contracts             30. Chaos Tests
14. Folder Structure          31. CI/CD
15. Backend Design            32. Deployment
16. AI Service Design         33. Documentation
17. Frontend Design           34. Definition of Done
```

**Enterprise Checklists**: See `docs/templates/ENTERPRISE-CHECKLISTS.md`

**Design Principle**: Design for 1M users, implement for 100, validate with 10, scale when metrics justify it.

---

## Sprint 1 — Engineering Foundation ✅ COMPLETE

**Goal:** Monorepo running locally with Docker. Every service healthy. CI passing.
**Status:** ✅ Complete (July 26-27, 2026)
**Live:** Frontend (Vercel), API + AI (Render), DB (Supabase) — ₹0/month

### Architecture

```
quantora/
├── apps/
│   ├── api-nest/          # NestJS Backend
│   ├── ai-fastapi/        # Python AI Service
│   └── web-angular/       # Angular Frontend
├── packages/
│   ├── shared-types/      # TypeScript shared types
│   ├── api-client/        # Generated API client
│   ├── config/            # Shared config
│   └── utils/             # Shared utilities
├── infrastructure/
│   ├── docker/            # Dockerfiles
│   ├── nginx/             # Reverse proxy
│   ├── postgres/          # Init scripts
│   ├── redis/             # Redis config
│   └── minio/             # Object storage
├── docs/
│   ├── architecture/
│   ├── api/
│   └── sprint-books/
├── docker-compose.yml
├── package.json           # Root workspace
├── turbo.json             # Turborepo config
└── .github/workflows/     # CI/CD
```

### Tasks

| #    | Task                | What You Build                             | Done When                          | Status                                    |
| ---- | ------------------- | ------------------------------------------ | ---------------------------------- | ----------------------------------------- |
| 1.1  | Monorepo setup      | Root `package.json`, Turborepo, workspaces | `npm install` works at root        | ✅ Done                                   |
| 1.2  | Docker Compose      | PostgreSQL 16, Redis 7, MinIO              | `docker compose up -d` all healthy | ✅ Done (supabase for PG, MinIO deferred) |
| 1.3  | NestJS app skeleton | `apps/api-nest` with health check          | `GET /health` returns OK           | ✅ Done                                   |
| 1.4  | Prisma setup        | `prisma/schema.prisma`, connection         | `npx prisma db push` succeeds      | ✅ Done                                   |
| 1.5  | FastAPI skeleton    | `apps/ai-fastapi` with health check        | `GET /health` returns OK           | ✅ Done                                   |
| 1.6  | Angular skeleton    | `apps/web-angular` with Material           | `ng serve` shows app               | ✅ Done                                   |
| 1.7  | Nginx reverse proxy | Route `/api` → NestJS, `/ai` → FastAPI     | All routes work via Nginx          | ✅ Done                                   |
| 1.8  | Swagger setup       | NestJS Swagger docs                        | `GET /api/docs` shows Swagger UI   | ✅ Done                                   |
| 1.9  | Logging             | LoggingInterceptor for NestJS              | Structured JSON logs               | ✅ Done                                   |
| 1.10 | Health checks       | `/health` for all services                 | Docker health checks pass          | ✅ Done                                   |
| 1.11 | Seed infrastructure | Seed command for all DBs                   | `npm run seed` works               | ✅ Done                                   |
| 1.12 | CI pipeline         | GitHub Actions: lint, build, test          | PR triggers CI                     | ✅ Done                                   |
| 1.13 | Prettier + ESLint   | Config at root, shared rules               | `npm run lint` passes              | ✅ Done                                   |
| 1.14 | Husky + Commitlint  | Pre-commit hooks                           | Bad commits rejected               | ✅ Done                                   |

### Prisma Schema (Initial)

```prisma
// packages/shared-types/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  phone         String?
  role          String    @default("user")
  language      String    @default("en")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

### Environment Variables

```env
# Root .env
DATABASE_URL=postgresql://quantora:quantora@localhost:5432/quantora
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-xxx
```

### Definition of Done

- [x] `docker compose up -d` starts all services
- [x] All health checks pass
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] CI pipeline green on GitHub
- [x] Swagger UI accessible
- [x] Seed script works
- [x] turbo.json renamed from .bak and working

---

## Sprint 2 — Identity & Security ✅ COMPLETE + Top Nav + Header Redesign + Dev Tooling

**Goal:** User registers, logs in, gets JWT. RBAC works. Email verified. Audit trail active. TickerTape-style header with live ticker, search, mega dropdowns, theme system.

**Status:** ✅ Complete (July 26-27, 2026)

### Architecture

```
Frontend → NestJS API → PostgreSQL
   │
   ├─ POST /auth/register → bcrypt hash → save user → send verification email
   ├─ POST /auth/verify-email → token → mark email verified
   ├─ POST /auth/login → check email_verified → return JWT + refresh
   ├─ POST /auth/refresh → validate refresh → new JWT
   ├─ GET /auth/me → JWT guard → return user
   └─ POST /auth/logout → invalidate refresh token
```

### Tasks

| #    | Task                                                          | Files                                     | Done When                                                    | Status                                                                     |
| ---- | ------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 2.1  | User schema + RefreshToken + AuditLog + UserPreference tables | `prisma/schema.prisma`                    | `npx prisma migrate dev` creates all 4 tables                | ✅ Done                                                                    |
| 2.2  | Auth module (register + login)                                | `apps/api-nest/src/auth/`                 | Register + Login endpoints                                   | ✅ Done                                                                    |
| 2.3  | JWT strategy                                                  | `apps/api-nest/src/auth/strategies/`      | JWT validation works                                         | ✅ Done                                                                    |
| 2.4  | Refresh tokens                                                | `apps/api-nest/src/auth/`                 | Token refresh works                                          | ✅ Done                                                                    |
| 2.5  | RBAC guard (user/pro/admin)                                   | `apps/api-nest/src/common/guards/`        | Role-based access                                            | ✅ Done                                                                    |
| 2.6  | Email verification                                            | `apps/api-nest/src/auth/`                 | Verify via token                                             | ✅ Done (stub)                                                             |
| 2.7  | Password reset                                                | `apps/api-nest/src/auth/`                 | Email-based reset flow                                       | ✅ Done (stub)                                                             |
| 2.8  | Password salt + pepper + bcrypt                               | `apps/api-nest/src/auth/`                 | Pepper from env, bcrypt 12 rounds                            | ✅ Done                                                                    |
| 2.9  | User preferences CRUD                                         | `apps/api-nest/src/preferences/`          | GET/PATCH preferences, auto-create on register               | ✅ Done (GET + PATCH at `/user/preferences`, auto-created in auth service) |
| 2.10 | Audit logging                                                 | `apps/api-nest/src/common/interceptors/`  | Every API call logged                                        | ✅ Done                                                                    |
| 2.11 | Rate limiting                                                 | `apps/api-nest/src/common/guards/`        | 60 req/min per IP                                            | ✅ Done                                                                    |
| 2.12 | Auth UI (Login/Register pages)                                | `apps/web-angular/src/app/features/auth/` | Login/Register pages                                         | ✅ Done (no verification prompt)                                           |
| 2.13 | Unit tests                                                    | `*.spec.ts`                               | All auth functions tested                                    | ✅ 22 passing                                                              |
| 2.14 | E2E tests                                                     | `apps/api-nest/test/auth.e2e-spec.ts`     | Full auth flow tested                                        | ✅ 17 passing                                                              |
| 2.15 | API docs                                                      | Swagger                                   | Auth endpoints documented                                    | ✅ 8 endpoints done                                                        |
| 2.16 | **Dev tooling (Makefile + dev.sh)**                           | `Makefile`, `scripts/dev.sh`              | `make dev` starts all services                               | ✅ Done                                                                    |
| 2.17 | **Angular Material prebuilt theme**                           | `angular.json`, `styles.scss`             | Material components render correctly                         | ✅ Done                                                                    |
| 2.18 | **TickerTape-style header**                                   | `apps/web-angular/src/styles.scss`        | Ticker strip, search pill, nav, more dropdown, profile panel | ✅ Done                                                                    |
| 2.19 | **Theme variables for header**                                | `apps/web-angular/src/styles.scss`        | `--ticker-search-bg`, `--nav-hover-bg` across 5 themes       | ✅ Done                                                                    |
| 2.20 | **Sprint plan expansion (15 sprints)**                        | `docs/SPRINT-PLAN.md`                     | MCP, AI agents, brokers, screener, workflows added           | ✅ Done                                                                    |

### Prisma Schema

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String    @map("password_hash")
  name            String
  phone           String?
  role            String    @default("user")  // user, pro, admin
  isActive        Boolean   @default(true) @map("is_active")
  isEmailVerified Boolean   @default(false) @map("is_email_verified")
  emailVerifyToken String? @map("email_verify_token")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]
  preferences     UserPreference?

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("refresh_tokens")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String?  @map("entity_id")
  details   Json?
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}

model UserPreference {
  id                  String   @id @default(uuid())
  userId              String   @unique @map("user_id")
  language            String   @default("en")
  theme               String   @default("slate")
  dateFormat          String   @default("DD/MM/YYYY")
  numberFormat        String   @default("indian")
  timezone            String   @default("Asia/Kolkata")
  notificationsEmail  Boolean  @default(true) @map("notifications_email")
  notificationsPush   Boolean  @default(true) @map("notifications_push")
  notificationsSms    Boolean  @default(false) @map("notifications_sms")
  notifyPriceAlerts   Boolean  @default(true) @map("notify_price_alerts")
  notifyPortfolio     Boolean  @default(true) @map("notify_portfolio")
  notifyNews          Boolean  @default(false) @map("notify_news")
  notifyAiInsights    Boolean  @default(true) @map("notify_ai_insights")
  defaultExchange     String   @default("NSE")
  riskTolerance       String   @default("moderate")
  investmentStyle     String   @default("long_term")
  sidebarCollapsed    Boolean  @default(false) @map("sidebar_collapsed")
  defaultView         String   @default("dashboard")
  profilePublic       Boolean  @default(false) @map("profile_public")
  showPortfolio       Boolean  @default(false) @map("show_portfolio")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("user_preferences")
}
```

### Password Security: Salt + Pepper

```
Password → + Pepper (env) → bcrypt(12 rounds) → Hash (contains salt)
Verification: Password + Pepper → bcrypt.compare(hash)
```

### API Endpoints

```
POST /api/auth/register        → { user, accessToken, refreshToken } (sends verification email)
POST /api/auth/verify-email    → { success }
POST /api/auth/login           → { accessToken, refreshToken } (rejects if email not verified)
POST /api/auth/refresh         → { accessToken }
POST /api/auth/logout          → { success }
GET  /api/auth/me              → { user }
POST /api/auth/forgot-password → { success }
POST /api/auth/reset-password  → { success }
GET  /api/user/preferences     → { preferences }
PUT  /api/user/preferences     → { success, preferences }
```

### Definition of Done

- [x] Register → verify email → login → get profile works
- [x] Unverified email cannot login (enforced in login: `ForbiddenException('Please verify your email before logging in')`)
- [x] JWT expires and refresh works (15min access, 7d refresh, rotation)
- [x] RBAC blocks unauthorized access
- [x] User preferences auto-created on register (done in auth service)
- [x] GET/PATCH preferences works at `/user/preferences`
- [x] Password uses salt + pepper + bcrypt (12 rounds)
- [x] Audit logs recorded
- [x] Rate limiting active
- [x] All tests pass (22 unit + 17 E2E)
- [ ] Swagger docs updated
- [x] `make dev` starts all services (NestJS + Angular + FastAPI)
- [x] Angular Material components render correctly
- [x] TickerTape-style header with ticker strip, search, nav, dropdowns
- [x] Theme variables defined for header across all 5 themes
- [x] Sprint plan expanded to 15 sprints with new features

---

## Sprint 3 — Social Login & Account Security

**Goal:** Google login works. Account lockout active. Login history tracked.

### Architecture

```
Frontend → Google OAuth → NestJS API → PostgreSQL
   │
   ├─ GET /auth/google → redirect to Google consent
   ├─ GET /auth/google/callback → exchange code → find/create user → JWT
   ├─ POST /auth/login → check failed attempts → lock if 5 failures
   └─ GET /auth/login-history → recent login attempts
```

### Tasks

| #   | Task                    | Files                                                  | Done When                               |
| --- | ----------------------- | ------------------------------------------------------ | --------------------------------------- |
| 3.1 | Google OAuth setup      | Google Cloud Console                                   | OAuth credentials created               |
| 3.2 | OIDC strategy           | `apps/api-nest/src/auth/strategies/google.strategy.ts` | Google login works                      |
| 3.3 | Google auth endpoints   | `apps/api-nest/src/auth/auth.controller.ts`            | `/auth/google` + callback               |
| 3.4 | Link Google to user     | `apps/api-nest/src/auth/auth.service.ts`               | New users auto-created, existing linked |
| 3.5 | Account lockout         | `apps/api-nest/src/common/guards/`                     | 5 failed attempts → 15min lock          |
| 3.6 | Login history           | `prisma/schema.prisma` + interceptor                   | Track IP, device, timestamp             |
| 3.7 | Auth UI — Google button | `apps/web-angular/src/app/features/auth/`              | "Sign in with Google" button            |
| 3.8 | Unit tests              | `*.spec.ts`                                            | All new auth functions tested           |

### Prisma Schema Addition

```prisma
model LoginHistory {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  user      User?    @relation(fields: [userId], references: [id])
  email     String
  success   Boolean
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  failureReason String? @map("failure_reason")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([email])
  @@index([createdAt])
  @@map("login_history")
}

// Add to User model:
//   provider       String?   // "google", "local"
//   providerId     String?   @map("provider_id")
//   loginHistories LoginHistory[]
```

### Account Lockout Rules

| Attempts              | Action                      |
| --------------------- | --------------------------- |
| 1-4                   | Normal login                |
| 5                     | Lock account for 15 minutes |
| After lockout expires | Reset counter               |
| Successful login      | Reset counter               |

### API Endpoints

```
GET  /auth/google              → redirect to Google
GET  /auth/google/callback     → exchange code → JWT
GET  /auth/login-history       → last 10 login attempts
```

### Definition of Done

- [ ] Google login creates new user or links to existing
- [ ] 5 failed logins locks account for 15 minutes
- [ ] Login history tracked with IP + device
- [ ] Google button on login page
- [ ] All tests pass
- [ ] Swagger docs updated

---

## Sprint 4 — Market Data Platform

**Goal:** Live stock prices, historical data, fundamentals — all flowing through Kafka into PostgreSQL + Redis.

### Architecture

```
External APIs (NSE/BSE/Yahoo)
        │
        ▼
    Kafka (stock.prices)
        │
   ┌────┼────────────┐
   ▼    ▼            ▼
PostgreSQL  MongoDB   Redis
(Stocks)    (News)    (Live Prices)
```

### Tasks

| #    | Task                     | Files                                       | Done When                   |
| ---- | ------------------------ | ------------------------------------------- | --------------------------- |
| 3.1  | Stock schema + migration | `prisma/schema.prisma`                      | Stocks table created        |
| 3.2  | Stock master data        | `apps/api-nest/src/market-data/`            | CRUD for stocks             |
| 3.3  | Data fetcher service     | `apps/ai-fastapi/app/services/`             | yfinance fetches live price |
| 3.4  | Kafka producer           | `apps/api-nest/src/kafka/`                  | Price updates published     |
| 3.5  | Kafka consumer           | `apps/api-nest/src/kafka/`                  | Price updates consumed      |
| 3.6  | Redis cache layer        | `apps/api-nest/src/cache/`                  | Prices cached 5 min         |
| 3.7  | Historical data          | `apps/ai-fastapi/`                          | 1Y daily OHLCV              |
| 3.8  | Fundamentals             | `apps/ai-fastapi/`                          | P/E, P/B, ROE, debt         |
| 3.9  | Scheduler                | `apps/api-nest/src/scheduler/`              | Daily sync at 3:30 PM IST   |
| 3.10 | Stock list UI            | `apps/web-angular/src/app/features/stocks/` | Stock list page             |
| 3.11 | Stock detail UI          | Same                                        | Stock detail with chart     |
| 3.12 | Unit tests               | `*.spec.ts`                                 | All services tested         |
| 3.13 | Integration tests        | `apps/api-nest/test/`                       | Kafka flow tested           |

### Prisma Schema

```prisma
model Stock {
  id              String   @id @default(uuid())
  symbol          String   @unique
  name            String
  exchange        String   // NSE, BSE
  sector          String
  industry        String?
  marketCap       Decimal? @map("market_cap")
  currentPrice    Decimal? @map("current_price")
  pe              Decimal? @map("pe")
  pb              Decimal? @map("pb")
  roe             Decimal? @map("roe")
  dividendYield   Decimal? @map("dividend_yield")
  beta            Decimal?
  fiftyTwoWeekHigh Decimal? @map("fifty_two_week_high")
  fiftyTwoWeekLow  Decimal? @map("fifty_two_week_low")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  holdings        Holding[]
  scores          Score[]
  watchlistItems  WatchlistItem[]

  @@map("stocks")
}

model StockPrice {
  id        String   @id @default(uuid())
  stockId   String   @map("stock_id")
  stock     Stock    @relation(fields: [stockId], references: [id])
  date      DateTime
  open      Decimal
  high      Decimal
  low       Decimal
  close     Decimal
  volume    BigInt
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([stockId, date])
  @@index([date])
  @@map("stock_prices")
}
```

### Redis Key Patterns

```
stock:price:ITC     → { price: 462.50, change: 2.3, volume: 1234567 }
stock:history:ITC   → [{ date, open, high, low, close, volume }]
stock:fundamentals:ITC → { pe: 25.3, pb: 7.8, roe: 28.5 }
```

### Definition of Done

- [ ] Live prices fetch from yfinance
- [ ] Prices flow through Kafka
- [ ] Redis caches prices (5 min TTL)
- [ ] Historical data available (1Y)
- [ ] Fundamentals available
- [ ] Stock list UI shows live prices
- [ ] Daily scheduler works
- [ ] All tests pass

---

## Sprint 5 — Portfolio Platform

**Goal:** User creates portfolio, adds holdings, sees live P&L.

### Tasks

| #    | Task              | Files                                          | Done When                   |
| ---- | ----------------- | ---------------------------------------------- | --------------------------- |
| 5.1  | Portfolio schema  | `prisma/schema.prisma`                         | Portfolio + Holdings tables |
| 5.2  | Portfolio service | `apps/api-nest/src/portfolio/`                 | CRUD for portfolios         |
| 5.3  | Holding service   | Same                                           | Add/remove holdings         |
| 5.4  | P&L calculator    | Same                                           | Live profit/loss            |
| 5.5  | CSV import        | Same                                           | Upload portfolio CSV        |
| 5.6  | Watchlist         | Same                                           | User watchlists             |
| 5.7  | Portfolio UI      | `apps/web-angular/src/app/features/portfolio/` | Portfolio page              |
| 5.8  | Add holding UI    | Same                                           | Add holding form            |
| 5.9  | Holdings table    | Same                                           | Table with live prices      |
| 5.10 | Unit tests        | `*.spec.ts`                                    | All services tested         |

### Prisma Schema

```prisma
model Portfolio {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id])
  name      String    @default("My Portfolio")
  benchmark String    @default("NIFTY_50")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  holdings  Holding[]

  @@map("portfolios")
}

model Holding {
  id          String   @id @default(uuid())
  portfolioId String   @map("portfolio_id")
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id])
  stockId     String   @map("stock_id")
  stock       Stock    @relation(fields: [stockId], references: [id])
  quantity    Int
  avgBuyPrice Decimal  @map("avg_buy_price")
  addedAt     DateTime @default(now()) @map("added_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("holdings")
}

model Watchlist {
  id        String          @id @default(uuid())
  userId    String          @map("user_id")
  name      String          @default("My Watchlist")
  createdAt DateTime        @default(now()) @map("created_at")
  items     WatchlistItem[]

  @@map("watchlists")
}

model WatchlistItem {
  id          String    @id @default(uuid())
  watchlistId String    @map("watchlist_id")
  watchlist   Watchlist @relation(fields: [watchlistId], references: [id])
  stockId     String    @map("stock_id")
  stock       Stock     @relation(fields: [stockId], references: [id])
  addedAt     DateTime  @default(now()) @map("added_at")

  @@unique([watchlistId, stockId])
  @@map("watchlist_items")
}
```

### Definition of Done

- [ ] Create portfolio, add holdings
- [ ] Live P&L calculated
- [ ] CSV import works
- [ ] Watchlist works
- [ ] Portfolio UI shows holdings with live prices
- [ ] All tests pass

---

## Sprint 6 — Analytics Engine

**Goal:** AI scores every stock. Explanations in plain language.

### Tasks

| #    | Task               | Files                                              | Done When                  |
| ---- | ------------------ | -------------------------------------------------- | -------------------------- |
| 6.1  | Score schema       | `prisma/schema.prisma`                             | Scores table               |
| 6.2  | Value score        | `apps/ai-fastapi/app/services/`                    | P/E, P/B scoring           |
| 6.3  | Quality score      | Same                                               | ROE, ROCE, debt scoring    |
| 6.4  | Growth score       | Same                                               | Revenue/profit CAGR        |
| 6.5  | Risk score         | Same                                               | Beta, drawdown, pledge     |
| 6.6  | Technical score    | Same                                               | RSI, MACD, MA              |
| 6.7  | Dividend score     | Same                                               | Yield, payout, consistency |
| 6.8  | Composite AI score | Same                                               | Weighted average           |
| 6.9  | Score explanation  | `apps/ai-fastapi/app/services/ai_service.py`       | LLM generates explanation  |
| 6.10 | Score API          | `apps/ai-fastapi/app/api/v1/endpoints/analysis.py` | All score endpoints        |
| 6.11 | Backend proxy      | `apps/api-nest/src/ai/`                            | NestJS proxies to AI       |
| 6.12 | Batch score        | Same                                               | All 50 stocks scored       |
| 6.13 | Score UI           | `apps/web-angular/src/app/features/stocks/`        | Score card component       |
| 6.14 | Score history      | `prisma/schema.prisma`                             | Track score changes        |
| 6.15 | Unit tests         | `*.spec.ts`                                        | All scoring tested         |

### Prisma Schema

```prisma
model Score {
  id        String   @id @default(uuid())
  stockId   String   @map("stock_id")
  stock     Stock    @relation(fields: [stockId], references: [id])
  date      DateTime
  aiScore   Int      @map("ai_score")
  valueScore Int     @map("value_score")
  qualityScore Int  @map("quality_score")
  growthScore Int   @map("growth_score")
  riskScore Int      @map("risk_score")
  technicalScore Int @map("technical_score")
  dividendScore Int @map("dividend_score")
  explanation String?
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([stockId, date])
  @@index([aiScore])
  @@map("scores")
}
```

### API Endpoints

```
GET  /api/stocks/{symbol}/score         → Full score card
GET  /api/stocks/{symbol}/score/value   → Value score only
GET  /api/stocks/{symbol}/score/quality → Quality score only
GET  /api/stocks/{symbol}/explain       → LLM explanation
GET  /api/stocks/scores                 → All stocks ranked
```

### Definition of Done

- [ ] All 6 sub-scores calculated
- [ ] Composite AI score works
- [ ] LLM explanation generated
- [ ] Batch scoring for all stocks
- [ ] Score UI shows scorecard
- [ ] Score history tracked
- [ ] All tests pass

---

## Sprint 7 — Risk Engine

**Goal:** Portfolio-level risk metrics. VaR, Sharpe, Beta, Heatmap.

### Tasks

| #    | Task                  | Files                                          | Done When                    |
| ---- | --------------------- | ---------------------------------------------- | ---------------------------- |
| 7.1  | Volatility calculator | `apps/ai-fastapi/app/services/risk_service.py` | 30D, 90D, 1Y volatility      |
| 7.2  | Beta calculator       | Same                                           | Stock beta vs Nifty          |
| 7.3  | Sharpe ratio          | Same                                           | Risk-adjusted return         |
| 7.4  | Sortino ratio         | Same                                           | Downside risk-adjusted       |
| 7.5  | VaR calculator        | Same                                           | 95% and 99% VaR              |
| 7.6  | Portfolio risk        | Same                                           | Portfolio-level metrics      |
| 7.7  | Correlation matrix    | Same                                           | Cross-stock correlations     |
| 7.8  | Risk heatmap          | Same                                           | Color-coded risk levels      |
| 7.9  | Risk explanation      | `apps/ai-fastapi/app/services/ai_service.py`   | LLM explains risk            |
| 7.10 | Risk API endpoints    | `apps/ai-fastapi/app/api/v1/endpoints/risk.py` | All endpoints                |
| 7.11 | Risk UI               | `apps/web-angular/src/app/features/portfolio/` | Risk dashboard               |
| 7.12 | Heatmap component     | Same                                           | Visual heatmap               |
| 7.13 | Unit tests            | `*.spec.ts`                                    | All risk calculations tested |

### API Endpoints

```
GET  /api/risk/stocks/{symbol}/volatility
GET  /api/risk/stocks/{symbol}/beta
GET  /api/risk/stocks/{symbol}/sharpe
GET  /api/risk/stocks/{symbol}/var
GET  /api/risk/portfolio
GET  /api/risk/portfolio/heatmap
GET  /api/risk/portfolio/explain
```

### Definition of Done

- [ ] All risk metrics calculated
- [ ] Portfolio-level risk works
- [ ] Heatmap visualization works
- [ ] LLM explains risk in plain language
- [ ] All tests pass

---

## Sprint 8 — AI Platform + 2FA + Sessions + MCP Tool Architecture

**Goal:** LLM gateway, chat, memory, RAG foundation. 2FA enabled. Session management active. MCP (Model Context Protocol) tools for AI-to-system actions.

### Tasks

| #    | Task                        | Files                                          | Done When                                                                                                         |
| ---- | --------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 8.1  | LLM gateway                 | `apps/ai-fastapi/app/core/llm.py`              | OpenAI/Anthropic/Gemini/Groq abstraction                                                                          |
| 8.2  | Prompt engine               | `apps/ai-fastapi/app/core/prompts.py`          | Template management                                                                                               |
| 8.3  | Chat endpoint               | `apps/ai-fastapi/app/api/v1/endpoints/chat.py` | Q&A works                                                                                                         |
| 8.4  | Stock context               | Same                                           | "Buy ITC?" → fetches data                                                                                         |
| 8.5  | Portfolio context           | Same                                           | "My portfolio?" → reads holdings                                                                                  |
| 8.6  | Memory store                | `apps/ai-fastapi/app/core/memory.py`           | Chat history in MongoDB                                                                                           |
| 8.7  | RAG foundation              | `apps/ai-fastapi/app/core/rag.py`              | Vector search works                                                                                               |
| 8.8  | pgvector setup              | `infrastructure/postgres/`                     | Vector extension enabled                                                                                          |
| 8.9  | Embedding service           | `apps/ai-fastapi/app/services/`                | Text → embeddings                                                                                                 |
| 8.10 | Chat UI                     | `apps/web-angular/src/app/features/ai-chat/`   | Chat interface                                                                                                    |
| 8.11 | Chat history UI             | Same                                           | Past conversations                                                                                                |
| 8.12 | 2FA (TOTP)                  | `apps/api-nest/src/auth/`                      | Google Authenticator integration                                                                                  |
| 8.13 | 2FA setup UI                | `apps/web-angular/src/app/features/auth/`      | QR code + setup flow                                                                                              |
| 8.14 | Session management          | `apps/api-nest/src/auth/`                      | View active devices, revoke sessions                                                                              |
| 8.15 | **MCP Tool Registry**       | `apps/ai-fastapi/app/mcp/`                     | Tool registration with JSON schema                                                                                |
| 8.16 | **MCP Tool Dispatcher**     | `apps/ai-fastapi/app/mcp/dispatcher.py`        | Tool execution state machine                                                                                      |
| 8.17 | **Built-in MCP tools**      | `apps/ai-fastapi/app/mcp/tools/`               | 12 tools: search, fetch price, portfolio, screen, news, risk, forecast, compare, watchlist, alert, score, explain |
| 8.18 | **Tool-to-LLM bridge**      | `apps/ai-fastapi/app/services/ai_service.py`   | LLM calls tools via function-calling API                                                                          |
| 8.19 | **Multi-provider router**   | `apps/ai-fastapi/app/core/router.py`           | OpenAI, Anthropic, Gemini, Groq, Ollama                                                                           |
| 8.20 | **OpenBB-style MCP Server** | `apps/ai-fastapi/app/mcp/server.py`            | All data exposed as MCP tools via `mcp` protocol                                                                  |
| 8.21 | **Router Pattern**          | `apps/ai-fastapi/app/core/router.py`           | Single endpoint definition → auto-generates Python SDK + REST + MCP (inspired by OpenBB Router)                   |
| 8.22 | **Standardized Data Model** | `apps/ai-fastapi/app/core/models.py`           | Pydantic-based normalized schema for all providers (inspired by OpenBB `Data` class)                              |
| 8.23 | **Session memory per user** | `apps/ai-fastapi/app/core/session.py`          | AI chat remembers context across conversations                                                                    |
| 8.24 | Unit tests                  | `*.spec.ts`                                    | All AI + 2FA + MCP services tested                                                                                |

### Prisma Schema

```prisma
model ChatConversation {
  id        String        @id @default(uuid())
  userId    String        @map("user_id")
  title     String?
  language  String        @default("en")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")
  messages  ChatMessage[]

  @@map("chat_conversations")
}

model ChatMessage {
  id             String           @id @default(uuid())
  conversationId String           @map("conversation_id")
  conversation   ChatConversation @relation(fields: [conversationId], references: [id])
  role           String           // user, assistant
  content        String
  sources        Json?
  metadata       Json?
  createdAt      DateTime         @default(now()) @map("created_at")

  @@map("chat_messages")
}
```

### Definition of Done

- [ ] LLM gateway works (OpenAI/Anthropic)
- [ ] Chat with stock context works
- [ ] Chat with portfolio context works
- [ ] Chat history stored
- [ ] RAG foundation works
- [ ] pgvector embeddings work
- [ ] Chat UI functional
- [ ] All tests pass

---

## Sprint 9 — News Intelligence

**Goal:** News collected, summarized, sentiment-scored, mapped to stocks.

### Tasks

| #    | Task               | Files                                               | Done When                 |
| ---- | ------------------ | --------------------------------------------------- | ------------------------- |
| 8.1  | News schema        | `prisma/schema.prisma`                              | News table in MongoDB     |
| 8.2  | RSS collector      | `apps/ai-fastapi/app/services/news_service.py`      | ET, LiveMint fetched      |
| 8.3  | AI summarizer      | Same                                                | 2-3 sentence summary      |
| 8.4  | Sentiment analyzer | `apps/ai-fastapi/app/services/sentiment_service.py` | Positive/negative/neutral |
| 8.5  | Stock-news mapper  | Same                                                | News linked to stocks     |
| 8.6  | Impact scorer      | Same                                                | News rated 1-10           |
| 8.7  | Credibility scorer | Same                                                | Fake news detection       |
| 8.8  | News API endpoints | `apps/ai-fastapi/app/api/v1/endpoints/news.py`      | All endpoints             |
| 8.9  | News UI            | `apps/web-angular/src/app/features/dashboard/`      | News feed component       |
| 8.10 | Unit tests         | `*.spec.ts`                                         | All news services tested  |

### MongoDB Document

```javascript
// MongoDB: news collection
{
  _id: ObjectId,
  title: "ITC Q4 results beat expectations",
  summary: "ITC reported 8% revenue growth...",
  source: "Economic Times",
  url: "https://...",
  publishedAt: ISODate,
  sentiment: { label: "positive", confidence: 0.87, score: 0.72 },
  impact: { score: 7, affectedStocks: ["ITC"] },
  credibility: { score: 0.92, flags: [] },
  createdAt: ISODate
}
```

### Definition of Done

- [ ] News collected from RSS feeds
- [ ] AI summary generated
- [ ] Sentiment scored
- [ ] News mapped to stocks
- [ ] Impact scored
- [ ] Credibility scored
- [ ] News UI shows feed
- [ ] All tests pass

---

## Sprint 10 — Forecast, Goals & Named AI Agents

**Goal:** Price forecasts, goal planning, passive income, sector intelligence. 37 named AI investor agents (inspired by Fincept Terminal).

### Tasks

| #     | Task                         | Files                                        | Done When                                                               |
| ----- | ---------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| 13.1  | Price forecaster             | `apps/ai-fastapi/app/ml/forecaster.py`       | 30D price range                                                         |
| 13.2  | Support/resistance           | Same                                         | Key levels detected                                                     |
| 13.3  | Earnings forecast            | Same                                         | Beat/miss probabilities                                                 |
| 13.4  | Goal schema                  | `prisma/schema.prisma`                       | Goals table                                                             |
| 13.5  | Goal CRUD                    | `apps/api-nest/src/goals/`                   | Create/read/update goals                                                |
| 13.6  | SIP calculator               | Same                                         | Required SIP for goal                                                   |
| 13.7  | Sector performance           | `apps/ai-fastapi/app/services/`              | Sector returns                                                          |
| 13.8  | Sector heatmap               | Same                                         | Color-coded data                                                        |
| 13.9  | Dividend stocks              | Same                                         | Top dividend stocks                                                     |
| 13.10 | FII/DII data                 | Same                                         | Institutional data                                                      |
| 13.11 | Forecast UI                  | `apps/web-angular/src/app/features/`         | Forecast page                                                           |
| 13.12 | Goals UI                     | Same                                         | Goal planner page                                                       |
| 13.13 | **Agent Registry**           | `apps/ai-fastapi/app/agents/registry.py`     | 37 named agents registered with personality + strategy                  |
| 13.14 | **Agent Engine (LangGraph)** | `apps/ai-fastapi/app/agents/engine.py`       | Agent state machine: analyze → decide → recommend → explain             |
| 13.15 | **Value Investor Agents**    | `apps/ai-fastapi/app/agents/investors/`      | Buffett, Graham, Munger, Lynch, Klarman, Marks, Fisher, Neff, Templeton |
| 13.16 | **Growth/Trader Agents**     | `apps/ai-fastapi/app/agents/traders/`        | O'Neil (CANSLIM), Livermore, Simons, Thorp                              |
| 13.17 | **Economic Agents**          | `apps/ai-fastapi/app/agents/economics/`      | Macro, interest rate, inflation, currency agents                        |
| 13.18 | **Sector Specialist Agents** | `apps/ai-fastapi/app/agents/sectors/`        | IT, Pharma, Banking, Auto, FMCG, Energy, Metal, Realty                  |
| 13.19 | **Multi-Agent Consensus**    | `apps/ai-fastapi/app/agents/`                | All agents vote on a stock → consensus score + dispersion               |
| 13.20 | **Agent Explain UI**         | `apps/web-angular/src/app/features/ai-chat/` | Compare agents side-by-side with reasoning trace                        |
| 13.21 | **Bull vs Bear Debate**      | `apps/ai-fastapi/app/agents/`                | Two agents debate a stock, user picks winner                            |
| 13.22 | Unit tests                   | `*.spec.ts`                                  | All services + agents tested                                            |

### Prisma Schema

```prisma
model Goal {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  name          String
  targetAmount  Decimal  @map("target_amount")
  currentAmount Decimal  @default(0) @map("current_amount")
  deadline      DateTime
  type          String   // retirement, education, house, emergency
  sipAmount     Decimal? @map("sip_amount")
  riskTolerance String   @default("moderate") @map("risk_tolerance")
  status        String   @default("active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("goals")
}
```

### Definition of Done

- [ ] Price forecasts work
- [ ] Support/resistance levels work
- [ ] Goals CRUD works
- [ ] SIP calculator works
- [ ] Sector heatmap works
- [ ] FII/DII data available
- [ ] Forecast + Goals UI works
- [ ] 37 named AI agents registered in agent registry
- [ ] Agent engine (analyze → decide → recommend → explain) works
- [ ] Value investor agents (Buffett, Graham, Lynch, Munger, etc.) give distinct opinions
- [ ] Multi-agent consensus shows agreement/dispersion
- [ ] Bull vs Bear debate works
- [ ] Agent explain UI shows reasoning traces
- [ ] All tests pass

---

## Sprint 11 — Research Platform

**Goal:** Annual report analysis, vector search, research reports, technical patterns.

### Tasks

| #     | Task                      | Files                                     | Done When                   |
| ----- | ------------------------- | ----------------------------------------- | --------------------------- |
| 11.1  | PDF ingestion             | `apps/ai-fastapi/app/services/`           | PDF → text extraction       |
| 11.2  | Annual report analysis    | Same                                      | AI extracts insights        |
| 11.3  | Vector embeddings         | Same                                      | Text → pgvector             |
| 11.4  | Semantic search           | Same                                      | Vector search works         |
| 11.5  | RAG pipeline              | Same                                      | Question → context → answer |
| 11.6  | Research report generator | Same                                      | 5-page PDF report           |
| 11.7  | Technical indicators      | `apps/ai-fastapi/app/utils/indicators.py` | RSI, MACD, MA               |
| 11.8  | Pattern detection         | Same                                      | Chart patterns              |
| 11.9  | Technical summary         | Same                                      | AI explains technicals      |
| 11.10 | Research UI               | `apps/web-angular/src/app/features/`      | Research page               |
| 11.11 | Unit tests                | `*.spec.ts`                               | All services tested         |

### pgvector Schema

```sql
-- PostgreSQL extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(50) NOT NULL,  -- annual_report, news, chat
  source_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),             -- OpenAI embedding dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector search index
CREATE INDEX idx_embeddings_vector ON embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Definition of Done

- [ ] PDF ingestion works
- [ ] Annual report analysis works
- [ ] Vector search works
- [ ] RAG pipeline works
- [ ] Research report generation works
- [ ] Technical indicators calculated
- [ ] Pattern detection works
- [ ] All tests pass

---

## Sprint 12 — Broker Integrations & Data Connectors

**Goal:** Connect to Indian brokers for real-time portfolio sync. 100+ data connectors for alternative data.

### Tasks

| #     | Task                                | Files                                             | Done When                                                                                       |
| ----- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 12.1  | **Broker interface**                | `apps/api-nest/src/brokers/broker.interface.ts`   | Abstract broker adapter contract                                                                |
| 12.2  | **Broker registry**                 | `apps/api-nest/src/brokers/registry.ts`           | Discover and register brokers                                                                   |
| 12.3  | **Zerodha integration**             | `apps/api-nest/src/brokers/zerodha/`              | OAuth + portfolio sync                                                                          |
| 12.4  | **Angel One integration**           | `apps/api-nest/src/brokers/angel/`                | OAuth + portfolio sync                                                                          |
| 12.5  | **Upstox integration**              | `apps/api-nest/src/brokers/upstox/`               | OAuth + portfolio sync                                                                          |
| 12.6  | **Groww + Dhan + Fyers**            | `apps/api-nest/src/brokers/`                      | OAuth + portfolio sync                                                                          |
| 12.7  | **Kotak + IIFL + Motilal**          | `apps/api-nest/src/brokers/`                      | OAuth + portfolio sync                                                                          |
| 12.8  | **Unified portfolio**               | `apps/api-nest/src/portfolio/`                    | Merge holdings from multiple brokers                                                            |
| 12.9  | **Broker OAuth UI**                 | `apps/web-angular/src/app/features/settings/`     | Connect/disconnect brokers                                                                      |
| 12.10 | **Standardized provider interface** | `apps/ai-fastapi/app/providers/base.py`           | Abstract base class for all data providers (inspired by OpenBB ODP architecture)                |
| 12.11 | **yfinance connector**              | `apps/ai-fastapi/app/providers/yfinance/`         | Yahoo Finance — equity prices, fundamentals, options ✅ (dep already installed)                 |
| 12.12 | **NSE/BSE direct connector**        | `apps/ai-fastapi/app/providers/nse/`              | NSE India + BSE India — live prices, indices, FII/DII data                                      |
| 12.13 | **FRED connector**                  | `apps/ai-fastapi/app/providers/fred/`             | Federal Reserve Economic Data — interest rates, GDP, inflation, employment                      |
| 12.14 | **IMF connector**                   | `apps/ai-fastapi/app/providers/imf/`              | IMF data — global economic indicators, exchange rates, fiscal data                              |
| 12.15 | **OECD connector**                  | `apps/ai-fastapi/app/providers/oecd/`             | OECD data — economic outlooks, employment, productivity                                         |
| 12.16 | **World Bank connector**            | `apps/ai-fastapi/app/providers/worldbank/`        | World Bank — development indicators, global poverty, education                                  |
| 12.17 | **SEC/EDGAR connector**             | `apps/ai-fastapi/app/providers/sec/`              | US SEC filings — 10-K, 10-Q, insider trades (cross-reference for Indian companies listed in US) |
| 12.18 | **CBOE connector**                  | `apps/ai-fastapi/app/providers/cboe/`             | Options data, VIX, market volatility indices                                                    |
| 12.19 | **Fama-French connector**           | `apps/ai-fastapi/app/providers/famafrench/`       | Factor models — market, size, value, momentum, profitability                                    |
| 12.20 | **TradingEconomics connector**      | `apps/ai-fastapi/app/providers/tradingeconomics/` | Global macro data — 196 countries, 300k+ indicators                                             |
| 12.21 | **EconDB connector**                | `apps/ai-fastapi/app/providers/econdb/`           | Country-level economic time series                                                              |
| 12.22 | **BLS connector**                   | `apps/ai-fastapi/app/providers/bls/`              | US Bureau of Labor Statistics — inflation, unemployment, wages                                  |
| 12.23 | **SEC EDGAR insider trades**        | `apps/ai-fastapi/app/providers/sec/`              | Insider transaction filings                                                                     |
| 12.24 | **MoneyControl scraper**            | `apps/ai-fastapi/app/providers/moneycontrol/`     | Indian market news, fundamentals, quarterly results                                             |
| 12.25 | **SEBI filings connector**          | `apps/ai-fastapi/app/providers/sebi/`             | SEBI filings — insider trades, pledge changes, bulk deals                                       |
| 12.26 | **RBI connector**                   | `apps/ai-fastapi/app/providers/rbi/`              | RBI data — repo rate, reverse repo, FX reserves, WPI, CPI                                       |
| 12.27 | **Finviz connector**                | `apps/ai-fastapi/app/providers/finviz/`           | Stock screener data, insider trading, performance metrics                                       |
| 12.28 | **Polygon connector**               | `apps/ai-fastapi/app/providers/polygon/`          | Real-time and historical US market data (for Indian ADR/GDR cross-reference)                    |
| 12.29 | **Broker dashboard UI**             | `apps/web-angular/src/app/features/portfolio/`    | Broker-connected portfolio view                                                                 |
| 12.30 | **Data connector health dashboard** | `apps/web-angular/src/app/features/admin/`        | Monitor all 25+ connectors: status, latency, last fetch, error rate                             |
| 12.31 | Unit tests                          | `*.spec.ts`                                       | All broker + data services tested                                                               |

## Sprint 13 — Screener, Alerts & Visual Workflows

**Goal:** Stock screener, price alerts, notification engine, node-based workflow editor.

### Tasks

| #     | Task                             | Files                                              | Done When                                                  |
| ----- | -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 13.1  | **Stock screener engine**        | `apps/ai-fastapi/app/services/screener_service.py` | Filter stocks by PE, PB, ROE, sector, etc.                 |
| 13.2  | **Screener API**                 | `apps/ai-fastapi/app/api/v1/endpoints/screener.py` | GET /api/screener?pe_lt=20&roe_gt=15                       |
| 13.3  | **Saved screens**                | `apps/api-nest/src/screener/`                      | Save/load custom screen configurations                     |
| 13.4  | **Screener UI**                  | `apps/web-angular/src/app/features/stocks/`        | Filter builder + results table                             |
| 13.5  | **Price alert engine**           | `apps/api-nest/src/alerts/alert.service.ts`        | Trigger when price crosses threshold                       |
| 13.6  | **Alert schema (Prisma)**        | `prisma/schema.prisma`                             | Alert model with conditions                                |
| 13.7  | **Alert checker cron**           | `apps/api-nest/src/scheduler/`                     | Every 5 min check + fire                                   |
| 13.8  | **Notification dispatch**        | `apps/api-nest/src/notifications/`                 | Email + push + Telegram                                    |
| 13.9  | **Alert UI**                     | `apps/web-angular/src/app/features/`               | Create/manage alerts                                       |
| 13.10 | **Node-based workflow (visual)** | `apps/web-angular/src/app/features/workflow/`      | Drag-and-drop workflow builder akin to Fincept Node Editor |
| 13.11 | **Workflow engine**              | `apps/ai-fastapi/app/workflow/`                    | DAG executor for scheduled automation pipelines            |
| 13.12 | **Pre-built workflow templates** | Same                                               | "Alert me when RSI < 30", "Daily sector summary"           |
| 13.13 | Unit tests                       | `*.spec.ts`                                        | All screener + alert + workflow services tested            |

### Prisma Schema

```prisma
model Alert {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  name           String
  type           String   // price, volume, technical, news
  stockSymbol    String   @map("stock_symbol")
  condition      String   // above, below, crosses, crosses_above, crosses_below
  threshold      Decimal
  notificationType String @default("email") @map("notification_type")
  isActive       Boolean  @default(true) @map("is_active")
  lastTriggered  DateTime? @map("last_triggered")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@map("alerts")
}

model SavedScreen {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  name       String
  filters    Json     // { pe_lt: 20, roe_gt: 15, sector: "IT" }
  sortBy     String   @default("ai_score")
  sortOrder  String   @default("desc")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("saved_screens")
}
```

### API Endpoints

```
GET    /api/screener                     → Filter stocks (query params)
POST   /api/screener/screens             → Save screen config
GET    /api/screener/screens             → List saved screens
DELETE /api/screener/screens/:id         → Delete saved screen
POST   /api/alerts                       → Create alert
GET    /api/alerts                       → List alerts
PATCH  /api/alerts/:id/toggle            → Enable/disable
DELETE /api/alerts/:id                   → Delete alert
```

### Definition of Done

- [ ] Screener filters by PE, PB, ROE, sector, market cap, dividend yield
- [ ] Saved screens persist
- [ ] Price alerts fire correctly
- [ ] Notifications sent via email + Telegram
- [ ] Node-based workflow builder renders
- [ ] Workflow engine executes DAG pipelines
- [ ] All tests pass

---

## Sprint 14 — Charting Engine & Data Visualization

**Goal:** Interactive charts, dashboards, and visual analytics inspired by OpenBB Workspace.

### Tasks

| #     | Task                             | Files                                                 | Done When                                                                                                                              |
| ----- | -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 14.1  | **Charting framework**           | `apps/web-angular/src/app/shared/charts/`             | Angular chart component library (Chart.js + ng2-charts)                                                                                |
| 14.2  | **Candlestick chart**            | `apps/web-angular/src/app/shared/charts/candlestick/` | Interactive OHLC chart with zoom, range slider, timeframes                                                                             |
| 14.3  | **Line/area chart**              | Same                                                  | Price history, indicator overlays                                                                                                      |
| 14.4  | **Bar chart**                    | Same                                                  | Volume, sector comparison, portfolio allocation                                                                                        |
| 14.5  | **Pie/donut chart**              | Same                                                  | Portfolio composition, asset allocation                                                                                                |
| 14.6  | **Heatmap**                      | Same                                                  | Sector performance, correlation matrix, risk grid                                                                                      |
| 14.7  | **Scatter/bubble chart**         | Same                                                  | Risk vs return, PE vs growth                                                                                                           |
| 14.8  | **Dashboard builder**            | `apps/web-angular/src/app/features/dashboard/`        | Drag-and-drop widget layout (inspired by OpenBB Workspace)                                                                             |
| 14.9  | **Widget library**               | `apps/web-angular/src/app/shared/widgets/`            | 15+ widgets: price chart, portfolio summary, top movers, sector heatmap, news feed, AI score, risk metrics, watchlist, screener widget |
| 14.10 | **Market overview dashboard**    | `apps/web-angular/src/app/features/dashboard/`        | Pre-built market overview with indices, sector heatmap, top gainers/losers                                                             |
| 14.11 | **Portfolio dashboard**          | Same                                                  | P&L chart, allocation pie, risk gauge, performance vs benchmark                                                                        |
| 14.12 | **Full-screen chart mode**       | `apps/web-angular/src/app/shared/charts/`             | Maximize any chart to full screen with advanced tools                                                                                  |
| 14.13 | **Chart export**                 | Same                                                  | Export as PNG, CSV, PDF                                                                                                                |
| 14.14 | **Technical indicator overlays** | Same                                                  | SMA, EMA, Bollinger Bands, RSI, MACD on price charts                                                                                   |
| 14.15 | **Dark/light chart themes**      | Same                                                  | Auto-match app theme                                                                                                                   |
| 14.16 | **Chart API**                    | `apps/ai-fastapi/app/charting/`                       | Server-side chart data formatting with standardized response                                                                           |
| 14.17 | Unit tests                       | `*.spec.ts`                                           | All charting components tested                                                                                                         |

### Definition of Done

- [ ] Candlestick chart renders with interactive zoom and timeframe switching
- [ ] 5 chart types work (candlestick, line, bar, pie, heatmap)
- [ ] Technical indicator overlays work (SMA, EMA, Bollinger, RSI, MACD)
- [ ] Dashboard builder allows drag-and-drop widget layout
- [ ] 15+ widgets available
- [ ] Market overview dashboard pre-built
- [ ] Portfolio dashboard pre-built
- [ ] Chart export works (PNG, CSV)
- [ ] Full-screen mode works
- [ ] All charts support dark/light theme
- [ ] All tests pass

---

## Sprint 15 — Data Provider Standardization & API Gateway

**Goal:** Standardized provider interface for all data connectors. Unified REST API gateway that exposes one endpoint → multiple backends. Inspired by OpenBB ODP "connect once, consume everywhere" architecture.

### Tasks

| #     | Task                            | Files                                                | Done When                                                                                       |
| ----- | ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 15.1  | **Provider base class**         | `apps/ai-fastapi/app/providers/base.py`              | Abstract `BaseProvider` with `fetch()`, `transform()`, `health()` contract                      |
| 15.2  | **Provider registry**           | `apps/ai-fastapi/app/providers/registry.py`          | Auto-discover, register, and route to 25+ providers                                             |
| 15.3  | **Standardized data model**     | `apps/ai-fastapi/app/core/models.py`                 | Pydantic `Data` class — flexible, dynamic, provider-agnostic                                    |
| 15.4  | **QueryParams standardization** | `apps/ai-fastapi/app/core/params.py`                 | Pydantic `QueryParams` — shared params across all providers (inspired by OpenBB)                |
| 15.5  | **Provider health system**      | `apps/ai-fastapi/app/providers/health.py`            | `/api/providers/health` — per-connector status, latency, error rate                             |
| 15.6  | **API Gateway router**          | `apps/ai-fastapi/app/api/gateway.py`                 | One endpoint definition → generates Python SDK + REST + MCP surface (inspired by OpenBB Router) |
| 15.7  | **Rate limit per provider**     | `apps/ai-fastapi/app/providers/ratelimit.py`         | Per-connector rate limiting (some APIs allow 5 req/min, others 1000/min)                        |
| 15.8  | **Provider fallback chain**     | `apps/ai-fastapi/app/providers/fallback.py`          | If primary provider fails, fallback to secondary (e.g., yfinance → polygon → NSE)               |
| 15.9  | **Provider caching layer**      | `apps/ai-fastapi/app/providers/cache.py`             | Redis-based TTL cache per provider (some data stale after 1min, others 1 day)                   |
| 15.10 | **Unified REST API**            | `apps/ai-fastapi/app/api/v1/endpoints/data.py`       | `GET /api/data/{provider}/{endpoint}` — call any provider via single endpoint                   |
| 15.11 | **Provider API key vault**      | `apps/api-nest/src/brokers/vault.service.ts`         | Encrypted storage for all provider API keys (bypasses .env for prod)                            |
| 15.12 | **Provider admin UI**           | `apps/web-angular/src/app/features/admin/providers/` | Dashboard: enable/disable providers, view health, manage keys                                   |
| 15.13 | **Rate limit / usage UI**       | Same                                                 | Per-provider rate limit stats, remaining quota, reset time                                      |
| 15.14 | **Unit + integration tests**    | `*.spec.ts` + `*.pytest.py`                          | All provider interfaces tested with mock responses                                              |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     QUANTORA DATA PROVIDER LAYER                     │
└──────────────────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Registry    │
                    │  auto-       │
                    │  discover    │
                    └──────┬──────┘
                           │
     ┌─────────────────────┼──────────────────────────────┐
     │                     │                              │
┌────▼────┐         ┌──────▼──────┐              ┌───────▼───────┐
│ Provider│         │  Provider   │              │   Provider    │
│ Base    │◄────────│  Registry   │─────────────►│   Fallback    │
│ Class   │         │  Map        │              │   Chain       │
└────┬────┘         └─────────────┘              └───────────────┘
     │
     ├── yfinance  ───  Equity prices, fundamentals
     ├── nse       ───  NSE India live + FII/DII
     ├── fred      ───  Interest rates, GDP, inflation
     ├── imf       ───  Global economic indicators
     ├── oecd      ───  Economic outlooks
     ├── worldbank ───  Development indicators
     ├── tradingecon ── Global macro (196 countries)
     ├── econdb    ───  Country-level time series
     ├── bls       ───  Employment, inflation
     ├── cbod      ───  Options, VIX
     ├── sec       ───  US SEC filings
     ├── sebi      ───  SEBI filings
     ├── moneycontrol ─ Indian news + fundamentals
     ├── finviz    ───  Screener + insider trades
     ├── polygon   ───  US real-time data
     └── famafrench ──  Factor models
```

### Prisma Schema

```prisma
model ProviderConfig {
  id          String   @id @default(uuid())
  name        String   @unique          // yfinance, nse, fred, etc.
  displayName String   @map("display_name")
  isEnabled   Boolean  @default(true) @map("is_enabled")
  apiKey      String?  @map("api_key")  // encrypted
  rateLimit   Int      @default(60)     // requests per minute
  ttlSeconds  Int      @default(300) @map("ttl_seconds")  // cache TTL
  priority    Int      @default(0)      // for fallback ordering
  lastHealth  String?  @map("last_health")  // ok, degraded, down
  lastChecked DateTime? @map("last_checked")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("provider_configs")
}

model ProviderHealthLog {
  id         String   @id @default(uuid())
  providerId String   @map("provider_id")
  status     String   // ok, degraded, down
  latency    Int      // milliseconds
  errorMsg   String?  @map("error_msg")
  checkedAt  DateTime @default(now()) @map("checked_at")

  @@index([providerId, checkedAt(sort: Desc)])
  @@map("provider_health_logs")
}
```

### Definition of Done

- [ ] Base provider interface defined with fetch/transform/health contract
- [ ] Provider registry auto-discovers 25+ providers
- [ ] Standardized Data + QueryParams Pydantic models
- [ ] Provider health system returns per-connector status
- [ ] API Gateway generates Python + REST + MCP surface from one definition
- [ ] Provider fallback chain works (primary → secondary → NSE)
- [ ] Redis caching per provider with configurable TTL
- [ ] Encrypted API key vault
- [ ] Provider admin UI (enable/disable, health, keys)
- [ ] All 30 tasks from Sprint 12 migrate to standardized provider interface
- [ ] All tests pass

**Goal:** Learning modules, community posts, portfolio sharing.

### Tasks

| #     | Task              | Files                                | Done When                  |
| ----- | ----------------- | ------------------------------------ | -------------------------- |
| 14.1  | Lesson schema     | `prisma/schema.prisma`               | Lessons table              |
| 14.2  | Lesson CRUD       | `apps/api-nest/src/learning/`        | Create/read lessons        |
| 14.3  | Quiz system       | Same                                 | Take quizzes, track scores |
| 14.4  | Progress tracking | Same                                 | Courses + streaks          |
| 14.5  | Post schema       | `prisma/schema.prisma`               | Posts table                |
| 14.6  | Post CRUD         | `apps/api-nest/src/community/`       | Create/read posts          |
| 14.7  | Comments + likes  | Same                                 | Engage with posts          |
| 14.8  | Model portfolios  | Same                                 | Share + follow portfolios  |
| 14.9  | Learning UI       | `apps/web-angular/src/app/features/` | Learning page              |
| 14.10 | Community UI      | Same                                 | Community page             |
| 14.11 | Unit tests        | `*.spec.ts`                          | All services tested        |

### Prisma Schema

```prisma
model Lesson {
  id          String   @id @default(uuid())
  title       String
  content     String
  category    String
  order       Int
  duration    Int      // minutes
  createdAt   DateTime @default(now()) @map("created_at")

  quizzes     Quiz[]
  progress    LessonProgress[]

  @@map("lessons")
}

model Quiz {
  id         String   @id @default(uuid())
  lessonId   String   @map("lesson_id")
  lesson     Lesson   @relation(fields: [lessonId], references: [id])
  question   String
  options    Json     // ["A", "B", "C", "D"]
  answer     Int      // correct option index
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("quizzes")
}

model LessonProgress {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  lessonId  String   @map("lesson_id")
  completed Boolean  @default(false)
  score     Int?
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, lessonId])
  @@map("lesson_progress")
}

model Post {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  title     String
  content   String
  tags      String[]
  likes     Int       @default(0)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  comments  Comment[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  post      Post     @relation(fields: [postId], references: [id])
  userId    String   @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("comments")
}
```

### Definition of Done

- [ ] Lessons CRUD works
- [ ] Quiz system works
- [ ] Progress tracking works
- [ ] Community posts work
- [ ] Comments + likes work
- [ ] Model portfolios work
- [ ] Learning + Community UI works
- [ ] All tests pass

---

## Sprint 16 — Community & Learning

**Goal:** Learning modules, community posts, portfolio sharing.

### Tasks

| #     | Task              | Files                                | Done When                  |
| ----- | ----------------- | ------------------------------------ | -------------------------- |
| 16.1  | Lesson schema     | `prisma/schema.prisma`               | Lessons table              |
| 16.2  | Lesson CRUD       | `apps/api-nest/src/learning/`        | Create/read lessons        |
| 16.3  | Quiz system       | Same                                 | Take quizzes, track scores |
| 16.4  | Progress tracking | Same                                 | Courses + streaks          |
| 16.5  | Post schema       | `prisma/schema.prisma`               | Posts table                |
| 16.6  | Post CRUD         | `apps/api-nest/src/community/`       | Create/read posts          |
| 16.7  | Comments + likes  | Same                                 | Engage with posts          |
| 16.8  | Model portfolios  | Same                                 | Share + follow portfolios  |
| 16.9  | Learning UI       | `apps/web-angular/src/app/features/` | Learning page              |
| 16.10 | Community UI      | Same                                 | Community page             |
| 16.11 | Unit tests        | `*.spec.ts`                          | All services tested        |

### Prisma Schema

```prisma
model Lesson {
  id          String   @id @default(uuid())
  title       String
  content     String
  category    String
  order       Int
  duration    Int      // minutes
  createdAt   DateTime @default(now()) @map("created_at")

  quizzes     Quiz[]
  progress    LessonProgress[]

  @@map("lessons")
}

model Quiz {
  id         String   @id @default(uuid())
  lessonId   String   @map("lesson_id")
  lesson     Lesson   @relation(fields: [lessonId], references: [id])
  question   String
  options    Json     // ["A", "B", "C", "D"]
  answer     Int      // correct option index
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("quizzes")
}

model LessonProgress {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  lessonId  String   @map("lesson_id")
  completed Boolean  @default(false)
  score     Int?
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, lessonId])
  @@map("lesson_progress")
}

model Post {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  title     String
  content   String
  tags      String[]
  likes     Int       @default(0)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  comments  Comment[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  post      Post     @relation(fields: [postId], references: [id])
  userId    String   @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("comments")
}
```

### Definition of Done

- [ ] Lessons CRUD works
- [ ] Quiz system works
- [ ] Progress tracking works
- [ ] Community posts work
- [ ] Comments + likes work
- [ ] Model portfolios work
- [ ] Learning + Community UI works
- [ ] All tests pass

---

## Sprint 17 — Production Readiness

**Goal:** Notifications, admin, monitoring, compliance, deployment.

### Tasks

| #     | Task               | Files                              | Done When                   |
| ----- | ------------------ | ---------------------------------- | --------------------------- |
| 17.1  | Email service      | `apps/api-nest/src/notifications/` | SendGrid/SMTP works         |
| 17.2  | Telegram bot       | Same                               | Bot sends alerts            |
| 17.3  | Price alerts       | Same                               | User sets target → notified |
| 17.4  | Daily summary      | Same                               | Auto-send at 4 PM           |
| 17.5  | Admin module       | `apps/api-nest/src/admin/`         | User management             |
| 17.6  | Subscription mgmt  | Same                               | Free/pro plans              |
| 17.7  | System health      | Same                               | API latency, error rates    |
| 17.8  | Disclaimers        | `apps/api-nest/src/common/`        | All AI responses            |
| 17.9  | Audit logs         | Same                               | Every action logged         |
| 17.10 | Monitoring         | `infrastructure/monitoring/`       | Prometheus + Grafana        |
| 17.11 | Performance tuning | Various                            | Query optimization          |
| 17.12 | Security hardening | Various                            | OWASP checklist             |
| 17.13 | Production deploy  | `infrastructure/docker/`           | Docker Compose prod         |
| 17.14 | Load testing       | k6 scripts                         | 1000 concurrent users       |
| 17.15 | Documentation      | `docs/`                            | Complete API docs           |

### Definition of Done

- [ ] Email alerts work
- [ ] Telegram bot works
- [ ] Price alerts work
- [ ] Admin dashboard works
- [ ] Subscriptions managed
- [ ] Monitoring active
- [ ] Security hardened
- [ ] Production deploy works
- [ ] Load test passes (1000 users)
- [ ] Documentation complete

---

## Sprint Summary

| Sprint | Focus                                       | Duration | Key Deliverable                                 |
| ------ | ------------------------------------------- | -------- | ----------------------------------------------- |
| **1**  | Engineering Foundation                      | 2 weeks  | Monorepo, Docker, CI/CD                         |
| **2**  | Identity & Security                         | 2 weeks  | Auth, JWT, RBAC, Email Verify, Audit, Top Nav   |
| **3**  | Social Login & Security                     | 2 weeks  | Google OIDC, Account Lockout, Login History     |
| **4**  | Market Data Platform                        | 2 weeks  | Live prices, Kafka, Cache                       |
| **5**  | Portfolio Platform                          | 2 weeks  | Holdings, P&L, Watchlist                        |
| **6**  | Analytics Engine                            | 2 weeks  | AI scores, LLM explain                          |
| **7**  | Risk Engine                                 | 2 weeks  | VaR, Sharpe, Heatmap                            |
| **8**  | AI + 2FA + Sessions + MCP Tools             | 2 weeks  | LLM, Chat, RAG, 2FA, MCP Server, Router         |
| **9**  | News Intelligence                           | 2 weeks  | News, Sentiment, Summary                        |
| **10** | Forecast, Goals & AI Agents                 | 2 weeks  | Forecast, Goals, 37 Named Agents                |
| **11** | Research Platform                           | 2 weeks  | PDF, Vector, Reports, Technical Patterns        |
| **12** | Broker Integrations & Data Connectors       | 3 weeks  | 10 Indian Brokers, 30+ Data Connectors          |
| **13** | Screener, Alerts & Visual Workflows         | 2 weeks  | Stock Screener, Alerts, Node Editor             |
| **14** | Charting Engine & Data Visualization        | 2 weeks  | Charts, Dashboards, Widgets, 5 Chart Types      |
| **15** | Data Provider Standardization & API Gateway | 2 weeks  | Provider Interface, Unified API, Fallback Chain |
| **16** | Community & Learning                        | 2 weeks  | Lessons, Posts, Sharing                         |
| **17** | Production Readiness                        | 2 weeks  | Deploy, Monitor, Secure                         |

---

## Global Definition of Done

- [ ] All tasks in sprint completed
- [ ] Prisma migrations run successfully
- [ ] `npm run build` passes (all apps)
- [ ] `npm run lint` passes
- [ ] Unit tests pass (coverage > 80%)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Swagger docs updated
- [ ] Docker builds successfully
- [ ] CI pipeline green
- [ ] Code reviewed and merged
- [ ] Sprint demo completed
- [ ] Documentation updated

---

_17 sprints. 8.5 months. Production-ready platform._
ady platform.*
m.*
