# Quantora

**Intelligent Investing. Simplified.**

AI-powered investment intelligence platform for Indian retail investors.

---

## Live Services

| Service              | URL                                           | Status |
| -------------------- | --------------------------------------------- | ------ |
| Frontend (Angular)   | https://quantora-web.vercel.app               | Live   |
| Backend (NestJS)     | https://quantora-ih3a.onrender.com/api/health | Live   |
| AI Service (FastAPI) | https://quantora-ai-633n.onrender.com/health  | Live   |
| Swagger Docs         | https://quantora-ih3a.onrender.com/api/docs   | View   |

### Quick Health Check

```bash
# Backend
curl https://quantora-ih3a.onrender.com/api/health

# AI Service
curl https://quantora-ai-633n.onrender.com/health
```

### Test Credentials (seeded)

| Account | Email                | Password   |
| ------- | -------------------- | ---------- |
| Admin   | `admin@quantora.com` | `admin123` |
| Demo    | `demo@quantora.com`  | `demo123`  |
| Test    | `test@test.com`      | `Test1234` |

Run `npm run db:seed -w apps/api-nest` to seed the database with these users.

---

## Tech Stack

| Layer      | Technology                                                                    |
| ---------- | ----------------------------------------------------------------------------- |
| Frontend   | Angular 22 + Angular Material                                                 |
| Backend    | NestJS 11 + Prisma 6.19                                                       |
| AI Service | Python FastAPI + yfinance                                                     |
| Database   | Supabase PostgreSQL (free)                                                    |
| Cache      | Redis                                                                         |
| Auth       | Google OAuth 2.0 + JWT + HttpOnly Refresh Cookies + Argon2id + Session Limits |
| CI/CD      | GitHub Actions                                                                |
| Hosting    | Render (free) + Vercel (free)                                                 |

---

## Sprint Status

| Sprint | Name                                                        | Status   |
| ------ | ----------------------------------------------------------- | -------- |
| 1      | Engineering Foundation                                      | Complete |
| 2      | Identity & Security                                         | Complete |
| 3      | Google OAuth + Landing Page + Auth Security + Responsive UI | Complete |
| 4      | Full Stack Version Upgrade                                  | Complete |
| 5      | Data Ingestion & Analysis                                   | Next     |
| 6      | Passive Income & Portfolio                                  | Planned  |
| 7      | AI-Powered Features                                         | Planned  |
| 8      | Risk Analytics                                              | Planned  |
| 9      | AI Chat & Agents                                            | Planned  |
| 10     | News Intelligence                                           | Planned  |
| 11     | Forecasts & Research                                        | Planned  |
| 12     | Broker Integrations                                         | Planned  |
| 13     | Screener & Alerts                                           | Planned  |
| 14     | Charting Engine                                             | Planned  |
| 15     | Provider Standardization                                    | Planned  |
| 16     | Community & Learning                                        | Planned  |
| 17     | Premium & Notifications                                     | Planned  |
| 18     | Production Readiness                                        | Planned  |

**Current:** Sprint 4 complete — Full stack version upgrade (Angular 22, NestJS 11, Prisma 6, TypeScript 6, Node 24). Sprint 5 — Data Ingestion & Analysis — up next.

---

## Sprint Achievements

### Sprint 1 — Engineering Foundation

- Monorepo with Turborepo, Docker Compose (Redis)
- NestJS backend with Prisma + Supabase PostgreSQL
- FastAPI AI service scaffold
- Angular 19 frontend with Material UI, 5 theme palettes
- Custom collapsible sidebar, TickerTape header
- CI/CD pipeline (GitHub Actions, 7 jobs)
- Husky + Commitlint, Prettier + ESLint
- 14 files created, all services live

### Sprint 2 — Identity & Security

- User registration + login with bcrypt(12) + pepper
- JWT strategy + refresh token rotation
- RBAC (user, pro, admin roles)
- Email verification + password reset
- Account lockout + rate limiting
- Audit logging (every API call)
- User preferences CRUD
- 23 unit tests + 26 E2E tests
- Auth UI (login/register Angular pages)
- Dev tooling (Makefile, dev.sh)

### Sprint 3 — Google OAuth + Landing Page + Auth Security + Responsive UI

- Google OAuth login (end-to-end)
- Account lockout (5 attempts / 15 min)
- Login history tracking
- Landing page redesign (Ticker Tape UX)
- Quantora AI Score card
- IN Stocks page (42 NIFTY 50 stocks)
- Portfolio page with holdings
- Dashboard redesign
- Shared DataTable (column sorting, search, pagination, reorder, preference persistence)
- Compact design system
- Favicon (Q lettermark)
- Single root .env file

### Sprint 4 — Full Stack Version Upgrade

- Angular 19 → 22 (builder switched to `@angular/build` esbuild/Vite)
- NestJS 10 → 11
- TypeScript 5 → 6
- Prisma 5 → 6
- Node 22 → 24
- CI updated for all version changes (setup-node@v7)
- All 27 backend tests pass, both apps build cleanly
- bcrypt → Argon2id password hashing
- Helmet security headers
- HttpOnly refresh cookies (never accessible from JS)
- Always-throttled auth endpoints (rate-limited even when public)
- Device tracking (user-agent, IP, device type per session)
- Max 2 concurrent sessions per user (oldest auto-revoked)
- Sessions API (list + revoke individual sessions)
- Memory-only access tokens (never localStorage)
- Auto-refresh via AuthInterceptor (401 queue)
- Session restore on page load from cookie

#### Theme & Preferences

- 6 themes (slate, light, dark, indigo, emerald, rose)
- Theme sync with backend UserPreference API
- PreferencesService auto-loads theme on login
- All hardcoded colors → CSS variables (profile, ticker, buttons)

#### Responsive Mobile Layout

- Hamburger menu + off-canvas drawer (20+ nav items)
- Collapsible search (icon → full-width on tap)
- Click-based dropdowns (touch-friendly, replaces hover)
- More panel + profile panel → bottom sheets on mobile
- Responsive padding (12px phone → 28px desktop)
- Print styles (hide header/ticker)

#### Unified Data Table

- Landing page (Today's Stocks + Mutual Funds) → app-data-table
- Stock-list (40 stocks) → app-data-table with sort/search/pagination
- Dashboard + Portfolio already using app-data-table
- Global utility CSS classes (badges, stock-name-cell, sector-tag, etc.)
- 280 lines duplicate table CSS removed

#### Test Results

- 27/27 backend tests passing (+5 auth security tests)
- 22/22 frontend Angular tests passing

---

## Monorepo Structure

```
Quantora/
├── apps/
│   ├── api-nest/        # NestJS backend (Prisma, Swagger, Auth, Google OAuth)
│   ├── ai-fastapi/      # FastAPI AI service (forecast, analysis, risk, chat)
│   └── web-angular/     # Angular 22 frontend (Material UI, 6 feature modules)
├── packages/            # Shared packages
├── infrastructure/      # Nginx config
├── docs/                # Sprint books, templates, architecture
├── scripts/             # Setup, deploy, seed, start/stop
├── Dockerfile           # NestJS Docker build (node:24-slim)
├── Dockerfile.python    # FastAPI Docker build (python:3.11-slim)
├── .env                 # Single env file (all apps, never commit)
└── render.yaml          # Render Blueprint config (secrets via dashboard)
```

---

## Local Development

One command starts the whole stack (NestJS API + Angular frontend, and FastAPI if your Python is ≤3.12). Database is hosted (Supabase), so no local DB setup is needed.

```bash
npm start          # start everything, press Ctrl+C to stop
npm run stop       # stop services started by npm start
npm run status     # check what's running
```

Running individual pieces:

```bash
npm run dev:api    # NestJS on :3000
npm run dev:web    # Angular on :4200
npm run dev:ai     # FastAPI on :8000
```

First run only:

1. `npm install` (automatically handled by `npm start` if missing)
2. `cp .env.example .env`, then fill in real values (database, JWT secret, etc.)

You can log in with any registered account, or seed demo users first:

```bash
npm run db:seed -w apps/api-nest
```

---

## CI/CD — 16 GitHub Actions Jobs

| Job               | What It Does                                                    |
| ----------------- | --------------------------------------------------------------- |
| Lint              | Prettier, ESLint (API), Prisma generate, TypeScript check (API) |
| Test API          | NestJS unit tests (27 tests)                                    |
| Test Web          | Angular Karma unit tests (Jasmine)                              |
| Test AI           | FastAPI pytest                                                  |
| Build API         | NestJS production build                                         |
| Build Web         | Angular production build                                        |
| Build AI          | Python import verification                                      |
| SEO Check         | Lighthouse CI + scripted SEO checks                             |
| Security Audit    | npm audit (critical)                                            |
| Secret Scan       | Gitleaks                                                        |
| CodeQL            | JS/TS security analysis                                         |
| Hardcoded Secrets | Pattern-based secret scan                                       |
| SonarCloud        | Code quality scan                                               |
| Docker Build      | API + AI image build verification                               |
| CI Gate           | Aggregates all results (blocks merge on failure)                |
| Deploy API/Web    | Render + Vercel (main branch only)                              |

---

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for full deployment guide.

**Cost: Rs 0/month** (all free tier)

---

## Documentation

| Doc                                                              | Description                                         |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| [Sprint Plan](docs/SPRINT-PLAN.md)                               | 17 sprints mapped with architecture                 |
| [Architecture](docs/ARCHITECTURE.md)                             | System architecture and C4 diagrams                 |
| [Database](docs/DATABASE.md)                                     | Schema, migrations, ERD                             |
| [Product](docs/PRODUCT.md)                                       | PRD, user stories, features                         |
| [API](docs/API.md)                                               | REST API reference                                  |
| [Deploy](docs/DEPLOY.md)                                         | Deployment guide                                    |
| [Changelog](docs/CHANGELOG.md)                                   | Version history                                     |
| [Enterprise Checklists](docs/templates/ENTERPRISE-CHECKLISTS.md) | 7 checklists (security, performance, testing, etc.) |
| [Sprint 1 Book](docs/sprint-books/Sprint-01/)                    | 11 sections + execution report                      |
| [Sprint 2 Book](docs/sprint-books/Sprint-02/)                    | 12 sections + execution report                      |
| [Sprint 3 Book](docs/sprint-books/Sprint-03/)                    | 11 sections + execution report                      |

---

## Environment Variables

Single `.env` file at root (never commit). See `.env.example` for full documentation.

Key variables:

- `DATABASE_URL` — Supabase PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `OPENAI_API_KEY` — OpenAI API key for AI features

---

_Sprint 1-4: Engineering Foundation + Identity & Security + Google OAuth + Auth Security + Responsive UI + Full Stack Version Upgrade — Complete_
_Last Updated: July 29, 2026_
