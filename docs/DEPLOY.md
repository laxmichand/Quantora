# Quantora — Deployment Guide

**Total Cost: ₹0/month** (Render free tier + Vercel free + Supabase free)

```
Frontend (Angular)  → Vercel (free)
Backend (NestJS)    → Render (free tier)
AI Service (FastAPI)→ Render (free tier)
Database            → Supabase (free tier)
```

---

## Live URLs

| Service    | URL                                           | Health Check                                         |
| ---------- | --------------------------------------------- | ---------------------------------------------------- |
| Frontend   | https://quantora-web-angular.vercel.app       | Open in browser                                      |
| API        | https://quantora-ih3a.onrender.com/api/health | `curl https://quantora-ih3a.onrender.com/api/health` |
| AI Service | https://quantora-ai-633n.onrender.com/health  | `curl https://quantora-ai-633n.onrender.com/health`  |
| Swagger    | https://quantora-ih3a.onrender.com/api/docs   | Open in browser                                      |

---

## Architecture

```
Browser
   │
   ▼
Vercel (Angular SPA)
   │  /api/*  → rewrites to Render API
   │  /ai/*   → rewrites to Render AI service
   ▼
Render (NestJS API, Docker)          Render (FastAPI AI, Docker)
   │                                        │
   ▼                                        │
Supabase (PostgreSQL via Prisma) ◄──────────┘
```

> Deployment is **CI/CD driven**: `.github/workflows/ci.yml` runs lint → tests → builds → security → SonarCloud → Docker build, then triggers Render (via `RENDER_DEPLOY_HOOK_API` secret) and Vercel (via `VERCEL_TOKEN` secret) deploys on push to `main`.

---

## Prerequisites

1. GitHub account (repo already exists: https://github.com/laxmichand/Quantora)
2. Vercel account (free) — https://vercel.com
3. Render account (free) — https://render.com
4. Supabase account (free) — https://supabase.com (already set up)

---

## Deploying

Deploys are automatic on every push to `main` (Render auto-deploys via the Dockerfile; Vercel auto-deploys the Angular app). For a manual deploy:

### API (Render)

1. Go to https://dashboard.render.com → the `quantora` service
2. **Manual Deploy** → **Clear build cache & deploy**
3. Wait ~2-3 min

### AI Service (Render)

1. Go to https://dashboard.render.com → the `quantora-ai` service
2. **Manual Deploy** → **Clear build cache & deploy**

### Frontend (Vercel)

1. Go to https://vercel.com → the `quantora` project
2. Deployments → latest push → Deploy

---

## Configuration

### Environment Variables

**NestJS API** (Render dashboard → Service → Environment):

```
DATABASE_URL=<Supabase direct connection, port 5432, sslmode=require>
JWT_SECRET=<strong random string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRY_DAYS=7
FRONTEND_URL=https://quantora-web-angular.vercel.app
IPAPI_KEY=<ipintel key, optional>
REDIS_URL=<optional; app degrades gracefully if unset>
NODE_ENV=production
PORT=3000
```

> ⚠️ Do NOT commit secrets to git. `render.yaml` only declares non-secret vars; add real secrets via the dashboard. Never set `DATABASE_URL`/`JWT_SECRET` in `render.yaml`.

**FastAPI AI** (Render dashboard):

```
ENVIRONMENT=production
REDIS_URL=<optional>
```

**Frontend** (Vercel): no secrets required (API proxied via `vercel.json` rewrites).

### CORS

The API allowlist lives in `apps/api-nest/src/main.ts`:

```
http://localhost:4200
http://localhost:80
https://quantora-web.vercel.app
https://quantora.vercel.app
https://quantora-ih3a.onrender.com
```

If you add a new frontend origin (e.g. a Vercel preview deployment), add it here or requests will be rejected.

### Vercel rewrites (`apps/web-angular/vercel.json`)

```json
{
  "src": "/api/(.*)",
  "dest": "https://quantora-ih3a.onrender.com/api/$1"
},
{
  "src": "/ai/(.*)",
  "dest": "https://quantora-ai-633n.onrender.com/ai/$1"
}
```

---

## GitHub Actions — Required Secrets

The `deploy-api` and `deploy-web` jobs skip when these are unset; set them in GitHub → Settings → Secrets to enable auto-deploy:

- `RENDER_DEPLOY_HOOK_API` — Render deploy hook URL for the API service
- `VERCEL_TOKEN` — Vercel token for `npx vercel --prod`
- `SONAR_TOKEN` — SonarCloud token (the `sonarcloud` job is `continue-on-error`)

CI itself (`lint`, `test-api`, `test-web`, `test-ai`, builds, `docker-build`, security scans) needs only `DATABASE_URL`, `JWT_SECRET`, `BCRYPT_PEPPER` — already configured in `.github/workflows/ci.yml`.

---

## Verification

| Check                       | Command/URL                                                           |
| --------------------------- | -------------------------------------------------------------------- |
| API health                  | `curl https://quantora-ih3a.onrender.com/api/health`                 |
| AI health                   | `curl https://quantora-ai-633n.onrender.com/health`                  |
| Swagger                     | https://quantora-ih3a.onrender.com/api/docs                          |
| Frontend                    | https://quantora-web-angular.vercel.app                              |
| CI pipeline                 | GitHub → Actions → latest run on `main`                              |

---

## Free-Tier Notes

- Render services **spin down after 15 min** of inactivity; first request after sleep takes ~30s (cold start).
- Supabase free: 500MB DB, connection limit ~17 (use the direct port-5432 connection to avoid pooler timeouts under load).
- Vercel auto-deploys on every git push; supports custom domains.

---

## Updating the App

```bash
# Make changes
git add .
git commit -m "Update: description"
git push
# CI gate runs → on pass, Render + Vercel auto-deploy
```

---

## Custom Domain (Optional)

- **Vercel**: Project → Settings → Domains → add domain → update DNS.
- **Render**: Service → Settings → Custom Domains → add domain → update DNS.

---

_Live as of 2026-08-01_
