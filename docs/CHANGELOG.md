# Changelog

All notable changes to Quantora.

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
