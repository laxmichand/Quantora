# Quantora — Product Requirements Document

> **Document ID:** QPR-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Product Vision

**Quantora** is an AI-powered investment intelligence platform that provides deep market data, intelligent risk analytics, conversational AI, and proactive portfolio guidance — all for Indian retail investors.

---

## 2. User Stories (All 20 Modules)

### Module 1 — Data Foundation Layer

| ID | Story | Priority |
|----|-------|----------|
| US-1.1 | As a user, I want to see live NSE/BSE stock prices so I can track my investments in real-time | P0 |
| US-1.2 | As a user, I want to view historical price data (daily/weekly/monthly) so I can analyze trends | P0 |
| US-1.3 | As a user, I want to see company financials (P&L, Balance Sheet, Cash Flow) so I can evaluate fundamentals | P0 |
| US-1.4 | As a user, I want to see FII/DII holdings data so I can track institutional activity | P1 |
| US-1.5 | As a user, I want to see options chain data so I can analyze derivatives | P2 |
| US-1.6 | As a user, I want to see macro data (USD/INR, Gold, Crude, CPI) so I can understand market context | P1 |

### Module 2 — AI Stock Intelligence

| ID | Story | Priority |
|----|-------|----------|
| US-2.1 | As a user, I want to see an AI Score (0-100) for every stock so I can quickly assess quality | P0 |
| US-2.2 | As a user, I want to see WHY the score changed (plain language) so I understand the reasoning | P0 |
| US-2.3 | As a user, I want to see value, growth, quality, risk, technical, and momentum sub-scores | P0 |
| US-2.4 | As a user, I want to see DCF intrinsic value and fair value estimates so I know if a stock is over/undervalued | P1 |
| US-2.5 | As a user, I want AI-generated SWOT analysis for any stock | P1 |
| US-2.6 | As a user, I want peer comparison (side-by-side metrics) so I can compare stocks in the same sector | P1 |

### Module 3 — Risk Analytics Engine

| ID | Story | Priority |
|----|-------|----------|
| US-3.1 | As a user, I want to see my portfolio's VaR (Value at Risk) so I know my maximum expected loss | P0 |
| US-3.2 | As a user, I want to see my portfolio's Sharpe Ratio, Beta, Alpha so I understand risk-adjusted returns | P0 |
| US-3.3 | As a user, I want to see a correlation matrix so I know how my stocks move together | P1 |
| US-3.4 | As a user, I want a diversification score so I know if my portfolio is well-diversified | P1 |
| US-3.5 | As a user, I want a risk heatmap so I can visually see my risk distribution | P1 |
| US-3.6 | As a user, I want plain-language risk explanations so I understand metrics without a finance degree | P0 |

### Module 4 — Stress Testing

| ID | Story | Priority |
|----|-------|----------|
| US-4.1 | As a user, I want to simulate "What if market crashes 30%?" so I know my portfolio impact | P1 |
| US-4.2 | As a user, I want to run built-in scenarios (COVID, 2008, Fed Hike) so I can compare historical impacts | P2 |
| US-4.3 | As a user, I want hedging recommendations after stress tests so I can protect my portfolio | P2 |

### Module 5 — News Intelligence

| ID | Story | Priority |
|----|-------|----------|
| US-5.1 | As a user, I want AI-summarized news for my portfolio stocks so I stay informed without reading everything | P0 |
| US-5.2 | As a user, I want sentiment scoring (positive/negative/neutral) for news articles | P0 |
| US-5.3 | As a user, I want fake news detection so I don't act on misinformation | P1 |
| US-5.4 | As a user, I want impact assessment (which stocks/sectors affected by news) | P1 |

### Module 6 — Sector Intelligence

| ID | Story | Priority |
|----|-------|----------|
| US-6.1 | As a user, I want a sector heatmap so I can see which sectors are performing | P1 |
| US-6.2 | As a user, I want sector rotation signals so I can shift money to trending sectors | P2 |
| US-6.3 | As a user, I want sector ranking (AI best to worst) so I can make allocation decisions | P2 |

### Module 7 — AI Forecast Engine

| ID | Story | Priority |
|----|-------|----------|
| US-7.1 | As a user, I want probability-based price forecasts (never certainty) so I make informed decisions | P1 |
| US-7.2 | As a user, I want earnings beat/miss probabilities so I can anticipate quarterly results | P2 |
| US-7.3 | As a user, I want support/resistance levels so I can plan entry/exit points | P1 |

### Module 8 — Ask Quantora (AI Chat)

| ID | Story | Priority |
|----|-------|----------|
| US-8.1 | As a user, I want to ask "Should I buy ITC?" and get holistic analysis (portfolio, news, risk, valuation, goals) | P0 |
| US-8.2 | As a user, I want to ask in Hindi/English/Hinglish so I'm comfortable | P0 |
| US-8.3 | As a user, I want voice input so I can ask questions hands-free | P2 |
| US-8.4 | As a user, I want to upload chart screenshots for analysis | P2 |

### Module 9 — Portfolio Doctor

| ID | Story | Priority |
|----|-------|----------|
| US-9.1 | As a user, I want to upload my portfolio (CSV/Excel/Demat) so I can get instant health check | P0 |
| US-9.2 | As a user, I want a portfolio health score (0-100) so I know overall portfolio quality | P0 |
| US-9.3 | As a user, I want rebalancing suggestions (what to buy/sell/hold) | P1 |
| US-9.4 | As a user, I want dead stock detection so I can exit underperformers | P1 |
| US-9.5 | As a user, I want tax-loss harvesting opportunities so I can optimize taxes | P2 |

### Module 10 — Goal Planner

| ID | Story | Priority |
|----|-------|----------|
| US-10.1 | As a user, I want to set financial goals (retirement, education, house) with target amounts and deadlines | P1 |
| US-10.2 | As a user, I want AI-created investment roadmaps (year-by-year SIP plan) | P1 |
| US-10.3 | As a user, I want probability of achieving goal so I know if I'm on track | P1 |

### Module 11 — Passive Income Engine

| ID | Story | Priority |
|----|-------|----------|
| US-11.1 | As a user, I want to see my monthly passive income (dividends, REITs, bonds) | P2 |
| US-11.2 | As a user, I want tax-efficient income structuring suggestions | P2 |

### Module 12 — Smart Money Tracker

| ID | Story | Priority |
|----|-------|----------|
| US-12.1 | As a user, I want to track FII/DII buying/selling activity | P1 |
| US-12.2 | As a user, I want to track promoter holding changes and pledge levels | P1 |
| US-12.3 | As a user, I want smart money signals (institutional buying = opportunity, selling = risk) | P2 |

### Module 13 — AI Technical Analysis

| ID | Story | Priority |
|----|-------|----------|
| US-13.1 | As a user, I want AI-detected chart patterns (Head & Shoulders, Triangles, etc.) with explanations | P2 |
| US-13.2 | As a user, I want multi-timeframe analysis (daily + weekly + monthly alignment) | P2 |

### Module 14 — Learning Hub

| ID | Story | Priority |
|----|-------|----------|
| US-14.1 | As a user, I want bite-sized financial lessons so I can learn at my own pace | P3 |
| US-14.2 | As a user, I want quizzes and gamification so learning stays engaging | P3 |

### Module 15 — Community

| ID | Story | Priority |
|----|-------|----------|
| US-15.1 | As a user, I want to share investment ideas and discuss stocks | P3 |
| US-15.2 | As a user, I want to follow top performers' model portfolios | P3 |

### Module 16 — AI Research Lab

| ID | Story | Priority |
|----|-------|----------|
| US-16.1 | As a user, I want one-click company research reports (30-50 page AI-generated PDFs) | P2 |
| US-16.2 | As a user, I want AI-analyzed annual reports and earnings transcripts | P2 |

### Module 17 — Compliance & Governance

| ID | Story | Priority |
|----|-------|----------|
| US-17.1 | As a user, I want clear disclaimers that this is not investment advice | P0 |
| US-17.2 | As a user, I want my data protected (DPDP Act compliance) | P0 |

### Module 18 — AI Agent Orchestrator

| ID | Story | Priority |
|----|-------|----------|
| US-18.1 | As a system, I want multi-agent AI (Planner, Risk, News, Portfolio, Tax, Forecast agents) | P2 |

### Module 19 — Notification & Automation

| ID | Story | Priority |
|----|-------|----------|
| US-19.1 | As a user, I want price alerts (target/stop-loss) via Telegram/Email/Push | P1 |
| US-19.2 | As a user, I want daily/weekly portfolio summary reports | P1 |
| US-19.3 | As a user, I want news alerts for my portfolio stocks | P1 |

### Module 20 — Admin & Analytics

| ID | Story | Priority |
|----|-------|----------|
| US-20.1 | As an admin, I want user management (CRUD, roles, permissions) | P3 |
| US-20.2 | As an admin, I want AI usage monitoring (token costs, latency) | P3 |

---

## 3. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | API response < 200ms (p95), AI response < 3s, page load < 2s |
| **Availability** | 99.5% uptime (solo dev, not 99.99%) |
| **Scalability** | Support 50K users, 100K AI queries/day |
| **Security** | JWT + refresh tokens, bcrypt (12 rounds), HTTPS, rate limiting |
| **i18n** | Hindi, English, Hinglish — all labels through API |
| **Accessibility** | WCAG 2.1 AA minimum |
| **Mobile** | Responsive web (no native app in V1) |

---

## 4. Acceptance Criteria Template

For every story, the acceptance criteria follows:

```
Given [context]
When [action]
Then [expected result]

+ Plain-language AI explanation
+ Works in Hindi and English
+ Logged in audit trail
```

---

*This PRD is the single source of truth for all product requirements across all 20 modules.*
