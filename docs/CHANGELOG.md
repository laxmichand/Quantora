# Changelog

All notable changes to Quantora.

---

## [0.4.0] — 2026-07-31

### Sprint 4 — Full Stack Upgrade + Security Center

**Goal:** Upgrade the entire stack (Node 24, Angular 22, NestJS 11, TypeScript 6, Prisma 6) and ship the Security Center plus a one-command local dev workflow.
**Status:** ✅ Complete

### Added

#### Security Center (`/settings/security`)

- Device & session management — list all devices, rename, trust/untrust, revoke individual sessions, log out all other devices / log out everywhere
- Active sessions with current-device detection, masked IP, browser/OS/location metadata
- Trusted devices with auto-expiring trust window
- Login & account history table (logins, failures, token rotation, MFA, password changes)
- Security alerts timeline from the risk engine
- Account risk score + adaptive MFA settings (MFA, biometric, risk-based MFA, new-device alerts, TOR blocking)
- Session policy display (idle timeout, lifetime, refresh rotation, trusted window)
- Loading skeleton with stat placeholders

#### Settings Page

- Restructured to match the Security Center layout: centered (max-width 1160px), page header with title/subtitle and user chip
- Appearance (theme grid) and Language (EN/HI) cards preserved

#### Local Development (one command)

- `npm start` — starts NestJS (:3000) + Angular (:4200) + FastAPI (:8000 when Python ≤3.12)
- `npm run stop` / `npm run status` — stop / check services
- `npm run dev:api` / `dev:web` / `dev:ai` — individual services
- `scripts/dev.sh` rewritten: auto `.env` check/copy, npm install if `node_modules` missing, port pre-checks, health-wait loops
- Database stays hosted (Supabase) — no local DB/Redis needed

#### Stack Upgrade

- Node.js 22 → 24, Angular 19 → 22 (built-in Vite builder), NestJS 10 → 11, TypeScript 5 → 6, Prisma 5 → 6, zone.js 0.15 → 0.16

### Fixed

- **Security Center stuck on loading skeleton** — the component's view is created with `CheckAlways` cleared, so zone change detection never re-checked it after HTTP responses. `ChangeDetectorRef.markForCheck()` is now called in each `loadAll()` callback so the view refreshes when data arrives.

---

## [0.1.0] — 2026-07-27

### Sprint 1 — Engineering Foundation

**Goal:** Monorepo running locally with Docker. Every service healthy. CI passing.
**Status:** ✅ Complete

### Added

#### Monorepo & Tooling

- Turborepo monorepo with `apps/*` and `packages/*` workspaces
- Root `package.json` with shared scripts (`dev`, `build`, `lint`, `test`)
- TypeScript 5.7 base config (`tsconfig.base.json`)
- Prettier + ESLint (shared rules at root)
- Husky pre-commit hooks + Commitlint (conventional commits)
- `lint-staged` for incremental linting on commit

#### NestJS Backend (`apps/api-nest`)

- NestJS 10 application skeleton with health check (`GET /api/health`)
- Prisma ORM 5.22 with PostgreSQL (8 tables: users, stocks, portfolios, holdings, watchlists, ai_scores, alerts, audit_logs)
- Swagger/OpenAPI docs at `/api/docs`
- Structured logging with Winston
- Global pipes (validation), interceptors (transform, logging), filters (exceptions)
- Auth scaffolding (JWT strategy, guards, login/register DTOs)
- Module stubs: stocks, portfolio, users, payments, notifications, AI client
- CORS configured for localhost + Vercel + Render

#### FastAPI AI Service (`apps/ai-fastapi`)

- Python FastAPI application with health check (`GET /health`)
- Endpoints: analysis, chat, forecast, news, risk
- MongoDB integration via Motor (async)
- Redis caching layer
- yfinance + pandas for stock data
- CORS configured for localhost + Vercel + Render

#### Angular Frontend (`apps/web-angular`)

- Angular 19.2 with Angular Material UI
- 6 feature modules: dashboard, stocks, portfolio, ai-chat, passive-income, settings, auth
- Custom CSS variables theming system (4 palettes: Slate, Indigo, Emerald, Rose)
- Theme switcher component with live palette switching
- Collapsible sidebar with tooltips
- Dashboard: stat cards, stock table, AI score badges (all theme-aware)
- Shared components: header, footer, sidebar, loading spinner, risk badge, stock card
- Custom pipes: currency-inr, time-ago, truncate
- Auth layout + main layout routing
- Prebuilt Material theme CSS files

#### Infrastructure

- Docker Compose: PostgreSQL 16, Redis 7 (with health checks)
- Dockerfile (NestJS): `node:22-slim` with OpenSSL for Prisma
- Dockerfile.python (FastAPI): `python:3.11-slim`
- Nginx reverse proxy config
- Seed script for sample data
- Scripts: `setup.sh`, `deploy.sh`, `start-all.sh`, `stop-all.sh`, `seed-data.sh`

#### Deployment (Live)

- NestJS API: https://quantora-ih3a.onrender.com (Render free tier)
- FastAPI AI: https://quantora-ai-633n.onrender.com (Render free tier)
- Angular Frontend: https://quantora-web-angular.vercel.app (Vercel free)
- Database: Supabase PostgreSQL (free tier)
- **Total hosting cost: ₹0/month**

#### CI/CD (GitHub Actions)

- **Lint:** ESLint (API) + TypeScript check (Web)
- **Build:** API + Web production builds
- **Test:** API + AI service tests
- **Security Audit (5 gates):**
  1. `npm audit --audit-level=critical` — fails on critical vulns
  2. `.env` leak detection — no `.env` files in git
  3. Hardcoded secrets scan — MongoDB, PostgreSQL, Redis, Bearer tokens, API keys
  4. `.gitignore` verification — confirms `.env` is gitignored
  5. `render.yaml` audit — no inline secrets

#### Documentation

- Sprint plan (`docs/SPRINT-PLAN.md`) — 10 sprints mapped
- Architecture doc (`docs/ARCHITECTURE.md`)
- Database schema (`docs/DATABASE.md`)
- Product requirements (`docs/PRODUCT.md`)
- API reference (`docs/API.md`)
- Deployment guide (`docs/DEPLOY.md`)
- Enterprise checklists (`docs/templates/ENTERPRISE-CHECKLISTS.md`)
- 34-section sprint template (`docs/templates/SPRINT-TEMPLATE.md`)
- Sprint 1 book: 10 sections + execution report (`docs/sprint-books/Sprint-01/`)
- Security audit findings documented in execution report

### Security

- 0 critical vulnerabilities (tar override for bcrypt build chain)
- 68 high vulns in dev-only deps (webpack, vite, babel, jest) — no production impact
- No secrets in git — verified by automated CI scan
- All credentials via `.env` files (gitignored) or Render dashboard

### Known Issues

- Render free tier spins down after 15 min — first request takes ~30s to wake
- Angular Material MDC CSS variable conflicts — resolved with plain HTML sidebar
- `@angular-eslint/builder` incompatibility with ESLint 9 flat config — web lint uses `tsc --noEmit`

---

## [0.2.0] — 2026-07-28

### Sprint 2 — Identity & Security

**Goal:** User registration, login, email verification, password reset, role-based access control, audit logging.
**Status:** ✅ Complete

### Added

#### Authentication & Authorization

- User registration with bcrypt(12) + pepper hashing
- JWT authentication (access + refresh token rotation)
- RBAC: `user`, `pro`, `admin` roles with `@Roles()` decorator + `RolesGuard`
- Google OAuth 2.0 login (passport + google strategy)
- Email verification flow (token generation + verification endpoint)
- Password reset flow (request + reset with expiry)
- Account lockout: 5 failed attempts = 15 min lockout
- Rate limiting on auth endpoints (ThrottlerModule + custom ThrottlerGuard)
- Login history tracking (`LoginHistory` table with IP, user-agent, success/fail)
- Audit logging middleware (every API request logged)
- User preferences CRUD (`PATCH /api/user/preferences`)

#### Frontend Auth UI

- Login page with email/password + Google OAuth button
- Register page with form validation
- `AuthInterceptor` for automatic token refresh on 401
- Auth state management via `currentUser$` BehaviorSubject
- Route guards (AuthGuard, RoleGuard) for protected pages

#### Testing

- 23 unit tests (auth service, roles guard, app controller)
- 26 E2E tests (auth flows, rate limiting, preferences)
- 4 lockout-specific tests (increment, lock-after-5, reject-when-locked, reset-on-success)

---

## [0.3.0] — 2026-07-29

### Sprint 3 — Google OAuth + Landing Page + Auth Security + Responsive UI

**Goal:** Google OAuth works end-to-end. Landing page redesigned. Auth security hardened (Argon2, HttpOnly cookies, session limits). Responsive mobile layout. All tables unified under reusable `<app-data-table>`.
**Status:** ✅ Complete

### Added

#### Google OAuth & Landing Page

- Google OAuth login (end-to-end with passport + google strategy + callback)
- Account lockout (5 attempts / 15 min) with reset on successful login
- Login history tracking (IP, user-agent, timestamp)
- Redesigned landing page with Ticker Tape UX header
- Quantora AI Score card with score breakdown
- IN Stocks page — 42 NIFTY 50 stocks with search, sort, pagination
- Portfolio page with holdings table
- Dashboard redesign with stat cards
- Shared `<app-data-table>` component with column reordering
- Preference persistence for table column order
- Compact design system (reduced padding, tighter spacing)
- Favicon: custom Q lettermark
- Single root `.env` file — all env vars in one place

#### Auth Security Hardening

- bcrypt → **Argon2id** password hashing (15,000 KB memory, 2 iterations, 1 parallelism)
- **Helmet** security headers (`app.use(helmet())`)
- **HttpOnly** refresh cookies (`sameSite: 'strict'`, `secure: true`, `httpOnly: true`)
- **Always-throttled auth endpoints** — rate-limited even when controller is `@Public()`
- **Device tracking** — `RefreshToken` model extended with `userAgent`, `ipAddress`, `deviceType`
- **Max 2 concurrent sessions** per user — oldest session auto-revoked on new login
- **Sessions API** — `GET /api/auth/sessions` (list) + `DELETE /api/auth/sessions/:id` (revoke)
- **Memory-only access tokens** — stored in class instance, never `localStorage`
- **AuthInterceptor auto-refresh queue** — concurrent 401s share one refresh call
- **Session restore** — `tryRestoreSession()` reads HttpOnly cookie on page load

#### Theme & Preferences Sync

- 6 themes: **slate**, **light**, **dark**, **indigo**, **emerald**, **rose**
- `ThemeService` writes to `PreferencesService` on theme change
- `PreferencesService` calls `PATCH /api/user/preferences` to persist
- Theme auto-loaded from backend on login and app start
- All hardcoded `#hex` colors → CSS variables (profile dropdown, signup btn, ticker strip, scrollbar, login btn hover)

#### Responsive Mobile Layout

- **Hamburger menu** (visible < 768px) toggles off-canvas navigation drawer
- Drawer sections: Markets, Invest, Tools, Learn, Portfolio, Account (20+ nav items)
- **Collapsible search** — icon on mobile, expands full-width on tap
- **Click-based dropdowns** — replaced `mouseenter`/`mouseleave` with `click` + `@HostListener('document:click')`
- **Bottom sheets** — More panel and profile dropdown slide up from bottom on mobile
- **Overlay backdrop** for mobile drawer
- **Responsive padding** — main content: 12–16px phone / 24–28px desktop
- **Ticker strip** — reduced to 24px height on mobile
- **Print styles** — hide toolbars, headers, ticker

#### Unified Data Table

- Landing page `today-stocks` and `mutual-funds` tables → `<app-data-table>`
- Stock-list (40 NIFTY 50 stocks) → `<app-data-table>` with sort, search, pagination
- Dashboard + Portfolio already using `<app-data-table>`
- `data-table.component.scss`: row hover `--accent-light`, header border `--border-light`, letter-spacing 0.3px
- Global table utility CSS classes: `.row-num`, `.stock-name-cell`, `.text-price`, `.text-muted`, `.text-green`/`.text-red`, `.change-badge`, `.pct-badge`, `.cat-badge`, `.risk-badge`, `.sector-tag`, `.fund-name`, `.sip-val`
- ~280 lines duplicated table CSS removed from `landing.scss` and `stock-list.scss`

#### Project Configuration

- `apps/web-angular/src/styles.scss` — responsive breakpoints (1280/1024/768/480 + print), media query mixins
- `apps/web-angular/src/app/app.component.ts` — mobile state, hamburger toggle, click-outside listener
- `apps/web-angular/src/app/core/services/preferences.service.ts` — new service for theme sync
- `apps/web-angular/src/app/core/app-initializer.ts` — calls `preferences.load()` after session restore

#### Testing

- 27/27 backend Jest tests passing (+5 auth security tests)
- 22/22 frontend Karma tests passing (Angular components + services)
- CI checks: Prettier check → Prisma generate → ESLint (backend) → TSC (backend + frontend) → Jest → API build → duplicate config check → commitlint — all green
