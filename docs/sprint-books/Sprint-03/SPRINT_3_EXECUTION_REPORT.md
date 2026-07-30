# Sprint 3 — Execution Report

> **Sprint:** 3 — Google OAuth + Landing Page Redesign + Frontend Foundation + Auth Security
> **Date:** July 27-29, 2026
> **Status:** Complete
> **Duration:** 3 days

---

## Sprint Goal

> Google OAuth login works end-to-end. Account lockout active. Login history tracked. Landing page redesigned with professional UX. Frontend pages built (Stocks, Portfolio, Dashboard). Shared DataTable. Environment consolidated. Auth security hardening (Argon2, HttpOnly cookies, device tracking, 2-session limit). Theme sync with preferences. Responsive mobile layout. Unified reusable data-table component.

**Goal Met:** Yes

---

## Tasks Completed (45/45)

### Google OAuth (Backend)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Google OAuth Passport strategy | Done | passport-google-oauth20 v2.0.0 |
| 3.2 | GoogleAuthGuard (named class) | Done | Fixed inline AuthGuard route registration bug |
| 3.3 | GET /api/auth/google (redirect) | Done | Redirects to Google consent screen |
| 3.4 | GET /api/auth/google/callback | Done | Validates code, creates/finds user, issues tokens |

### Google OAuth (Frontend)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.5 | googleLogin() in auth.service.ts | Done | window.location.href redirect |
| 3.6 | Google button on login page | Done | SVG Google logo + "Google" text |
| 3.7 | Google button on register page | Done | Matching login page style |

### Account Security

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.8 | Account lockout (5 attempts / 15 min) | Done | failedLoginAttempts + lockedUntil columns |
| 3.9 | Login history tracking | Done | LoginHistory table + GET /api/auth/login-history |

### Landing Page

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.10 | Ticker Tape market indices strip | Done | NIFTY 50, SENSEX, BANK NIFTY with animated scroll |
| 3.11 | Quantora AI Score card | Done | Replaced MarketsMojo Indicator |
| 3.12 | Stocks table (42 NIFTY 50) | Done | Symbol, price, change, volume, sector |
| 3.13 | Mutual Funds table | Done | Top 20 MFs with returns data |
| 3.14 | Curated Screens (3 columns) | Done | Stock Screens, Smart Money Deals, MF Screens |
| 3.15 | News Spotlight + sidebar | Done | Market news + quick links |
| 3.16 | Features grid (6 cards) | Done | AI Score, Portfolio, Risk, Forecast, Screener, Goals |
| 3.17 | Popular Stocks | Done | Live prices strip |
| 3.18 | Stats Bar | Done | Users, stocks, data points counters |
| 3.19 | CTA + Footer | Done | Call to action + footer links |
| 3.20 | Scroll reveal animations | Done | IntersectionObserver-based |

### Frontend Pages

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.21 | IN Stocks page | Done | Full NIFTY 50 with shared DataTable |
| 3.22 | Portfolio page | Done | Holdings table + allocation |
| 3.23 | Dashboard redesign | Done | Live data cards + charts |

### Shared Components

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.24 | DataTable component | Done | Sorting, filtering, CDK DragDrop column reorder |
| 3.25 | DataTable preferences persistence | Done | InjectionToken + localStorage per table ID |

### Design System

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.26 | Compact table design | Done | 5px 10px th/td, smaller fonts |
| 3.27 | Header nav cleanup | Done | 3 main items + More dropdown |
| 3.28 | Favicon (Q lettermark SVG) | Done | Blue gradient rounded square |

### Infrastructure

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.29 | Single root .env file | Done | Organized by app section |
| 3.30 | .env.example documented | Done | All vars with placeholders |
| 3.31 | render.yaml cleaned | Done | Root only, both services, no secrets |
| 3.32 | Delete duplicate render.yaml files | Done | apps/api-nest/ and apps/ai-fastapi/ removed |
| 3.33 | Delete apps/api-nest/.env files | Done | Consolidated to root |

### Auth Security Hardening (Sprint 3.5)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.35 | bcrypt → Argon2id password hashing | Done | argon2 npm package, secure defaults |
| 3.36 | Helmet security headers | Done | app.use(helmet()) in main.ts |
| 3.37 | HttpOnly refresh cookie | Done | Set-Cookie on login/register/refresh, cleared on logout |
| 3.38 | AlwaysThrottledGuard for auth routes | Done | Auth endpoints rate-limited even when @Public() |
| 3.39 | RefreshToken model extended | Done | userAgent, ipAddress, deviceType columns |
| 3.40 | Max 2 sessions per user | Done | Oldest session auto-revoked on new login |
| 3.41 | Sessions API (GET + DELETE /api/auth/sessions) | Done | List active sessions, revoke by ID |
| 3.42 | Memory-only access token (frontend) | Done | Token stored in class property, never localStorage |
| 3.43 | AuthInterceptor auto-refresh + request queue | Done | 401 triggers refresh, queues concurrent requests |
| 3.44 | Session restore on page load via cookie | Done | tryRestoreSession() in app-initializer |

### Theme & Preferences

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.45 | Indigo/emerald/rose themes in ThemeService | Done | 6 themes total, CSS variables for all |
| 3.46 | PreferencesService (Angular) | Done | GET/PATCH /api/user/preferences, syncs theme to backend |
| 3.47 | Theme auto-load on login | Done | Preferences loaded via currentUser$ subscription |
| 3.48 | hardcoded colors → CSS variables | Done | Profile dropdown, signup btn, ticker strip, scrollbar |

### Responsive Layout

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.49 | Hamburger menu + mobile drawer | Done | Off-canvas slide-out with all nav sections |
| 3.50 | Collapsible search on mobile | Done | Search icon toggles full-width search bar |
| 3.51 | Touch-friendly click-based dropdowns | Done | Replaced mouseenter/mouseleave with click + click-outside |
| 3.52 | More panel + profile dropdown → bottom sheets on mobile | Done | slideUp animation for mobile |
| 3.53 | Responsive main content padding | Done | 12-16px on mobile vs 24-28px desktop |

### Unified Data Table

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.54 | data-table row hover → var(--accent-light) | Done | Matches landing page style |
| 3.55 | Global table utility CSS classes | Done | badges, stock-name-cell, text-muted, sector-tag, etc. |
| 3.56 | Landing page migrated to app-data-table | Done | Today's Stocks + Mutual Funds tables |
| 3.57 | Stock-list migrated to app-data-table | Done | 40 stocks with sort, search, pagination |
| 3.58 | Removed ~280 lines duplicated table CSS | Done | landing.scss + stock-list.scss cleaned |

### Tests

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.59 | Auth lockout tests (4 new) | Done | increment, lock-after-5, reject-when-locked, reset-on-success |

---

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| BE — auth.service.spec.ts | 27 | All pass |
| BE — roles.guard.spec.ts | 4 | All pass |
| BE — app.controller.spec.ts | 3 | All pass |
| FE — Angular Karma | 22 | All pass |

---

## Files Changed

| Category | Files Added | Files Modified | Files Deleted |
|----------|-------------|----------------|---------------|
| Backend | 2 | 11 | 3 |
| Frontend | 5 | 22 | 0 |
| Root/Config | 1 | 4 | 0 |
| **Total** | **8** | **37** | **3** |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Sprint tasks | 45/45 completed |
| Unit tests | 27 backend + 22 frontend = 49 total |
| Auth endpoints | 13 (was 11, +2: sessions list, session delete) |
| Frontend pages | 6 (Landing, Login, Register, Stocks, Portfolio, Dashboard) |
| Shared components | 3 (DataTable, PreferencesService, app-initializer) |
| Design system tokens | 6 (table, card, tab, badge, bar, skeleton) |
| Sprint book files | 11 |
| Files changed | 48 total |
| Themes | 6 (slate, light, dark, indigo, emerald, rose) |
| Responsive breakpoints | 4 (1280, 1024, 768, 480px + print) |
| Password hashing | bcrypt → Argon2id |
| Sessions per user | Limited to 2 (oldest revoked) |
| Mobile drawer items | 20+ (all nav links + account + auth) |

---

## Bugs Found & Fixed

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Google routes 404 on Render | Inline `AuthGuard('google')` in controller caused route registration to silently fail | Created named `GoogleAuthGuard` class |
| Register page Google button not working | Missing `(click)="googleLogin()"` handler | Added handler + method |
| 3 routes missing from Render deploy | Same as #1 — `google`, `google/callback`, `login-history` all after the inline guard | Same fix |

---

## Lessons Learned

1. **Named guard classes over inline AuthGuard()** — `@nestjs/passport` v11 has issues with inline `AuthGuard('strategy')` calls in route decorators. Named classes extending `AuthGuard()` are always safer.
2. **Test on actual deployment environment** — Routes worked locally but failed on Render Docker build. Always verify route logs on production.
3. **Consolidate env files early** — Multiple .env files caused confusion. Single root file with sections is cleaner.
4. **Landing page UX matters** — Ticker Tape pattern is standard in financial platforms. Users expect it.
5. **Shared components save time** — DataTable used in 3+ pages. Investment in reusable component pays off quickly.

---

## What's Ready for Sprint 5

> **Note:** Sprint numbering shifted by +1. Sprint 4 was the Version Upgrade sprint. See `Sprint-04/`.

| Component | Status | Ready For |
|-----------|--------|-----------|
| Google OAuth | Complete | User onboarding flow |
| Account lockout | Complete | Security hardening |
| Login history | Complete | Audit trail |
| Landing page | Complete | Marketing, SEO |
| IN Stocks page | Complete | Live price integration |
| Portfolio page | Complete | CRUD operations |
| Dashboard | Complete | Real-time data |
| DataTable | Complete | Any data display |
| Single .env | Complete | Easy config management |

---

*Sprint 3 completed on July 27-28, 2026.*
