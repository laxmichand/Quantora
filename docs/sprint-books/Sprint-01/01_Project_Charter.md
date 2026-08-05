# Quantora — Project Charter

> **Document ID:** QCH-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Project Overview

**Quantora** is an AI-powered investment intelligence platform for Indian retail investors — providing deep market data, intelligent risk analytics, conversational AI, and proactive portfolio guidance in one unified platform.

**Tagline:** _Intelligent Investing. Simplified._

**Vision:** Democratize institutional-grade financial intelligence for every Indian retail investor.

---

## 2. Problem Statement

Indian retail investors face three core problems:

| Problem                       | Description                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Information Asymmetry**     | Institutional investors have access to premium data, research teams, and analytics tools. Retail investors have scattered, unreliable free tools. |
| **Complexity Barrier**        | Financial data is overwhelming — P/E ratios, VaR, Sharpe ratios, correlation matrices — none explained in plain language.                         |
| **Emotional Decision-Making** | Without systematic tools, retail investors panic-sell, chase momentum, and underperform the market.                                               |

**Result:** 90% of Indian retail investors underperform Nifty 50 over a 5-year period.

---

## 3. Solution Summary

Quantora solves these problems by providing:

1. **Unified Data Layer** — All market data (NSE, BSE, mutual funds, derivatives, macro) in one platform
2. **AI-First Analytics** — Every metric scored, ranked, and _explained_ in plain language (Hindi/English/Hinglish)
3. **Portfolio Intelligence** — Upload portfolio → instant health check, risk analysis, rebalancing suggestions
4. **Conversational AI** — Ask any question ("Should I buy ITC?") and get holistic analysis
5. **Goal-Based Planning** — AI creates investment roadmaps for retirement, education, house purchase
6. **Smart Alerts** — Proactive notifications on opportunities, risks, and portfolio changes

---

## 4. Target Users

| Segment                 | Profile                                                  | Needs                                            |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **Beginner Investors**  | Age 22-35, first-time investors, small capital (₹10K-5L) | Education, simplicity, guidance                  |
| **Active Traders**      | Age 25-45, trades regularly, moderate capital (₹5L-50L)  | Technical analysis, alerts, real-time data       |
| **Long-Term Investors** | Age 30-55, invests for goals, large capital (₹10L-1Cr)   | Goal planning, risk management, tax optimization |
| **HNI Retail**          | Age 35-60, high net worth, ₹50L+ portfolio               | Advanced analytics, research reports, AI agents  |

**Primary Geography:** India (NSE/BSE markets)  
**Primary Language:** Hindi, English, Hinglish

---

## 5. Success Criteria

### Year 1 Targets

| Metric                     | Target  |
| -------------------------- | ------- |
| Registered Users           | 50,000  |
| Monthly Active Users (MAU) | 20,000  |
| Paid Subscribers (Pro)     | 5,000   |
| AI Queries/Day             | 100,000 |
| DAU/MAU Ratio              | > 30%   |
| NPS Score                  | > 50    |
| Monthly Churn Rate         | < 5%    |

### Business Metrics

| Metric                          | Target           |
| ------------------------------- | ---------------- |
| Monthly Recurring Revenue (MRR) | ₹25L by Month 12 |
| Customer Acquisition Cost (CAC) | < ₹500           |
| Lifetime Value (LTV)            | > ₹5,000         |
| LTV/CAC Ratio                   | > 10x            |

---

## 6. Scope

### In Scope (20 Modules)

| #   | Module                    | Phase                       |
| --- | ------------------------- | --------------------------- |
| 1   | Data Foundation Layer     | Phase 1 — Foundation        |
| 2   | AI Stock Intelligence     | Phase 2 — Core Intelligence |
| 3   | Risk Analytics Engine     | Phase 2 — Core Intelligence |
| 4   | Stress Testing            | Phase 5 — Advanced          |
| 5   | News Intelligence         | Phase 3 — Engagement        |
| 6   | Sector Intelligence       | Phase 5 — Advanced          |
| 7   | AI Forecast Engine        | Phase 5 — Advanced          |
| 8   | Ask Quantora (AI Chat)    | Phase 3 — Engagement        |
| 9   | Portfolio Doctor          | Phase 2 — Core Intelligence |
| 10  | Goal Planner              | Phase 4 — Planning          |
| 11  | Passive Income Engine     | Phase 4 — Planning          |
| 12  | Smart Money Tracker       | Phase 5 — Advanced          |
| 13  | AI Technical Analysis     | Phase 5 — Advanced          |
| 14  | Learning Hub              | Phase 6 — Growth            |
| 15  | Community                 | Phase 6 — Growth            |
| 16  | AI Research Lab           | Phase 6 — Growth            |
| 17  | Compliance & Governance   | Phase 7 — Enterprise        |
| 18  | AI Agent Orchestrator     | Phase 7 — Enterprise        |
| 19  | Notification & Automation | Phase 3 — Engagement        |
| 20  | Admin & Analytics         | Phase 7 — Enterprise        |

### Out of Scope

- Mobile apps (native) — web only in V1
- Direct brokerage integration (no order execution)
- Crypto / commodity trading
- International markets (US, etc.)
- Advisory / fiduciary services (disclaimer: not investment advice)

---

## 7. Stakeholders

| Role              | Responsibility                                             |
| ----------------- | ---------------------------------------------------------- |
| **Product Owner** | Laxmichandra (Solo Developer) — Vision, prioritization, UX |
| **Engineering**   | Laxmichandra — Full-stack development, architecture        |
| **Users**         | Indian retail investors                                    |

---

## 8. Timeline

| Phase                       | Modules                                                  | Duration    | Milestone          |
| --------------------------- | -------------------------------------------------------- | ----------- | ------------------ |
| Phase 1 — Foundation        | Data Layer, Auth, Portfolio Upload                       | Month 1-2   | MVP Launch         |
| Phase 2 — Core Intelligence | AI Stock Intelligence, Risk Analytics, Portfolio Doctor  | Month 2-4   | Smart Analytics    |
| Phase 3 — Engagement        | News Intelligence, Ask Quantora, Notifications           | Month 4-6   | User Engagement    |
| Phase 4 — Planning          | Goal Planner, Passive Income Engine                      | Month 6-8   | Financial Planning |
| Phase 5 — Advanced          | Stress Testing, Forecast, Sector, Smart Money, Technical | Month 8-11  | Advanced Analytics |
| Phase 6 — Growth            | Learning Hub, Community, AI Research Lab                 | Month 11-14 | Growth & Retention |
| Phase 7 — Enterprise        | Compliance, Agent Orchestrator, Admin                    | Month 14-16 | Enterprise Ready   |

---

## 9. Key Assumptions

1. Solo developer project — all planning realistic for one person
2. Free tier available — no paywall for basic features
3. Data sources (NSE, BSE, Yahoo Finance) remain accessible
4. LLM APIs (GPT-4, Claude, etc.) available and affordable
5. MongoDB Atlas free/current tier sufficient for initial scale
6. No regulatory blockers for AI-driven financial analytics (non-advisory)

---

## 10. Approvals

| Role          | Name         | Date          | Sign |
| ------------- | ------------ | ------------- | ---- |
| Product Owner | Laxmichandra | July 26, 2026 | —    |

---

_This charter serves as the single source of truth for project scope, goals, and success criteria._
