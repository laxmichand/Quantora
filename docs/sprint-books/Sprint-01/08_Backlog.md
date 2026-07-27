# Quantora — Product Backlog

> **Document ID:** QBL-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Backlog Overview

| Category               | Total | P0 | P1 | P2 | P3 |
|------------------------|-------|----|----|----|-----|
| Data Foundation        |     6 |  3 |  2 |  1 |  0 |
| AI Stock Intelligence  |     6 |  3 |  3 |  0 |  0 |
| Risk Analytics         |     6 |  3 |  3 |  0 |  0 |
| Stress Testing         |     3 |  0 |  1 |  2 |  0 |
| News Intelligence      |     4 |  2 |  2 |  0 |  0 |
| Sector Intelligence    |     3 |  0 |  1 |  2 |  0 |
| AI Forecast Engine     |     3 |  0 |  2 |  1 |  0 |
| Ask Quantora (Chat)    |     4 |  2 |  0 |  2 |  0 |
| Portfolio Doctor       |     5 |  2 |  2 |  1 |  0 |
| Goal Planner           |     3 |  0 |  3 |  0 |  0 |
| Passive Income         |     2 |  0 |  0 |  2 |  0 |
| Smart Money Tracker    |     3 |  0 |  2 |  1 |  0 |
| AI Technical Analysis  |     2 |  0 |  0 |  2 |  0 |
| Learning Hub           |     2 |  0 |  0 |  0 |  2 |
| Community              |     2 |  0 |  0 |  0 |  2 |
| AI Research Lab        |     2 |  0 |  0 |  2 |  0 |
| Compliance             |     2 |  2 |  0 |  0 |  0 |
| AI Agent Orchestrator  |     1 |  0 |  0 |  1 |  0 |
| Notification & Automation |  3 |  0 |  3 |  0 |  0 |
| Admin & Analytics      |     2 |  0 |  0 |  0 |  2 |
| **TOTAL**              |  **61** | **17** | **24** | **16** | **6** |

---

## 2. Priority Definitions

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Must-have for MVP. Blocking. | Phase 1-2 (Month 1-4) |
| **P1** | Important. Core value. | Phase 2-3 (Month 2-6) |
| **P2** | Nice to have. Adds value. | Phase 4-5 (Month 6-11) |
| **P3** | Future. Growth/retention. | Phase 6-7 (Month 11-16) |

---

## 3. Sprint Backlog (Sprint 1 — Foundation)

**Sprint Goal:** Monorepo running locally with Docker. Every service healthy. CI passing.

| # | Task | Priority | Estimate | Status |
|---|------|----------|----------|--------|
| 1.1 | Monorepo setup (Turborepo, workspaces) | P0 | 2h | ✅ Done |
| 1.2 | Docker Compose (PostgreSQL, Redis) | P0 | 2h | ✅ Done |
| 1.3 | NestJS app skeleton + health check | P0 | 3h | ✅ Done |
| 1.4 | Prisma setup + initial schema | P0 | 2h | ✅ Done |
| 1.5 | FastAPI skeleton + health check | P0 | 2h | ✅ Done |
| 1.6 | Angular skeleton + Material | P0 | 3h | ✅ Done |
| 1.7 | Nginx reverse proxy | P1 | 2h | ✅ Done |
| 1.8 | Swagger setup | P1 | 1h | ✅ Done |
| 1.9 | Logging (Winston/Pino) | P1 | 2h | ✅ Done |
| 1.10 | Health checks for all services | P1 | 1h | ✅ Done |
| 1.11 | Seed infrastructure | P1 | 2h | ✅ Done |
| 1.12 | CI pipeline (GitHub Actions) | P1 | 2h | ✅ Done |
| 1.13 | Prettier + ESLint (root config) | P1 | 1h | ✅ Done |
| 1.14 | Husky + Commitlint | P2 | 1h | ✅ Done |

**Sprint 1 Total Estimate:** ~26 hours

---

## 4. Sprint Backlog (Sprint 2 — Identity & Security)

**Sprint Goal:** User registers, logs in, gets JWT. RBAC works. Audit trail active.

| # | Task | Priority | Estimate | Status |
|---|------|----------|----------|--------|
| 2.1 | User registration (bcrypt, validation) | P0 | 4h | ⬜ Todo |
| 2.2 | User login (JWT + refresh token) | P0 | 4h | ⬜ Todo |
| 2.3 | JWT strategy + guards | P0 | 3h | ⬜ Todo |
| 2.4 | RBAC (user, pro, admin roles) | P0 | 3h | ⬜ Todo |
| 2.5 | Profile management (GET/PUT /me) | P1 | 2h | ⬜ Todo |
| 2.6 | Password reset flow | P1 | 3h | ⬜ Todo |
| 2.7 | Audit logging middleware | P1 | 2h | ⬜ Todo |
| 2.8 | Rate limiting per user tier | P1 | 2h | ⬜ Todo |
| 2.9 | Auth E2E tests | P1 | 3h | ⬜ Todo |
| 2.10 | Login/Register Angular components | P1 | 4h | ⬜ Todo |

**Sprint 2 Total Estimate:** ~30 hours

---

## 5. Sprint Backlog (Sprint 3 — Stock Data)

**Sprint Goal:** View live stock prices and historical data. Stock list and detail pages work.

| # | Task | Priority | Estimate | Status |
|---|------|----------|----------|--------|
| 3.1 | Stock data fetcher (yfinance, NSE APIs) | P0 | 6h | ⬜ Todo |
| 3.2 | Stock data API endpoints (CRUD) | P0 | 4h | ⬜ Todo |
| 3.3 | Redis caching for live prices | P0 | 3h | ⬜ Todo |
| 3.4 | Stock list page (Angular) | P0 | 4h | ⬜ Todo |
| 3.5 | Stock detail page (Angular) | P0 | 5h | ⬜ Todo |
| 3.6 | Historical price API | P1 | 3h | ⬜ Todo |
| 3.7 | Price charts (TradingView lightweight) | P1 | 4h | ⬜ Todo |
| 3.8 | Stock search with autocomplete | P1 | 3h | ⬜ Todo |
| 3.9 | Data scheduler (APScheduler) | P1 | 3h | ⬜ Todo |
| 3.10 | Stock data E2E tests | P1 | 3h | ⬜ Todo |

**Sprint 3 Total Estimate:** ~38 hours

---

## 6. Full Sprint Plan Summary

| Sprint | Goal | Duration | Stories |
|--------|------|----------|---------|
| **Sprint 1** | Engineering Foundation | 2-3 days | 14 tasks |
| **Sprint 2** | Identity & Security | 3-4 days | 10 stories |
| **Sprint 3** | Stock Data Layer | 4-5 days | 10 stories |
| **Sprint 4** | Portfolio Management | 4-5 days | 10 stories |
| **Sprint 5** | AI Stock Intelligence | 5-6 days | 10 stories |
| **Sprint 6** | Risk Analytics | 4-5 days | 10 stories |
| **Sprint 7** | News Intelligence | 4-5 days | 10 stories |
| **Sprint 8** | AI Chat (Ask Quantora) | 5-6 days | 10 stories |
| **Sprint 9** | Goal Planner + Passive Income | 4-5 days | 10 stories |
| **Sprint 10** | Stress Testing + Forecasting | 5-6 days | 10 stories |
| **Sprint 11** | Smart Money + Technical Analysis | 4-5 days | 10 stories |
| **Sprint 12** | Learning + Community + Polish | 5-6 days | 10 stories |

---

## 7. Backlog Grooming Rules

1. **Weekly:** Review and re-prioritize P0/P1 stories
2. **Before each sprint:** Finalize sprint backlog, estimate, assign
3. **During sprint:** New stories go to backlog, not current sprint
4. **Emergency:** P0 bugs can be added to current sprint

---

*This backlog is a living document. Update as priorities change.*
