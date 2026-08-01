# Quantora — C4 Architecture & Sequence Diagrams

> System decomposition using C4 model + key flow sequence diagrams.
>
> **Current state (0.4.3)**: live stack is Angular (Vercel) → NestJS API (Render, Docker) → Supabase PostgreSQL (Prisma) + optional Redis. **MongoDB Atlas is planned, not provisioned.**

---

## C4 Level 1: System Context

```
┌──────────────────────────────────────────────────────────────┐
│                      Indian Retail Investor                   │
│                    (Mobile / Desktop Browser)                 │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Quantora Platform                           │
│              AI-Powered Investment Intelligence               │
└───────┬──────────────────┬──────────────────┬────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   Supabase   │  │   MongoDB    │  │  External APIs   │
│  PostgreSQL  │  │    Atlas     │  │                  │
│  (Managed)   │  │  (Managed)   │  │ • Angel One     │
│              │  │              │  │ • OpenAI (future) │
│ Users, Port- │  │ Stock data,  │  │ • News APIs      │
│ folios, Goals│  │ AI scores,   │  │ • Market data    │
│ Subscriptions│  │ Chat history │  │                  │
└──────────────┘  └──────────────┘  └──────────────────┘
```

**External Systems:**

| System              | Purpose                                                   | Data                          |
| ------------------- | --------------------------------------------------------- | ----------------------------- |
| Supabase PostgreSQL | Relational data (users, portfolios, goals, subscriptions) | Structured, ACID              |
| MongoDB Atlas       | Document data *(planned)*        | Semi-structured, flexible     |
| Redis               | Caching, rate limiting, session store                     | Key-value, ephemeral          |
| Angel One API        | Indian stock market data (NSE/BSE)                        | Real-time & historical prices |
| OpenAI API          | AI analysis, chat, recommendations (Sprint 5+)            | LLM inference                 |

---

## C4 Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Quantora Platform                             │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Angular 19    │───▶│    NestJS 10     │───▶│   Supabase    │  │
│  │   Frontend      │    │    Backend API   │    │  PostgreSQL   │  │
│  │                 │    │                  │    │               │  │
│  │ • Dashboard     │    │ • REST API       │    │ • Users       │  │
│  │ • Stocks        │    │ • Auth (JWT)     │    │ • Portfolios  │  │
│  │ • Portfolio     │    │ • Validation     │    │ • Goals       │  │
│  │ • AI Chat       │    │ • Swagger        │    │ • Subscriptions│ │
│  │ • Settings      │    │ • Rate Limiting  │    │ • Alerts      │  │
│  │ • Auth (Sprint 2)│   │                  │    │ • Audit Logs  │  │
│  └─────────────────┘    └───────┬──────────┘    └───────────────┘  │
│         ▲                       │                                   │
│         │                       ▼                                   │
│         │              ┌──────────────────┐                         │
│         │              │   FastAPI         │                         │
│         │              │   AI Service      │                         │
│         │              │                   │                         │
│         │              │ • Analysis        │                         │
│         │              │ • Forecasting     │                         │
│         │              │ • Risk Scoring    │                         │
│         │              │ • Sentiment       │                         │
│         │              │ • News Aggregation│                         │
│         │              └────────┬──────────┘                         │
│         │                       │                                   │
│         │              ┌────────▼──────────┐    ┌───────────────┐  │
│         │              │    MongoDB Atlas   │    │     Redis     │  │
│         │              │    (Documents)     │    │   (Cache)     │  │
│         │              │                    │    │               │  │
│         │              │ • Stock metadata   │    │ • API cache   │  │
│         │              │ • AI scores        │    │ • Rate limits │  │
│         │              │ • Chat history     │    │ • Sessions    │  │
│         │              └────────────────────┘    └───────────────┘  │
│         │                                                           │
│         │              ┌──────────────────┐                         │
│         └──────────────│   Vercel CDN     │                         │
│            (static)    │   (Angular dist) │                         │
│                        └──────────────────┘                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Nginx Reverse Proxy                       │  │
│  │  /api/* → NestJS:3000  |  /ai/* → FastAPI:8000              │  │
│  │  Rate limiting: 60r/m (API), 30r/m (AI)                     │  │
│  │  Security headers: CSP, HSTS, X-Frame-Options, etc.         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

| Container        | Technology              | Port       | Purpose                        |
| ---------------- | ----------------------- | ---------- | ------------------------------ |
| Angular Frontend | Angular 19.2 + Material | 4200 (dev) | SPA UI for investors           |
| NestJS API       | NestJS 10 + Prisma 5.22 | 3000 (dev) | REST API, auth, business logic |
| FastAPI AI       | Python FastAPI          | 8000 (dev) | ML/AI inference, data analysis |
| PostgreSQL       | Supabase (managed)      | 5432       | Relational data                |
| MongoDB          | Atlas (managed) *(planned)*    | 27017      | Document data                  |
| Redis            | Docker / managed        | 6379       | Cache, rate limiting           |
| Nginx            | Nginx (Docker)          | 80         | Reverse proxy, static files    |

---

## C4 Level 3: Component — NestJS Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Application                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     AppModule                             │   │
│  │                                                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │  │  AuthModule │  │ StocksModule│  │  PortfolioModule   │ │   │
│  │  │  (Sprint 2) │  │  (Sprint 3) │  │    (Sprint 5)     │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │  │ UsersModule│  │ PaymentsMod│  │    AIModule        │ │   │
│  │  │ (Sprint 2) │  │ (Sprint 6) │  │   (Sprint 5)      │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ HealthModule   │  │      PrismaModule            │   │   │
│  │  │ (Sprint 1 ✅)  │  │      (Sprint 1 ✅)           │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                 Common                           │   │   │
│  │  │  • HttpExceptionFilter   • LoggingInterceptor    │   │   │
│  │  │  • TransformInterceptor  • ValidationPipe        │   │   │
│  │  │  • RolesGuard            • CurrentUser Decorator │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## C4 Level 3: Component — Angular Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                      Angular Application                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    AppModule                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ CoreModule                                         │  │   │
│  │  │ • ThemeService    • AuthService     • StockService │  │   │
│  │  │ • PortfolioService • AIService       • StorageService│ │   │
│  │  │ • NotificationService                             │  │   │
│  │  │ • Guards: AuthGuard, RoleGuard                     │  │   │
│  │  │ • Interceptors: Auth, Error, Loading               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐     │   │
│  │  │  Features        │  │  Shared                   │     │   │
│  │  │  • Dashboard     │  │  • Header, Footer, Sidebar│    │   │
│  │  │  • Stocks        │  │  • LoadingSpinner         │     │   │
│  │  │  • Portfolio     │  │  • RiskBadge, StockCard   │     │   │
│  │  │  • AI Chat       │  │  • Pipes: currency-inr,   │     │   │
│  │  │  • Passive Income│  │    time-ago, truncate     │     │   │
│  │  │  • Settings      │  │  • Validators             │     │   │
│  │  │  • Auth (Sprint 2)│ │  • Directives             │     │   │
│  │  └──────────────────┘  └──────────────────────────┘     │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ SharedModule (Material UI)                       │   │   │
│  │  │ • MatToolbar, MatIcon, MatButton, MatCard        │   │   │
│  │  │ • MatSelect, MatTooltip, MatSidenav              │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## C4 Level 3: Component — FastAPI AI Service

```
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    main.py                                │   │
│  │                    (CORS, Router)                         │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  API v1 Endpoints                                │    │   │
│  │  │  • /analysis  — Stock analysis                   │    │   │
│  │  │  • /chat      — AI chat                          │    │   │
│  │  │  • /forecast  — Price forecasting                │    │   │
│  │  │  • /news      — News aggregation                 │    │   │
│  │  │  • /risk      — Risk assessment                  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Services Layer                                 │    │   │
│  │  │  • StockService    • ForecastService             │    │   │
│  │  │  • NewsService     • RiskService                 │    │   │
│  │  │  • SentimentService • AIService                  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  ML Layer (Sprint 5+)                           │    │   │
│  │  │  • Forecaster (Prophet/LSTM)                     │    │   │
│  │  │  • RiskCalculator (VaR, Sharpe)                  │    │   │
│  │  │  • SentimentAnalyzer (NLP)                       │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sequence Diagrams

### Flow 1: Health Check (Sprint 1 — Implemented)

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│  Browser  │────▶│  Nginx  │────▶│  NestJS  │────▶│  Supabase  │
│           │     │  :80    │     │  :3000   │     │ PostgreSQL │
└──────────┘     └─────────┘     └──────────┘     └────────────┘
     │                │                │                │
     │ GET /api/health│                │                │
     │───────────────▶│                │                │
     │                │ proxy_pass     │                │
     │                │───────────────▶│                │
     │                │                │ SELECT 1       │
     │                │                │───────────────▶│
     │                │                │  OK            │
     │                │                │◀───────────────│
     │                │ 200 OK         │                │
     │                │◀───────────────│                │
     │  200 + JSON    │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ {              │                │                │
     │  "status":"ok" │                │                │
     │  "db":"ok"     │                │                │
     │ }              │                │                │
```

### Flow 2: Auth — Register (Sprint 2)

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│  Browser  │────▶│  Nginx  │────▶│  NestJS  │────▶│  Supabase  │
│  Angular  │     │  :80    │     │  :3000   │     │ PostgreSQL │
└──────────┘     └─────────┘     └──────────┘     └────────────┘
     │                │                │                │
     │ POST /api/auth/register        │                │
     │ {email, password, name}        │                │
     │───────────────▶│                │                │
     │                │ proxy_pass     │                │
     │                │───────────────▶│                │
     │                │                │ Validate DTO   │
     │                │                │ Check duplicate│
     │                │                │───────────────▶│
     │                │                │  No match      │
     │                │                │◀───────────────│
     │                │                │ bcrypt(hash)   │
     │                │                │ INSERT user    │
     │                │                │───────────────▶│
     │                │                │  OK            │
     │                │                │◀───────────────│
     │                │                │ Generate JWT   │
     │                │                │ (15min expiry) │
     │                │ 201 + JWT      │                │
     │                │◀───────────────│                │
     │  201 + token   │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ Store token    │                │                │
     │ in localStorage│                │                │
```

### Flow 3: Stock Data Fetch (Sprint 3)

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐
│  Browser  │────▶│  Nginx  │────▶│  NestJS  │────▶│Angel One │────▶│Redis   │
│  Angular  │     │  :80    │     │  :3000   │     │   API    │     │ Cache  │
└──────────┘     └─────────┘     └──────────┘     └──────────┘     └────────┘
     │                │                │                │              │
     │ GET /api/stocks/RELIANCE        │                │              │
     │───────────────▶│                │                │              │
     │                │ proxy_pass     │                │              │
     │                │───────────────▶│                │              │
     │                │                │ Check Redis    │              │
     │                │                │────────┐       │              │
     │                │                │◀───────┘       │              │
     │                │                │                │              │
     │                │                │ [Cache Miss]   │              │
     │                │                │ GET price data │              │
     │                │                │───────────────▶│              │
     │                │                │  JSON response │              │
     │                │                │◀───────────────│              │
     │                │                │                │              │
     │                │                │ Store in Redis │              │
     │                │                │ (TTL: 60s)     │              │
     │                │                │──────┐         │              │
     │                │                │◀─────┘         │              │
     │                │                │                │              │
     │                │                │ Save to MongoDB│              │
     │                │                │───────────────▶│              │
     │                │ 200 + stock    │                │              │
     │                │◀───────────────│                │              │
     │  200 + data    │                │                │              │
     │◀───────────────│                │                │              │
```

### Flow 4: AI Analysis (Sprint 5)

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│  Browser  │────▶│  Nginx  │────▶│  NestJS  │────▶│ FastAPI  │
│  Angular  │     │  :80    │     │  :3000   │     │  :8000   │
└──────────┘     └─────────┘     └──────────┘     └────┬─────┘
     │                │                │                │
     │ POST /api/ai/analyze {symbol}  │                │
     │───────────────▶│                │                │
     │                │ proxy_pass     │                │
     │                │───────────────▶│                │
     │                │                │ Forward request│
     │                │                │───────────────▶│
     │                │                │                │
      │                │                │  Fetch stock   │
      │                │                │  data (Angel) │
     │                │                │  Calculate     │
     │                │                │  indicators    │
     │                │                │  Run AI model  │
     │                │                │  (future:      │
     │                │                │   OpenAI)      │
     │                │                │                │
     │                │ 200 + analysis │                │
     │                │◀───────────────│                │
     │  200 + result  │                │                │
     │◀───────────────│                │                │
```

---

_Template Version: 1.0_
_Last Updated: 2026-07-27_
