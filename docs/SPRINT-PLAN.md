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

| # | Task | What You Build | Done When |
|---|------|---------------|-----------|
| 1.1 | Monorepo setup | Root `package.json`, Turborepo, workspaces | `npm install` works at root |
| 1.2 | Docker Compose | PostgreSQL 16, Redis 7, MinIO | `docker compose up -d` all healthy |
| 1.3 | NestJS app skeleton | `apps/api-nest` with health check | `GET /health` returns OK |
| 1.4 | Prisma setup | `prisma/schema.prisma`, connection | `npx prisma db push` succeeds |
| 1.5 | FastAPI skeleton | `apps/ai-fastapi` with health check | `GET /health` returns OK |
| 1.6 | Angular skeleton | `apps/web-angular` with Material | `ng serve` shows app |
| 1.7 | Nginx reverse proxy | Route `/api` → NestJS, `/ai` → FastAPI | All routes work via Nginx |
| 1.8 | Swagger setup | NestJS Swagger docs | `GET /api/docs` shows Swagger UI |
| 1.9 | Logging | Winston/Pino for NestJS | Structured JSON logs |
| 1.10 | Health checks | `/health` for all services | Docker health checks pass |
| 1.11 | Seed infrastructure | Seed command for all DBs | `npm run seed` works |
| 1.12 | CI pipeline | GitHub Actions: lint, build, test | PR triggers CI |
| 1.13 | Prettier + ESLint | Config at root, shared rules | `npm run lint` passes |
| 1.14 | Husky + Commitlint | Pre-commit hooks | Bad commits rejected |

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

---

## Sprint 2 — Identity & Security

**Goal:** User registers, logs in, gets JWT. RBAC works. Audit trail active.

### Architecture

```
Frontend → NestJS API → PostgreSQL
   │
   ├─ POST /auth/register → bcrypt hash → save user → return JWT
   ├─ POST /auth/login → verify password → return JWT + refresh
   ├─ POST /auth/refresh → validate refresh → new JWT
   ├─ GET /auth/me → JWT guard → return user
   └─ POST /auth/logout → invalidate refresh token
```

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 2.1 | User schema + migration | `prisma/schema.prisma` | `npx prisma migrate dev` creates users table |
| 2.2 | Auth module | `apps/api-nest/src/auth/` | Register + Login endpoints |
| 2.3 | JWT strategy | `apps/api-nest/src/auth/strategies/` | JWT validation works |
| 2.4 | Refresh tokens | `apps/api-nest/src/auth/` | Token refresh works |
| 2.5 | RBAC guard | `apps/api-nest/src/common/guards/` | Role-based access |
| 2.6 | Password reset | `apps/api-nest/src/auth/` | Email-based reset flow |
| 2.7 | Audit logging | `apps/api-nest/src/common/interceptors/` | Every API call logged |
| 2.8 | Rate limiting | `apps/api-nest/src/common/guards/` | 60 req/min per IP |
| 2.9 | Auth UI | `apps/web-angular/src/app/features/auth/` | Login/Register pages |
| 2.10 | Unit tests | `*.spec.ts` | All auth functions tested |
| 2.11 | E2E tests | `apps/api-nest/test/auth.e2e-spec.ts` | Full auth flow tested |
| 2.12 | API docs | Swagger | Auth endpoints documented |

### Prisma Schema

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  phone         String?
  role          String    @default("user")  // user, pro, admin
  language      String    @default("en")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]
  auditLogs     AuditLog[]

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
```

### API Endpoints

```
POST /api/auth/register    → { user, accessToken, refreshToken }
POST /api/auth/login       → { accessToken, refreshToken }
POST /api/auth/refresh     → { accessToken }
POST /api/auth/logout      → { success }
GET  /api/auth/me          → { user }
POST /api/auth/forgot-password → { success }
POST /api/auth/reset-password  → { success }
```

### Definition of Done

- [ ] Register → Login → Get profile works
- [ ] JWT expires and refresh works
- [ ] RBAC blocks unauthorized access
- [ ] Audit logs recorded
- [ ] Rate limiting active
- [ ] All tests pass
- [ ] Swagger docs updated

---

## Sprint 3 — Market Data Platform

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

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 3.1 | Stock schema + migration | `prisma/schema.prisma` | Stocks table created |
| 3.2 | Stock master data | `apps/api-nest/src/market-data/` | CRUD for stocks |
| 3.3 | Data fetcher service | `apps/ai-fastapi/app/services/` | yfinance fetches live price |
| 3.4 | Kafka producer | `apps/api-nest/src/kafka/` | Price updates published |
| 3.5 | Kafka consumer | `apps/api-nest/src/kafka/` | Price updates consumed |
| 3.6 | Redis cache layer | `apps/api-nest/src/cache/` | Prices cached 5 min |
| 3.7 | Historical data | `apps/ai-fastapi/` | 1Y daily OHLCV |
| 3.8 | Fundamentals | `apps/ai-fastapi/` | P/E, P/B, ROE, debt |
| 3.9 | Scheduler | `apps/api-nest/src/scheduler/` | Daily sync at 3:30 PM IST |
| 3.10 | Stock list UI | `apps/web-angular/src/app/features/stocks/` | Stock list page |
| 3.11 | Stock detail UI | Same | Stock detail with chart |
| 3.12 | Unit tests | `*.spec.ts` | All services tested |
| 3.13 | Integration tests | `apps/api-nest/test/` | Kafka flow tested |

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

## Sprint 4 — Portfolio Platform

**Goal:** User creates portfolio, adds holdings, sees live P&L.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 4.1 | Portfolio schema | `prisma/schema.prisma` | Portfolio + Holdings tables |
| 4.2 | Portfolio service | `apps/api-nest/src/portfolio/` | CRUD for portfolios |
| 4.3 | Holding service | Same | Add/remove holdings |
| 4.4 | P&L calculator | Same | Live profit/loss |
| 4.5 | CSV import | Same | Upload portfolio CSV |
| 4.6 | Watchlist | Same | User watchlists |
| 4.7 | Portfolio UI | `apps/web-angular/src/app/features/portfolio/` | Portfolio page |
| 4.8 | Add holding UI | Same | Add holding form |
| 4.9 | Holdings table | Same | Table with live prices |
| 4.10 | Unit tests | `*.spec.ts` | All services tested |

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

## Sprint 5 — Analytics Engine

**Goal:** AI scores every stock. Explanations in plain language.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 5.1 | Score schema | `prisma/schema.prisma` | Scores table |
| 5.2 | Value score | `apps/ai-fastapi/app/services/` | P/E, P/B scoring |
| 5.3 | Quality score | Same | ROE, ROCE, debt scoring |
| 5.4 | Growth score | Same | Revenue/profit CAGR |
| 5.5 | Risk score | Same | Beta, drawdown, pledge |
| 5.6 | Technical score | Same | RSI, MACD, MA |
| 5.7 | Dividend score | Same | Yield, payout, consistency |
| 5.8 | Composite AI score | Same | Weighted average |
| 5.9 | Score explanation | `apps/ai-fastapi/app/services/ai_service.py` | LLM generates explanation |
| 5.10 | Score API | `apps/ai-fastapi/app/api/v1/endpoints/analysis.py` | All score endpoints |
| 5.11 | Backend proxy | `apps/api-nest/src/ai/` | NestJS proxies to AI |
| 5.12 | Batch score | Same | All 50 stocks scored |
| 5.13 | Score UI | `apps/web-angular/src/app/features/stocks/` | Score card component |
| 5.14 | Score history | `prisma/schema.prisma` | Track score changes |
| 5.15 | Unit tests | `*.spec.ts` | All scoring tested |

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

## Sprint 6 — Risk Engine

**Goal:** Portfolio-level risk metrics. VaR, Sharpe, Beta, Heatmap.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 6.1 | Volatility calculator | `apps/ai-fastapi/app/services/risk_service.py` | 30D, 90D, 1Y volatility |
| 6.2 | Beta calculator | Same | Stock beta vs Nifty |
| 6.3 | Sharpe ratio | Same | Risk-adjusted return |
| 6.4 | Sortino ratio | Same | Downside risk-adjusted |
| 6.5 | VaR calculator | Same | 95% and 99% VaR |
| 6.6 | Portfolio risk | Same | Portfolio-level metrics |
| 6.7 | Correlation matrix | Same | Cross-stock correlations |
| 6.8 | Risk heatmap | Same | Color-coded risk levels |
| 6.9 | Risk explanation | `apps/ai-fastapi/app/services/ai_service.py` | LLM explains risk |
| 6.10 | Risk API endpoints | `apps/ai-fastapi/app/api/v1/endpoints/risk.py` | All endpoints |
| 6.11 | Risk UI | `apps/web-angular/src/app/features/portfolio/` | Risk dashboard |
| 6.12 | Heatmap component | Same | Visual heatmap |
| 6.13 | Unit tests | `*.spec.ts` | All risk calculations tested |

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

## Sprint 7 — AI Platform

**Goal:** LLM gateway, chat, memory, RAG foundation.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 7.1 | LLM gateway | `apps/ai-fastapi/app/core/llm.py` | OpenAI/Anthropic abstraction |
| 7.2 | Prompt engine | `apps/ai-fastapi/app/core/prompts.py` | Template management |
| 7.3 | Chat endpoint | `apps/ai-fastapi/app/api/v1/endpoints/chat.py` | Q&A works |
| 7.4 | Stock context | Same | "Buy ITC?" → fetches data |
| 7.5 | Portfolio context | Same | "My portfolio?" → reads holdings |
| 7.6 | Memory store | `apps/ai-fastapi/app/core/memory.py` | Chat history in MongoDB |
| 7.7 | RAG foundation | `apps/ai-fastapi/app/core/rag.py` | Vector search works |
| 7.8 | pgvector setup | `infrastructure/postgres/` | Vector extension enabled |
| 7.9 | Embedding service | `apps/ai-fastapi/app/services/` | Text → embeddings |
| 7.10 | Chat UI | `apps/web-angular/src/app/features/ai-chat/` | Chat interface |
| 7.11 | Chat history UI | Same | Past conversations |
| 7.12 | Unit tests | `*.spec.ts` | All AI services tested |

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

## Sprint 8 — News Intelligence

**Goal:** News collected, summarized, sentiment-scored, mapped to stocks.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 8.1 | News schema | `prisma/schema.prisma` | News table in MongoDB |
| 8.2 | RSS collector | `apps/ai-fastapi/app/services/news_service.py` | ET, LiveMint fetched |
| 8.3 | AI summarizer | Same | 2-3 sentence summary |
| 8.4 | Sentiment analyzer | `apps/ai-fastapi/app/services/sentiment_service.py` | Positive/negative/neutral |
| 8.5 | Stock-news mapper | Same | News linked to stocks |
| 8.6 | Impact scorer | Same | News rated 1-10 |
| 8.7 | Credibility scorer | Same | Fake news detection |
| 8.8 | News API endpoints | `apps/ai-fastapi/app/api/v1/endpoints/news.py` | All endpoints |
| 8.9 | News UI | `apps/web-angular/src/app/features/dashboard/` | News feed component |
| 8.10 | Unit tests | `*.spec.ts` | All news services tested |

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

## Sprint 9 — Forecast & Goals

**Goal:** Price forecasts, goal planning, passive income, sector intelligence.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 9.1 | Price forecaster | `apps/ai-fastapi/app/ml/forecaster.py` | 30D price range |
| 9.2 | Support/resistance | Same | Key levels detected |
| 9.3 | Earnings forecast | Same | Beat/miss probabilities |
| 9.4 | Goal schema | `prisma/schema.prisma` | Goals table |
| 9.5 | Goal CRUD | `apps/api-nest/src/goals/` | Create/read/update goals |
| 9.6 | SIP calculator | Same | Required SIP for goal |
| 9.7 | Sector performance | `apps/ai-fastapi/app/services/` | Sector returns |
| 9.8 | Sector heatmap | Same | Color-coded data |
| 9.9 | Dividend stocks | Same | Top dividend stocks |
| 9.10 | FII/DII data | Same | Institutional data |
| 9.11 | Forecast UI | `apps/web-angular/src/app/features/` | Forecast page |
| 9.12 | Goals UI | Same | Goal planner page |
| 9.13 | Unit tests | `*.spec.ts` | All services tested |

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
- [ ] All tests pass

---

## Sprint 10 — Research Platform

**Goal:** Annual report analysis, vector search, research reports, technical patterns.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 10.1 | PDF ingestion | `apps/ai-fastapi/app/services/` | PDF → text extraction |
| 10.2 | Annual report analysis | Same | AI extracts insights |
| 10.3 | Vector embeddings | Same | Text → pgvector |
| 10.4 | Semantic search | Same | Vector search works |
| 10.5 | RAG pipeline | Same | Question → context → answer |
| 10.6 | Research report generator | Same | 5-page PDF report |
| 10.7 | Technical indicators | `apps/ai-fastapi/app/utils/indicators.py` | RSI, MACD, MA |
| 10.8 | Pattern detection | Same | Chart patterns |
| 10.9 | Technical summary | Same | AI explains technicals |
| 10.10 | Research UI | `apps/web-angular/src/app/features/` | Research page |
| 10.11 | Unit tests | `*.spec.ts` | All services tested |

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

## Sprint 11 — Community & Learning

**Goal:** Learning modules, community posts, portfolio sharing.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 11.1 | Lesson schema | `prisma/schema.prisma` | Lessons table |
| 11.2 | Lesson CRUD | `apps/api-nest/src/learning/` | Create/read lessons |
| 11.3 | Quiz system | Same | Take quizzes, track scores |
| 11.4 | Progress tracking | Same | Courses + streaks |
| 11.5 | Post schema | `prisma/schema.prisma` | Posts table |
| 11.6 | Post CRUD | `apps/api-nest/src/community/` | Create/read posts |
| 11.7 | Comments + likes | Same | Engage with posts |
| 11.8 | Model portfolios | Same | Share + follow portfolios |
| 11.9 | Learning UI | `apps/web-angular/src/app/features/` | Learning page |
| 11.10 | Community UI | Same | Community page |
| 11.11 | Unit tests | `*.spec.ts` | All services tested |

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

## Sprint 12 — Production Readiness

**Goal:** Notifications, admin, monitoring, compliance, deployment.

### Tasks

| # | Task | Files | Done When |
|---|------|-------|-----------|
| 12.1 | Email service | `apps/api-nest/src/notifications/` | SendGrid/SMTP works |
| 12.2 | Telegram bot | Same | Bot sends alerts |
| 12.3 | Price alerts | Same | User sets target → notified |
| 12.4 | Daily summary | Same | Auto-send at 4 PM |
| 12.5 | Admin module | `apps/api-nest/src/admin/` | User management |
| 12.6 | Subscription mgmt | Same | Free/pro plans |
| 12.7 | System health | Same | API latency, error rates |
| 12.8 | Disclaimers | `apps/api-nest/src/common/` | All AI responses |
| 12.9 | Audit logs | Same | Every action logged |
| 12.10 | Monitoring | `infrastructure/monitoring/` | Prometheus + Grafana |
| 12.11 | Performance tuning | Various | Query optimization |
| 12.12 | Security hardening | Various | OWASP checklist |
| 12.13 | Production deploy | `infrastructure/docker/` | Docker Compose prod |
| 12.14 | Load testing | k6 scripts | 1000 concurrent users |
| 12.15 | Documentation | `docs/` | Complete API docs |

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

| Sprint | Focus | Duration | Key Deliverable |
|--------|-------|----------|-----------------|
| **1** | Engineering Foundation | 2 weeks | Monorepo, Docker, CI/CD |
| **2** | Identity & Security | 2 weeks | Auth, JWT, RBAC, Audit |
| **3** | Market Data Platform | 2 weeks | Live prices, Kafka, Cache |
| **4** | Portfolio Platform | 2 weeks | Holdings, P&L, Watchlist |
| **5** | Analytics Engine | 2 weeks | AI scores, LLM explain |
| **6** | Risk Engine | 2 weeks | VaR, Sharpe, Heatmap |
| **7** | AI Platform | 2 weeks | LLM, Chat, RAG, Memory |
| **8** | News Intelligence | 2 weeks | News, Sentiment, Summary |
| **9** | Forecast & Goals | 2 weeks | Forecast, Goals, Sectors |
| **10** | Research Platform | 2 weeks | PDF, Vector, Reports |
| **11** | Community & Learning | 2 weeks | Lessons, Posts, Sharing |
| **12** | Production Readiness | 2 weeks | Deploy, Monitor, Secure |

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

*12 sprints. 6 months. Production-ready platform.*
