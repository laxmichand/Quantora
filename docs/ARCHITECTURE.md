# Quantora — System Architecture

> **Complete technical architecture for all 20 modules.**
>
> **Current state (0.4.3)**: PostgreSQL (Supabase + Prisma) + optional Redis only — **no MongoDB, no Kafka, no vector DB yet**. Those data stores below are *planned/target state*; the live auth/security surface (sessions, devices, login history, security events, MFA) is fully Postgres-backed. See `docs/DATABASE.md`.

---

## High-Level Architecture

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
     │                 │  │                 │  │                 │
     │ • Users         │  │ • Stocks        │  │ • Live Prices   │
     │ • Portfolios    │  │ • News          │  │ • Sessions      │
     │ • Goals         │  │ • Scores        │  │ • Rate Limits   │
     │ • Subscriptions │  │ • Chat History  │  │ • Cache         │
     │ • Audit Logs    │  │ • Research      │  │                 │
     │ • Holdings      │  │ • Forecasts     │  │                 │
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
     │                 │  │  (FastAPI)      │  │                 │
     │ • NSE India     │  │                 │  │ • Pinecone      │
     │ • BSE India     │  │ • Scoring       │  │ • pgvector      │
     │ • Yahoo Finance │  │ • Risk          │  │ • Semantic      │
     │ • RBI Data      │  │ • Forecast      │  │   Search        │
     │ • MoneyControl  │  │ • Sentiment     │  │ • RAG           │
     └─────────────────┘  │ • Technical     │  └─────────────────┘
                          │ • LangGraph     │
                          │   Agents        │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   LLM Layer     │
                          │                 │
                          │ • OpenAI GPT-4  │
                          │ • Anthropic     │
                          │ • LangGraph     │
                          │   Orchestrator  │
                          └─────────────────┘
```

---

## Database Strategy

### PostgreSQL (Relational)

**Purpose:** Structured data with relationships, ACID compliance.

| Table           | Purpose                    | Key Relationships          |
| --------------- | -------------------------- | -------------------------- |
| `users`         | User accounts, auth, roles | —                          |
| `portfolios`    | User portfolios            | → users                    |
| `holdings`      | Portfolio holdings         | → portfolios, → stocks_ref |
| `goals`         | Financial goals            | → users                    |
| `subscriptions` | Plan management            | → users                    |
| `audit_logs`    | Action tracking            | → users                    |
| `alerts`        | Price/notification alerts  | → users                    |
| `watchlists`    | User watchlists            | → users                    |

### MongoDB (Document) — *planned*

**Purpose:** Flexible schemas, high-volume data, fast reads. **Not in use as of 0.4.3.**

| Collection         | Purpose                  | Why MongoDB              |
| ------------------ | ------------------------ | ------------------------ |
| `stocks`           | Stock master data        | Schema varies by source  |
| `scores`           | AI scores per stock      | Complex nested scores    |
| `news`             | News articles            | Unstructured content     |
| `chat_history`     | AI conversations         | Variable message formats |
| `forecasts`        | Price/earnings forecasts | Complex nested output    |
| `research_reports` | Generated reports        | Large documents          |
| `sector_data`      | Sector metrics           | Flexible time-series     |
| `smart_money`      | FII/DII tracking         | Variable data format     |

### Redis (Cache + Sessions)

**Purpose:** Speed, TTL-based caching, real-time.

| Key Pattern              | TTL    | Purpose            |
| ------------------------ | ------ | ------------------ |
| `stock:price:{symbol}`   | 5 min  | Live stock price   |
| `stock:history:{symbol}` | 1 hour | Historical data    |
| `stock:scores:{symbol}`  | 1 hour | AI scores          |
| `session:{userId}`       | 7 days | User session       |
| `rate:{ip}`              | 1 min  | Rate limiting      |
| `leaderboard`            | 1 day  | Community rankings |
| `alerts:queue`           | —      | Pending alerts     |

---

## Kafka Event Streaming

### Topics

| Topic               | Producer           | Consumer             | Purpose                |
| ------------------- | ------------------ | -------------------- | ---------------------- |
| `stock.prices`      | Data Fetcher       | Score Calculator     | Live price updates     |
| `stock.scores`      | Score Calculator   | Notification Service | Score change alerts    |
| `news.raw`          | News Collector     | Sentiment Analyzer   | New articles           |
| `news.processed`    | Sentiment Analyzer | Stock Mapper         | Scored articles        |
| `portfolio.changes` | Portfolio Service  | Risk Calculator      | Holdings changed       |
| `alerts.triggered`  | Alert Service      | Notification Service | Send notifications     |
| `user.events`       | Backend API        | Analytics Service    | User actions           |
| `ai.requests`       | Backend API        | AI Service           | Chat/analysis requests |

### Event Flow

```
NSE API → Kafka(stock.prices) → PostgreSQL(Price Store)
                               → MongoDB(Score Update)
                               → Redis(Cache Update)
                               → Kafka(stock.scores) → Notification Service
```

---

## AI Service Architecture (LangGraph)

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

| Agent                | Responsibility            | Tools                         |
| -------------------- | ------------------------- | ----------------------------- |
| Planner Agent        | Decompose complex queries | —                             |
| Stock Agent          | Fetch stock data & scores | yfinance, PostgreSQL, MongoDB |
| Risk Agent           | Portfolio risk assessment | PostgreSQL, risk calculator   |
| News Agent           | News & sentiment          | News API, sentiment analyzer  |
| Forecast Agent       | Price predictions         | ML models, Vector DB          |
| Tax Agent            | Tax optimization          | PostgreSQL, tax rules         |
| Explainability Agent | Plain language            | LLM                           |
| Memory Agent         | Context retention         | Redis, MongoDB                |
| Research Agent       | Deep company research     | Annual reports, LLM           |

---

## Vector Database (RAG)

**Purpose:** Semantic search for AI chat context.

### Collections

| Collection         | Documents                | Purpose                               |
| ------------------ | ------------------------ | ------------------------------------- |
| `stock_reports`    | Company research reports | "Tell me about ITC" → relevant chunks |
| `annual_reports`   | AR analysis chunks       | "What did CEO say?" → quotes          |
| `news_archive`     | Processed news           | "Recent ITC news" → relevant articles |
| `chat_history`     | Past conversations       | "What did I ask before?" → context    |
| `learning_content` | Lessons, courses         | "Explain P/E ratio" → lesson chunks   |

### RAG Flow

```
User Question → Embed (OpenAI) → Vector Search → Top 5 Chunks
    → LLM Prompt (Question + Chunks) → Response
```

---

## i18n (Internationalization)

### Supported Languages

| Language | Code    | Coverage |
| -------- | ------- | -------- |
| English  | `en`    | 100%     |
| Hindi    | `hi`    | 100%     |
| Hinglish | `hi-en` | 80%      |

### Implementation

**Frontend (Angular):**

```typescript
// ngx-translate
{ provide: TranslateLoader, useFactory: HttpLoaderFactory }
// assets/i18n/en.json, hi.json
```

**Backend (NestJS):**

```typescript
// nestjs-i18n
i18n.t('error.stock.not_found', { lang, args: { symbol: 'ITC' } });
```

**AI Service (Python):**

```python
# Response language based on user preference
response = llm.generate(prompt, language=user.language)
```

---

## API Gateway Pattern

```
Client → Nginx → NestJS API → [PostgreSQL / MongoDB / Redis]
                                    │
                                    ▼
                              AI Service → [Vector DB / LLM]
                                    │
                                    ▼
                              Kafka → [Notifications / Analytics]
```

### Rate Limiting

| Tier       | Requests/min | Burst |
| ---------- | ------------ | ----- |
| Free       | 60           | 10    |
| Pro        | 300          | 50    |
| Enterprise | 1000         | 100   |

---

## Security Architecture

| Layer      | Implementation                     |
| ---------- | ---------------------------------- |
| Auth       | JWT + Refresh Token                |
| Password   | bcrypt (12 rounds)                 |
| API        | Rate limiting, CORS                |
| Data       | Encryption at rest, TLS in transit |
| AI         | Input validation, output filtering |
| Compliance | SEBI disclaimers, DPDP Act         |
| Audit      | Every action logged                |

---

## Deployment Architecture

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
│  │  :5432   │  │  :27017  │  │  :6379   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │  Kafka   │  │  Vector  │                │
│  │  :9092   │  │  DB      │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

---

_This architecture supports all 20 modules with scalability, reliability, and AI-first design._
