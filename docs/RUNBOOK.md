# Quantora — Runbook

> Operational runbook for incident response and common procedures.

---

## Service URLs

| Service    | URL                                           | Health Check                                         |
| ---------- | --------------------------------------------- | ---------------------------------------------------- |
| Frontend   | https://quantora-web-angular.vercel.app       | Open in browser                                      |
| API        | https://quantora-ih3a.onrender.com/api/health | `curl https://quantora-ih3a.onrender.com/api/health` |
| AI Service | https://quantora-ai-633n.onrender.com/health  | `curl https://quantora-ai-633n.onrender.com/health`  |
| Swagger    | https://quantora-ih3a.onrender.com/api/docs   | Open in browser                                      |
| Database   | Supabase Dashboard                            | https://supabase.com/dashboard                       |

---

## Local Development

One command runs the whole stack (NestJS API + Angular frontend, plus FastAPI if your Python is ≤3.12). The database is hosted on Supabase — no local DB or Redis setup is needed.

> **DB connection:** the API connects directly to Supabase on port 5432 (`DATABASE_URL` with `sslmode=require`). The direct connection is ~5x faster per query than the transaction pooler (port 6543). If Supabase is under connection pressure, the pooler URL can be restored from the Supabase dashboard.

```bash
npm start          # start everything, press Ctrl+C to stop
npm run stop       # stop services started by npm start
npm run status     # check what's running
```

Individual pieces:

```bash
npm run dev:api    # NestJS on :3000
npm run dev:web    # Angular on :4200
npm run dev:ai     # FastAPI on :8000
```

**First run only:**

1. `npm install` (auto-run by `npm start` if `node_modules` is missing)
2. `cp .env.example .env`, then fill in real values (database URL, JWT secret, etc.)
3. Seed demo users: `npm run db:seed -w apps/api-nest` (or `cd apps/api-nest && npx prisma db seed`)

**Troubleshooting**

- Ports already in use → `npm run stop`, then `npm start`
- API never becomes healthy → check `apps/api-nest` logs, verify `.env`
- AI service not starting → local Python must be ≤3.12 (`brew install python@3.12`)

---

## Incident Response

### P1: All Services Down

**Symptoms:** Frontend shows error, API health check fails.

**Steps:**

1. Check Render dashboard for service status
2. Check Supabase dashboard for database status
3. Check GitHub Actions for failed deploys
4. If Render is down → wait (free tier cold start ~30s)
5. If database is down → check Supabase status page
6. If code issue → rollback to last working commit

**Escalation:** None (solo founder)

### P2: API Slow (>5s response)

**Symptoms:** Frontend loads slowly, API responses delayed.

**Steps:**

1. Check Render metrics (CPU, memory)
2. Check Supabase query performance
3. Free tier: services spin down after 15min — cold start is normal
4. If persistent: check for N+1 queries, missing indexes
5. Check Redis cache status

### P3: Database Connection Failed

**Symptoms:** API returns 500, health check shows DB disconnected.

**Steps:**

1. Check Supabase dashboard → Database → Connection pool
2. Verify DATABASE_URL in Render env vars
3. Supabase free tier: max 60 connections
4. Check if connection pooler is active (port 6543)
5. If pool exhausted: restart API service on Render

### P4: Vercel Deploy Failed

**Symptoms:** Frontend not updating after push.

**Steps:**

1. Check Vercel dashboard → Deployments
2. Check build logs for errors
3. Common: Angular build failures, missing dependencies
4. Fix and push again

---

## Common Procedures

### Restart API Service (Render)

1. Go to https://dashboard.render.com
2. Select `quantora-ih3a` service
3. Click **Manual Deploy** → **Clear build cache & deploy**
4. Wait ~2-3 min for deployment

### Restart AI Service (Render)

1. Go to https://dashboard.render.com
2. Select `quantora-ai-633n` service
3. Click **Manual Deploy** → **Clear build cache & deploy**
4. Wait ~2-3 min for deployment

### Check Database

1. Go to https://supabase.com/dashboard
2. Select project → Table Editor
3. Check table row counts
4. Check for stuck queries in SQL Editor

### Update Environment Variables

1. Go to Render dashboard → Service → Environment
2. Update variable → Save
3. Service auto-restarts

**Never commit secrets to git.** Always update via dashboard.

### Rollback Code

```bash
# Find the last good commit
git log --oneline -10

# Rollback
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Monitoring

### Daily Checks

- [ ] API health check returns 200
- [ ] AI service health check returns 200
- [ ] Frontend loads in browser
- [ ] No errors in GitHub Actions

### Weekly Checks

- [ ] Review Render logs for errors
- [ ] Check Supabase storage usage
- [ ] Review security scan results
- [ ] Check for dependency updates

---

## Contacts

| Role             | Contact                                |
| ---------------- | -------------------------------------- |
| Solo Founder     | Laxmichandra Dhuvare                   |
| GitHub           | https://github.com/laxmichand/Quantora |
| Render Support   | https://render.com/support             |
| Supabase Support | https://supabase.com/support           |

---

_Last Updated: 2026-07-31_
