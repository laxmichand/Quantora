# Quantora — System Architecture

> **Document ID:** QSA-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. High-Level Architecture

```
                         ┌─────────────────────┐
                         │   Frontend (Angular) │
                         │   Angular Material   │
                         │   i18n (HI/EN)       │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Backend API NestJS  │
                         │  Auth / RBAC / JWT   │
                         │  Rate Limiting       │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
     │   PostgreSQL    │  │    MongoDB      │  │     Redis       │
     │  (Prisma ORM)   │  │  (Mongoose)     │  │  (ioredis)      │
     │                 │  │                 │  │                 │
     │ • Users         │  │ • Stocks        │  │ • Live Prices   │
     │ • Portfolios    │  │ • News          │  │ • Sessions      │
     │ • Holdings      │  │ • Scores        │  │ • Rate Limits   │
     │ • Goals         │  │ • Chat History  │  │ • Cache         │
     │ • Subscriptions │  │ • Forecasts     │  │ • Feature Flags │
     │ • Alerts        │  │ • Research      │  │                 │
     │ • Watchlists    │  │ • Sector Data   │  │                 │
     │ • Audit Logs    │  │ • Smart Money   │  │                 │
     └─────────────────┘  └─────────────────┘  └─────────────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │      Kafka          │
                         │  Event Streaming    │
                         │  Data Pipeline      │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
     │  External APIs  │  │  AI Service     │  │  Vector DB      │
     │                 │  │  (FastAPI)      │  │  (pgvector)     │
     │ • NSE India     │  │                 │  │                 │
     │ • BSE India     │  │ • Scoring       │  │ • Semantic      │
     │ • Yahoo Finance │  │ • Risk Calc     │  │   Search        │
     │ • RBI Data      │  │ • Forecast      │  │ • RAG           │
     │ • MoneyControl  │  │ • Sentiment     │  │                 │
     └─────────────────┘  │ • Technical     │  └─────────────────┘
                          │ • LangGraph     │
                          │   Agents        │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   LLM Layer     │
                          │                 │
                          │ • LLM Provider    │
                          │ • Claude (or alt) │
                          │ • LangGraph     │
                          │   Orchestrator  │
                          └─────────────────┘
```

---

## 2. Database Strategy

| Database | Purpose | Why This Choice |
|----------|---------|----------------|
| **PostgreSQL** | Users, Portfolios, Holdings, Goals, Subscriptions, Alerts, Watchlists, Audit Logs | ACID compliance, relationships, Prisma ORM |
| **MongoDB Atlas** | Stocks, News, Scores, Chat History, Forecasts, Research, Sector Data, Smart Money | Flexible schemas, high-volume documents, fast reads |
| **Redis** | Live Prices, Sessions, Rate Limits, Cache, Feature Flags | TTL-based caching, pub/sub, real-time |
| **pgvector** | Embeddings for RAG (stock reports, annual reports, news, chat history, learning content) | PostgreSQL extension, no separate DB needed |

### Connection Details

| Service | Connection |
|---------|-----------|
| PostgreSQL | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` |
| MongoDB Atlas | `mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net` |
| Redis | `redis://localhost:6379` |

---

## 3. Kafka Event Streaming

### Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `stock.prices` | Data Fetcher | Score Calculator | Live price updates |
| `stock.scores` | Score Calculator | Notification Service | Score change alerts |
| `news.raw` | News Collector | Sentiment Analyzer | New articles |
| `news.processed` | Sentiment Analyzer | Stock Mapper | Scored articles |
| `portfolio.changes` | Portfolio Service | Risk Calculator | Holdings changed |
| `alerts.triggered` | Alert Service | Notification Service | Send notifications |
| `user.events` | Backend API | Analytics Service | User actions |
| `ai.requests` | Backend API | AI Service | Chat/analysis requests |

### Event Flow

```
NSE API → Kafka(stock.prices) → PostgreSQL(Price Store)
                               → MongoDB(Score Update)
                               → Redis(Cache Update)
                               → Kafka(stock.scores) → Notification Service
```

---

## 4. AI Service Architecture (LangGraph)

```
                    ┌─────────────────────┐
                    │   User Query        │
                    │   "Should I buy     │
                    │    ITC?"            │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Planner Agent     │
                    │   (Task Decompose)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌────▼─────┐ ┌───────▼───────┐
     │  Stock Agent    │ │Risk Agent│ │ News Agent    │
     │  (Fetch ITC     │ │(Portfolio│ │ (Recent ITC   │
     │   fundamentals) │ │ impact)  │ │  sentiment)   │
     └────────┬────────┘ └────┬─────┘ └───────┬───────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Explainability     │
                    │  Agent (LLM)        │
                    │  "Plain language"   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Memory Agent       │
                    │  (Context Store)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Final Response     │
                    │  "ITC scores 78/100 │
                    │   Recommended buy"  │
                    └─────────────────────┘
```

### LangGraph Agents

| Agent | Responsibility | Tools |
|-------|---------------|-------|
| Planner Agent | Decompose complex queries | — |
| Stock Agent | Fetch stock data & scores | yfinance, PostgreSQL, MongoDB |
| Risk Agent | Portfolio risk assessment | PostgreSQL, risk calculator |
| News Agent | News & sentiment | News API, sentiment analyzer |
| Forecast Agent | Price predictions | ML models, Vector DB |
| Tax Agent | Tax optimization | PostgreSQL, tax rules |
| Explainability Agent | Plain language | LLM |
| Memory Agent | Context retention | Redis, MongoDB |
| Research Agent | Deep company research | Annual reports, LLM |

---

## 5. Vector Database (RAG)

### Collections (pgvector)

| Collection | Documents | Purpose |
|------------|-----------|---------|
| `stock_reports` | Company research reports | "Tell me about ITC" → relevant chunks |
| `annual_reports` | AR analysis chunks | "What did CEO say?" → quotes |
| `news_archive` | Processed news | "Recent ITC news" → relevant articles |
| `chat_history` | Past conversations | "What did I ask before?" → context |
| `learning_content` | Lessons, courses | "Explain P/E ratio" → lesson chunks |

### RAG Flow

```
User Question → Embed (LLM) → pgvector Search → Top 5 Chunks
    → LLM Prompt (Question + Chunks) → Response
```

---

## 6. API Gateway Pattern

```
Client → Nginx → NestJS API → [PostgreSQL / MongoDB / Redis]
                                    │
                                    ▼
                              AI Service → [pgvector / LLM]
                                    │
                                    ▼
                              Kafka → [Notifications / Analytics]
```

### Rate Limiting

| Tier | Requests/min | Burst |
|------|-------------|-------|
| Free | 60 | 10 |
| Pro | 300 | 50 |
| Enterprise | 1000 | 100 |

---

## 7. Security Architecture

| Layer | Implementation |
|-------|---------------|
| Auth | JWT (15 min) + Refresh Token (7 days) |
| Password | bcrypt (12 rounds) |
| API | Rate limiting, CORS, Helmet |
| Data | Encryption at rest, TLS in transit |
| AI | Input validation, output filtering |
| Compliance | SEBI disclaimers, DPDP Act |
| Audit | Every action logged in audit_logs |

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────┐
│                  Docker Compose              │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Nginx   │  │  NestJS  │  │ FastAPI  │  │
│  │  :80     │  │  :3000   │  │  :8000   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PostgreSQL│  │ MongoDB  │  │  Redis   │  │
│  │  :5432   │  │ Atlas    │  │  :6379   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐                               │
│  │  Kafka   │                               │
│  │  :9092   │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

---

## 9. Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Structured JSON Logs | Winston (NestJS), Python logging (FastAPI) |
| Health Checks | `/health` endpoint per service |
| Metrics | Prometheus + Grafana (Phase 2+) |
| Error Tracking | Sentry (Phase 2+) |
| Uptime | BetterStack or UptimeRobot |

---

*This architecture supports all 20 modules with scalability, reliability, and AI-first design.*
