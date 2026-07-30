# Sprint 3 — Google OAuth + Landing Page Redesign + Frontend Foundation

> **Document ID:** QCH-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## 1. Sprint Overview

**Sprint Goal:** Google OAuth login works end-to-end. Account lockout after 5 failed attempts. Login history tracked. Landing page redesigned with professional UX. Frontend pages built (Stocks, Portfolio, Dashboard). Shared DataTable component. Environment consolidated.

**Duration:** July 27-28, 2026
**Status:** Complete

---

## 2. Stakeholders

| Role | Name |
|------|------|
| Developer | Laxmichandra |

---

## 3. Success Criteria

| # | Criterion | Status |
|---|-----------|--------|
| SC-01 | Google OAuth login redirects to Google consent, callback creates/finds user, tokens issued | Complete |
| SC-02 | Account locks after 5 failed login attempts for 15 minutes | Complete |
| SC-03 | Login history tracked (IP, user-agent, success/failure, timestamp) | Complete |
| SC-04 | Refresh token rotation with old token revocation | Complete |
| SC-05 | Landing page has professional Ticker Tape UX with market indices | Complete |
| SC-06 | Landing page shows Quantora AI Score card replacing MarketsMojo | Complete |
| SC-07 | Stocks table with 42 NIFTY 50 stocks on landing page | Complete |
| SC-08 | Mutual Funds section on landing page | Complete |
| SC-09 | Curated Screens section (Stock Screens, Smart Money Deals, MF Screens) | Complete |
| SC-10 | News Spotlight + sidebar on landing page | Complete |
| SC-11 | Features grid (6 cards) on landing page | Complete |
| SC-12 | Popular Stocks and Stats Bar on landing page | Complete |
| SC-13 | IN Stocks page with full NIFTY 50 stock data | Complete |
| SC-14 | Portfolio page with holdings table | Complete |
| SC-15 | Dashboard page redesigned with live data cards | Complete |
| SC-16 | Shared DataTable component with column reordering, preference persistence | Complete |
| SC-17 | Header nav cleaned (3 main items + More dropdown) | Complete |
| SC-18 | Favicon (Q lettermark SVG) | Complete |
| SC-19 | Single root .env file (all apps) | Complete |
| SC-20 | render.yaml cleaned (root only, both services, no secrets) | Complete |
| SC-21 | Google Sign-In button on both login and register pages | Complete |
| SC-22 | Auth callback route (/auth/callback) parses tokens from URL | Complete |
| SC-23 | 22 unit tests passing (including 4 lockout tests) | Complete |
| SC-24 | Compact design system applied app-wide | Complete |

---

## 4. Key Deliverables

| Deliverable | Location |
|-------------|----------|
| Google OAuth strategy | `apps/api-nest/src/auth/strategies/google.strategy.ts` |
| Google Auth Guard | `apps/api-nest/src/auth/guards/google-auth.guard.ts` |
| Google OAuth controller endpoints | `apps/api-nest/src/auth/auth.controller.ts` |
| Google OAuth service logic | `apps/api-nest/src/auth/auth.service.ts` |
| Account lockout logic | `apps/api-nest/src/auth/auth.service.ts` |
| Login history tracking | `apps/api-nest/src/auth/auth.service.ts` |
| Login history endpoint | `apps/api-nest/src/auth/auth.controller.ts` |
| Auth lockout tests | `apps/api-nest/src/auth/auth.service.spec.ts` |
| Auth frontend callback handling | `apps/web-angular/src/app/core/services/auth.service.ts` |
| Google button on login | `apps/web-angular/src/app/features/auth/login/login.component.html` |
| Google button on register | `apps/web-angular/src/app/features/auth/register/register.component.html` |
| Auth callback route | `apps/web-angular/src/app/features/auth/auth-routing.module.ts` |
| Landing page redesign | `apps/web-angular/src/app/features/landing/landing.component.html` |
| Landing page styles | `apps/web-angular/src/app/features/landing/landing.component.scss` |
| Landing page animations | `apps/web-angular/src/app/features/landing/landing.component.ts` |
| IN Stocks page | `apps/web-angular/src/app/features/stocks/stock-list/` |
| Portfolio page | `apps/web-angular/src/app/features/portfolio/portfolio-overview/` |
| Dashboard redesign | `apps/web-angular/src/app/features/dashboard/` |
| Shared DataTable | `apps/web-angular/src/app/shared/components/data-table/` |
| Favicon | `apps/web-angular/src/assets/favicon.svg` |
| Market data service | `apps/web-angular/src/app/core/services/market-data.service.ts` |
| Single .env file | `.env` (root) |
| Prisma schema updates | `apps/api-nest/prisma/schema.prisma` |
