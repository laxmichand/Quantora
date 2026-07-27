# Quantora

**Intelligent Investing. Simplified.**

AI-powered investment intelligence platform for Indian retail investors.

---

## Live Services

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Angular) | https://quantora-web-angular.vercel.app | Live |
| Backend (NestJS) | https://quantora-ih3a.onrender.com/api/health | Live |
| AI Service (FastAPI) | https://quantora-ai-633n.onrender.com/health | Live |
| Swagger Docs | https://quantora-ih3a.onrender.com/api/docs | View |

### Quick Health Check

```bash
# Backend
curl https://quantora-ih3a.onrender.com/api/health

# AI Service
curl https://quantora-ai-633n.onrender.com/health
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19.2 + Angular Material |
| Backend | NestJS 10 + Prisma 5.22 |
| AI Service | Python FastAPI + yfinance |
| Database | Supabase PostgreSQL (free) |
| Cache | Redis |
| CI/CD | GitHub Actions |
| Hosting | Render (free) + Vercel (free) |

---

## Sprint Status

| Sprint | Name | Status |
|--------|------|--------|
| 1 | Engineering Foundation | ✅ Complete |
| 2 | Identity & Security | 🔜 Next |
| 3 | Data Ingestion & Analysis | Planned |
| 4 | AI-Powered Features | Planned |
| 5 | Passive Income & Portfolio | Planned |
| 6 | Premium & Notifications | Planned |
| 7 | Polish & Mobile | Planned |
| 8 | Performance & Load Testing | Planned |
| 9 | Security Hardening | Planned |
| 10 | Launch & Monitoring | Planned |

**Current:** Sprint 1 complete — all services live, CI passing, 5 security gates active.

---

## Monorepo Structure

```
Quantora/
├── apps/
│   ├── api-nest/        # NestJS backend (Prisma, Swagger, Auth scaffolding)
│   ├── ai-fastapi/      # FastAPI AI service (forecast, analysis, risk, chat)
│   └── web-angular/     # Angular 19 frontend (Material UI, 6 feature modules)
├── packages/            # Shared packages
├── infrastructure/      # Nginx config
├── docs/                # Sprint books, templates, architecture
├── scripts/             # Setup, deploy, seed, start/stop
├── Dockerfile           # NestJS Docker build (node:22-slim)
├── Dockerfile.python    # FastAPI Docker build (python:3.11-slim)
└── render.yaml          # Render Blueprint config (secrets via dashboard)
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start all services (Docker for DBs, npm for apps)
docker compose up -d        # PostgreSQL + Redis
npm run dev:api             # NestJS on :3000
npm run dev:web             # Angular on :4200
npm run dev:ai              # FastAPI on :8000
```

---

## CI/CD — 7 GitHub Actions Jobs

| Job | What It Does |
|-----|-------------|
| Lint | ESLint (API) + TypeScript check (Web) |
| Build API | NestJS production build |
| Build Web | Angular production build |
| Test API | NestJS unit tests |
| Test AI Service | FastAPI pytest |
| Security Audit | npm audit + secret scan + .env leak + gitignore + render.yaml |
| CI Summary | Aggregates all results |

---

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for full deployment guide.

**Cost: ₹0/month** (all free tier)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Sprint Plan](docs/SPRINT-PLAN.md) | 10 sprints mapped with architecture |
| [Architecture](docs/ARCHITECTURE.md) | System architecture and C4 diagrams |
| [Database](docs/DATABASE.md) | Schema, migrations, ERD |
| [Product](docs/PRODUCT.md) | PRD, user stories, features |
| [API](docs/API.md) | REST API reference |
| [Deploy](docs/DEPLOY.md) | Deployment guide |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Enterprise Checklists](docs/templates/ENTERPRISE-CHECKLISTS.md) | 7 checklists (security, performance, testing, etc.) |
| [Sprint 1 Book](docs/sprint-books/Sprint-01/) | 10 sections + execution report |

---

*Sprint 1: Engineering Foundation — Complete*
*Last Updated: July 27, 2026*
