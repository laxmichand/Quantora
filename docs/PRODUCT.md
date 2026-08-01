# Quantora — Product Requirements Document

> **Quantora — Intelligent Investing. Simplified.**

**Version:** 1.0
**Date:** July 26, 2026
**Status:** Draft for Review

---

## 1. Executive Summary

**Quantora** is an AI-powered investment intelligence platform designed for Indian retail investors — combining the data depth of Bloomberg, the risk intelligence of BlackRock Aladdin, the conversational power of Perplexity, and the proactive guidance of an AI Copilot.

It combines real-time market data, AI-driven analytics, portfolio management, and community features into a single unified product.

**Vision:** Democratize institutional-grade financial intelligence for every Indian retail investor.

**Target Users:** Retail investors in India (NSE/BSE markets), ranging from beginners to advanced traders.

**Core Differentiator:** Every metric, score, and risk indicator is explained in plain language by AI — no finance degree required.

---

## 1. Current State vs Vision

> **This document is the full product vision (all 20 modules).** Live as of **0.4.3 (Aug 2026)**, only a subset is implemented:
>
> - **Implemented**: Auth (register/login/logout/refresh/Google OAuth/verify-email/forgot/reset-password), MFA (TOTP), account lockout, sessions & devices, login history, security events, user preferences, subscriptions model, admin endpoints, notifications (email/Telegram), portfolio/watchlist/goal models (schema only), AI chat UI + minimal FastAPI service.
> - **Schema-only (no API yet)**: portfolios, holdings, goals, alerts, watchlists, payments.
> - **Planned / not started**: the entire Market Data Platform (stocks, news, scores, forecasts, sector data, smart money), Kafka, vector DB, MongoDB-style document storage, full LLM/LangGraph agents.
> - **Database reality**: PostgreSQL (Supabase) via Prisma + optional Redis only. **No MongoDB** — see `docs/DATABASE.md`. Where this doc references MongoDB, treat it as planned/legacy.
> - See `docs/CHANGELOG.md` and `docs/SPRINT-PLAN.md` for what shipped per release.

---

## 2. Product Architecture Overview (Target State)

```
                    External APIs
              (NSE, BSE, Yahoo, RBI)
                       │
                       ▼
                    Kafka
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   PostgreSQL      MongoDB        Redis
        │              │              │
        └───────► AI Service ◄────────┘
                       │
                  Vector Database
                       │
                  LLM / LangGraph
                       │
                       ▼
              Backend API (NestJS)
                       │
                       ▼
              Frontend (Angular)
```

### Infrastructure

| Layer          | Technology                     | Purpose                                              |
| -------------- | ------------------------------ | ---------------------------------------------------- |
| Frontend       | Angular 17+ + Angular Material | Web application, i18n (Hindi/English)                |
| Backend API    | NestJS (Node.js + TypeScript)  | Business logic, auth, orchestration                  |
| AI Service     | Python + FastAPI + LangGraph   | ML models, analysis, forecasts, agents               |
| **PostgreSQL** | Relational DB (Supabase + Prisma) | Users, auth, sessions, devices, portfolios, goals, subscriptions, audit logs |
| **MongoDB**    | Document DB *(planned — not in use)* | Stocks, news, scores, chat history, research reports |
| **Redis**      | Cache + Sessions               | Revoked-JWT blacklist, sessions, rate limiting (optional) |
| **Kafka**      | Message Queue *(planned)*      | Event streaming, data pipeline, real-time sync       |
| **Vector DB**  | Pinecone / pgvector *(planned)*| Semantic search, RAG for AI chat                     |
| **LLM**        | OpenAI / Anthropic *(planned)* | Explanations, chat, summaries, analysis              |
| **LangGraph**  | Agent Orchestrator *(planned)* | Multi-agent AI workflow                              |
| i18n           | Angular i18n + ngx-translate   | Hindi, English, Hinglish support                     |
| Notifications  | Telegram, Email, Push          | User alerts, daily reports                           |

---

## 3. Module Specifications

---

### Module 1 — Data Foundation Layer

**Purpose:** Single source of truth for all market data.

**Users:** Retail investors, AI Engine, Risk Engine, Portfolio Engine, all downstream modules.

#### Features

| Category              | Features                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Market Data**       | Live NSE/BSE prices, Historical prices (daily/weekly/monthly), Pre-market & after-market data          |
| **Fundamentals**      | Company financials (P&L, Balance Sheet, Cash Flow), Ratio analysis, Peer comparison data               |
| **Corporate Actions** | Dividends, Bonus issues, Stock splits, Rights issues, Mergers & Demergers                              |
| **Institutional**     | FII/FPI data, DII data, Mutual fund holdings, ETF holdings                                             |
| **Derivatives**       | Options chain, Futures data, Open interest, Max pain                                                   |
| **Macro**             | Currency (USD/INR, EUR/INR), Commodities (Gold, Silver, Crude), Bond yields (10Y G-Sec), CPI, WPI, GDP |
| **Alternative**       | Mutual fund NAV, REIT/InvIT data                                                                       |

#### AI Features

| Feature                 | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| Missing Data Prediction | Impute gaps in historical data using statistical methods         |
| Data Anomaly Detection  | Flag unusual data points (e.g., sudden price spike with no news) |
| Data Quality Scoring    | Rate reliability of data sources per stock                       |

#### Data Sources

- Angel One (primary market-data provider, NSE/BSE)
- NSE India APIs
- BSE India APIs
- MoneyControl / Tickertape (scraping where APIs unavailable)
- RBI data portal
- SEBI filings

#### Tech Requirements

| Component         | Technology                                   |
| ----------------- | -------------------------------------------- |
| Data Fetcher      | Angel One (REST + smart-stream WebSocket)                |
| Stream Processing | Apache Kafka                                 |
| Cache             | Redis (live prices, TTL-based)               |
| Storage           | PostgreSQL (structured)         |
| Scheduler         | APScheduler / Celery                         |

---

### Module 2 — AI Stock Intelligence

**Purpose:** AI evaluates every stock across multiple dimensions and explains WHY.

#### Scoring System

| Score               | What It Measures                                   |
| ------------------- | -------------------------------------------------- |
| **AI Score**        | Overall composite score (0-100)                    |
| **Quality Score**   | Management quality, governance, accounting quality |
| **Value Score**     | P/E, P/B, EV/EBITDA vs peers and history           |
| **Growth Score**    | Revenue growth, earnings growth, market expansion  |
| **Dividend Score**  | Yield, payout ratio, consistency, growth           |
| **Risk Score**      | Volatility, debt, promoter pledge, litigation      |
| **Technical Score** | Trend, momentum, volume patterns                   |
| **Momentum Score**  | Price momentum, relative strength                  |
| **ESG Score**       | Environmental, Social, Governance factors          |

#### Valuation Models

| Model                      | Output                    |
| -------------------------- | ------------------------- |
| DCF (Discounted Cash Flow) | Intrinsic Value           |
| Relative Valuation         | Fair Value vs peers       |
| Graham Number              | Benjamin Graham's formula |
| PEG Ratio Analysis         | Growth-adjusted value     |

#### Analysis Features

| Feature              | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| SWOT Analysis        | AI-generated strengths, weaknesses, opportunities, threats |
| Moat Analysis        | Economic moat type and durability assessment               |
| Competitive Analysis | Positioning vs industry peers                              |
| Peer Comparison      | Side-by-side metrics comparison                            |
| Earnings Analysis    | Results vs estimates, guidance interpretation              |

#### AI Explainability

Every score change triggers an explanation:

```
WHY did ITC's AI Score drop from 78 to 72?
-> "Revenue growth slowed to 3% QoQ. FII holdings decreased by 0.5%.
   Technical indicators show bearish divergence. However, dividend
   yield remains strong at 3.2%."
```

---

### Module 3 — Risk Analytics Engine

**Purpose:** Retail version of BlackRock's Aladdin Risk Engine.

#### Risk Metrics

| Metric                     | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **VaR (Value at Risk)**    | Maximum expected loss over a time period at confidence level |
| **CVaR (Conditional VaR)** | Average loss beyond VaR threshold                            |
| **Beta**                   | Sensitivity to market movements                              |
| **Alpha**                  | Excess return vs benchmark                                   |
| **Sharpe Ratio**           | Risk-adjusted return                                         |
| **Sortino Ratio**          | Downside risk-adjusted return                                |
| **Calmar Ratio**           | Return vs maximum drawdown                                   |
| **Max Drawdown**           | Largest peak-to-trough decline                               |
| **Portfolio Risk**         | Aggregate portfolio-level risk                               |
| **Correlation Matrix**     | Cross-asset correlation heatmap                              |
| **Diversification Score**  | How well-diversified the portfolio is                        |
| **Stress Score**           | Portfolio resilience under stress                            |
| **Risk Heatmap**           | Visual risk distribution across holdings                     |

#### AI Explainability

Each metric includes a plain-language explanation:

```
"Your portfolio Sharpe ratio is 0.8, which is below the ideal
threshold of 1.0. This means you're taking on more risk than
necessary for your returns. Consider adding low-correlation
assets like gold or debt funds."
```

---

### Module 4 — Stress Testing

**Purpose:** "What happens if..." scenario simulation.

#### Built-in Scenarios

| Scenario           | Description                          |
| ------------------ | ------------------------------------ |
| Market Crash       | 20-40% broad market decline          |
| COVID Replay       | March 2020 crash pattern             |
| 2008 Replay        | Global financial crisis pattern      |
| Russia-Ukraine War | Geopolitical shock + commodity spike |
| Fed Rate Hike      | Aggressive tightening cycle          |
| Oil Spike          | Crude above $120/bbl                 |
| Currency Shock     | INR depreciation > 5%                |
| High Inflation     | CPI above 8% sustained               |
| Banking Crisis     | NBFC/Bank contagion risk             |
| Custom Scenario    | User-defined parameters              |

#### Output

- Expected portfolio loss (% and absolute)
- Sector-wise impact breakdown
- Recovery timeline estimate
- Hedging recommendations
- AI explanation of impact chain

---

### Module 5 — News Intelligence

**Purpose:** Convert news into investment intelligence.

#### News Collection

| Source Type    | Examples                                        |
| -------------- | ----------------------------------------------- |
| Financial News | Economic Times, MoneyControl, LiveMint          |
| Earnings       | Quarterly results, guidance, conference calls   |
| Regulatory     | RBI circulars, SEBI orders, government policies |
| Insider        | CEO interviews, management commentary           |
| Global         | Fed decisions, geopolitical events              |

#### AI Processing

| Feature             | Output                                       |
| ------------------- | -------------------------------------------- |
| AI Summary          | 2-3 sentence summary per article             |
| Sentiment Score     | Positive / Negative / Neutral + Confidence % |
| Fake News Detection | Credibility scoring                          |
| Impact Assessment   | Which stocks/sectors affected                |
| Timeline View       | Chronological event tracking                 |
| Earnings Digest     | Results summary vs estimates                 |

---

### Module 6 — Sector Intelligence

**Purpose:** Top-down sector analysis and rotation tracking.

#### Features

| Feature              | Description                                  |
| -------------------- | -------------------------------------------- |
| Sector Heatmap       | Visual performance comparison                |
| Industry Rotation    | Which sectors are in/out of favor            |
| Macro Impact         | How macros affect each sector                |
| Commodity Impact     | Commodity price to sector correlation        |
| Currency Impact      | INR movement to export/import sector effects |
| Interest Rate Impact | Rate sensitivity by sector                   |
| Seasonal Trends      | Historical sector seasonality                |
| Sector Leadership    | Leading stocks per sector                    |
| Sector Ranking       | AI-ranked best to worst sectors              |

#### AI Predictions

- Best sectors for next 1Q, 6M, 1Y
- Worst sectors to avoid
- Rotation signals (early, confirmed, late)

---

### Module 7 — AI Forecast Engine

**Purpose:** Probabilistic forecasting — never certainty.

#### Forecasts

| Forecast             | Output                                    |
| -------------------- | ----------------------------------------- |
| Price Probability    | Probability distribution for price ranges |
| Range Forecast       | Expected price range with confidence      |
| Earnings Probability | Beat / Miss / In-line probabilities       |
| Dividend Forecast    | Expected next dividend                    |
| Revenue Forecast     | Revenue projection                        |
| Support/Resistance   | Key technical levels                      |

#### Core Principle

> "The model says there's a 65% probability ITC trades between 440-480 in 3 months, with a 20% chance above 480 and 15% below 440."

**Never predicts certainty. Always probabilities.**

---

### Module 8 — Ask Quantora (AI Chat)

**Purpose:** Conversational AI advisor that analyzes holistically.

#### User Interaction

```
User: "Should I buy ITC?"

AI Analysis:
+-- Portfolio analysis (current holdings, overlap)
+-- News analysis (recent sentiment, events)
+-- Risk analysis (portfolio risk impact)
+-- Valuation analysis (is it fairly priced?)
+-- Goal alignment (matches your investment goals?)
+-- Return potential (expected returns)
+-- Tax impact (STCG/LTCG implications)
+-- Final recommendation with reasoning
```

#### Supported Inputs

| Input Type | Support                             |
| ---------- | ----------------------------------- |
| Voice      | Speech-to-text                      |
| Languages  | Hindi, English, Hinglish            |
| Images     | Chart screenshots, portfolio photos |
| Charts     | Technical chart analysis            |
| Documents  | Research reports, annual reports    |
| PDF        | Statement uploads                   |

---

### Module 9 — Portfolio Doctor

**Purpose:** Complete portfolio health checkup and optimization.

#### Features

| Feature                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| Portfolio Upload        | CSV/Excel/Demat import                       |
| Diversification Check   | Asset, sector, market cap distribution       |
| Risk Assessment         | Portfolio-level risk metrics                 |
| Sector Allocation       | Pie chart + benchmark comparison             |
| Rebalancing Suggestions | What to buy/sell/hold                        |
| Dead Stock Detection    | Stocks that are underperforming consistently |
| Profit/Loss Analysis    | Realized and unrealized P&L                  |
| Tax Optimization        | Tax-loss harvesting opportunities            |
| Benchmark Comparison    | vs Nifty 50, Nifty 500, custom               |
| Portfolio Score         | Single health score (0-100)                  |
| Health Report           | Visual health dashboard                      |
| AI Recommendations      | Actionable improvement suggestions           |

---

### Module 10 — Goal Planner

**Purpose:** Goal-based investing with AI-created roadmaps.

#### Supported Goals

| Goal              | Typical Horizon |
| ----------------- | --------------- |
| Retirement        | 15-30 years     |
| Child's Education | 5-18 years      |
| Child's Marriage  | 10-20 years     |
| House Purchase    | 5-15 years      |
| Emergency Fund    | Immediate       |
| Passive Income    | 5-10 years      |
| Vacation          | 1-5 years       |
| Financial Freedom | 10-25 years     |

#### AI Output

- Investment roadmap (year-by-year)
- SIP amount recommendation
- SWP plan for withdrawal phase
- Expected timeline to goal
- Probability of achieving goal
- Course correction suggestions

---

### Module 11 — Passive Income Engine

**Purpose:** Build and track monthly passive income streams.

#### Income Sources

| Source                      | Risk Level     |
| --------------------------- | -------------- |
| Dividend Stocks             | Low-Medium     |
| Covered Calls               | Medium         |
| REITs                       | Low-Medium     |
| InvITs                      | Medium         |
| Corporate Bonds             | Low-Medium     |
| Debt Mutual Funds           | Low            |
| SWP (Systematic Withdrawal) | Low            |
| Rental Yield                | Low (illiquid) |

#### Features

- Monthly income planner
- Income vs expense tracking
- Tax-efficient structuring
- AI recommends safest strategy per risk appetite
- Yield optimization suggestions

---

### Module 12 — Smart Money Tracker

**Purpose:** Track what institutional investors are doing.

#### Tracking

| Entity               | Data Points                                       |
| -------------------- | ------------------------------------------------- |
| FII/FPI              | Monthly/quarterly holdings, buying/selling trends |
| DII                  | Mutual fund holdings, insurance company holdings  |
| Promoters            | Promoter holding changes, pledge changes          |
| Mutual Funds         | Scheme-wise stock holdings                        |
| Bulk Deals           | Daily bulk deal tracking                          |
| Block Deals          | Large institutional transactions                  |
| Insider Trading      | Director/key management personnel trades          |
| Shareholding Pattern | Quarterly shareholding changes                    |

#### AI Signals

- Institution buying = potential opportunity signal
- Institution selling = potential risk signal
- Promoter buying = confidence signal
- Promoter pledging = risk signal

---

### Module 13 — AI Technical Analysis

**Purpose:** Automated pattern detection with AI explanations.

#### Patterns Detected

| Category            | Patterns                                                      |
| ------------------- | ------------------------------------------------------------- |
| **Chart Patterns**  | Head & Shoulders, Double Top/Bottom, Triangles, Flags, Wedges |
| **Candlestick**     | Doji, Hammer, Engulfing, Morning Star, etc.                   |
| **Trendlines**      | Support, Resistance, Trend channels                           |
| **Breakouts**       | Volume-confirmed breakouts and breakdowns                     |
| **Indicators**      | RSI, MACD, Bollinger Bands, Moving Averages, Volume           |
| **Multi-timeframe** | Daily, Weekly, Monthly alignment                              |

#### AI Explanation

```
"ITC is forming a bullish flag pattern on the daily chart.
RSI at 58 indicates room for upside. The stock is trading
above its 50-DMA and 200-DMA, confirming the uptrend.
Volume is picking up near the flag breakout zone around 460.
If it breaks 465 with volume, the target is 490."
```

---

### Module 14 — Learning Hub

**Purpose:** Financial education with gamification.

#### Content Types

| Type             | Description                |
| ---------------- | -------------------------- |
| Lessons          | Bite-sized topics          |
| Courses          | Structured learning paths  |
| Glossary         | Financial terms dictionary |
| Quiz             | Knowledge testing          |
| Flashcards       | Quick revision             |
| Daily Learning   | Daily fact/concept         |
| Mistake Analysis | Common investor mistakes   |
| Case Studies     | Real-world examples        |

#### Engagement

- Progress tracking (courses completed, streaks)
- Certificates on course completion
- Gamification (points, badges, levels)
- Leaderboards (optional)

---

### Module 15 — Community

**Purpose:** Social investing and peer learning.

#### Features

| Feature              | Description                    |
| -------------------- | ------------------------------ |
| Community Ideas      | Share investment theses        |
| Stock Discussions    | Threaded discussions per stock |
| Polls                | Sentiment polling              |
| Leaderboards         | Top performers (optional)      |
| Model Portfolios     | Share and follow portfolios    |
| Success Stories      | Inspirational journeys         |
| Challenges           | Monthly investment challenges  |
| Social Investing     | Follow/copy strategies         |
| Anonymous Portfolios | Share without identity         |

---

### Module 16 — AI Research Lab

**Purpose:** Deep-dive company research powered by AI.

#### Features

| Feature                | Description                           |
| ---------------------- | ------------------------------------- |
| One-Click Research     | Generate full company research report |
| Annual Report Analysis | AI extracts key insights from AR      |
| Earnings Transcript    | AI summarizes management commentary   |
| Patent Analysis        | Innovation pipeline assessment        |
| Competitor Analysis    | Competitive positioning               |
| Research Reports       | 30-50 page AI-generated PDF reports   |

---

### Module 17 — Compliance & Governance

**Purpose:** Regulatory compliance and data privacy.

#### Requirements

| Area               | Requirement                                  |
| ------------------ | -------------------------------------------- |
| SEBI Compliance    | Investment advisor regulations, disclaimers  |
| DPDP Act           | Data Protection & Digital Privacy compliance |
| Consent Management | Explicit user consent for data processing    |
| Audit Logs         | Complete audit trail of user actions         |
| Disclaimers        | Clear investment risk disclaimers            |
| AI Transparency    | Model explainability, bias monitoring        |

---

### Module 18 — AI Agent Orchestrator

**Purpose:** Multi-agent AI system for complex reasoning.

#### Agent Types

| Agent                | Responsibility                      |
| -------------------- | ----------------------------------- |
| Planner Agent        | Task decomposition and planning     |
| Risk Agent           | Risk assessment and monitoring      |
| News Agent           | News collection and analysis        |
| Portfolio Agent      | Portfolio analysis and optimization |
| Forecast Agent       | Predictive modeling                 |
| Tax Agent            | Tax optimization                    |
| Explainability Agent | Plain-language explanations         |
| Research Agent       | Deep research tasks                 |
| Memory Agent         | Context retention across sessions   |

---

### Module 19 — Notification & Automation

**Purpose:** Smart alerts and automated reporting.

#### Channels

| Channel            | Use Case                          |
| ------------------ | --------------------------------- |
| Telegram           | Real-time alerts, daily summaries |
| WhatsApp           | Weekly reports, goal updates      |
| Email              | Detailed reports, research        |
| Push Notifications | Price alerts, breaking news       |

#### Alert Types

- Price alerts (target/stop-loss)
- Volume alerts
- News alerts (stock-specific)
- Portfolio alerts (drawdown, rebalancing)
- Goal alerts (behind schedule)
- Scheduled reports (daily, weekly, monthly)

---

### Module 20 — Admin & Analytics

**Purpose:** Platform management and business intelligence.

#### Features

| Area                    | Features                          |
| ----------------------- | --------------------------------- |
| User Management         | User CRUD, roles, permissions     |
| Subscription Management | Plans, billing, payments          |
| AI Usage Monitoring     | Token usage, model costs, latency |
| Revenue Dashboard       | MRR, ARR, churn, LTV              |
| Feature Flags           | Gradual rollout, A/B testing      |
| Audit Logs              | System-wide audit trail           |
| System Health           | Uptime, error rates, performance  |
| Product Analytics       | User behavior, funnel analysis    |

---

## 4. Recommended Build Order

| Phase                           | Modules                                                                   | Timeline    | Milestone          |
| ------------------------------- | ------------------------------------------------------------------------- | ----------- | ------------------ |
| **Phase 1 — Foundation**        | Data Layer, Auth, Portfolio Upload                                        | Month 1-2   | MVP Launch         |
| **Phase 2 — Core Intelligence** | AI Stock Intelligence, Risk Analytics, Portfolio Doctor                   | Month 2-4   | Smart Analytics    |
| **Phase 3 — Engagement**        | News Intelligence, Ask Quantora, Notifications                            | Month 4-6   | User Engagement    |
| **Phase 4 — Planning**          | Goal Planner, Passive Income Engine                                       | Month 6-8   | Financial Planning |
| **Phase 5 — Advanced**          | Stress Testing, Forecast Engine, Sector Intelligence, Smart Money Tracker | Month 8-11  | Advanced Analytics |
| **Phase 6 — Growth**            | Learning Hub, Community, AI Research Lab                                  | Month 11-14 | Growth & Retention |
| **Phase 7 — Enterprise**        | Compliance, Agent Orchestrator, Admin & Analytics                         | Month 14-16 | Enterprise Ready   |

---

## 5. Success Metrics

| Metric               | Target (Year 1) |
| -------------------- | --------------- |
| Registered Users     | 50,000          |
| Monthly Active Users | 20,000          |
| Paid Subscribers     | 5,000           |
| AI Queries/Day       | 100,000         |
| DAU/MAU Ratio        | > 30%           |
| NPS Score            | > 50            |
| Churn Rate (monthly) | < 5%            |

---

## 6. Risks & Mitigations

| Risk                          | Impact | Mitigation                                             |
| ----------------------------- | ------ | ------------------------------------------------------ |
| Data source reliability       | High   | Multiple fallback sources, data validation             |
| AI hallucination              | High   | Human review layer, confidence thresholds              |
| Regulatory changes            | Medium | Modular compliance layer, legal monitoring             |
| Scalability                   | Medium | Microservices architecture, auto-scaling               |
| User trust (financial advice) | High   | Clear disclaimers, explainability, not recommendations |

---

_This document serves as the single source of truth for the Quantora product vision and implementation roadmap._
