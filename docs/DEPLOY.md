# Quantora — Free Deployment Guide

**Total Cost: ₹0/month**

```
Frontend (Angular)  → Vercel (free)
Backend (NestJS)    → Render (free tier)
AI Service (FastAPI)→ Render (free tier)
Database            → Supabase (free tier)
```

---

## Prerequisites

1. GitHub account
2. Vercel account (free) — https://vercel.com
3. Render account (free) — https://render.com
4. Supabase account (free) — https://supabase.com (already set up)

---

## Step 1: Push to GitHub

```bash
cd "/Users/laxmichandra/Study/Code/nest js/Quantora"
git init
git add .
git commit -m "Sprint 1: Engineering Foundation"
git remote add origin https://github.com/YOUR_USERNAME/quantora.git
git push -u origin main
```

---

## Step 2: Deploy NestJS API (Render)

1. Go to https://render.com → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo → Select `quantora` repo
4. Configure:
   - **Name**: `quantora-api`
   - **Root Directory**: (leave empty, Dockerfile is at repo root)
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
5. Add Environment Variables:
   ```
   DATABASE_URL=<your Supabase connection string>
   MONGODB_URL=<your MongoDB Atlas connection string>
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=<generate a strong random string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   ```
   > ⚠️ Do NOT commit secrets to git. Add them directly in the Render dashboard only.
6. Click **Create Web Service**
7. Wait for deployment (~2-3 min)
8. Note the URL: `https://quantora-api.onrender.com`

---

## Step 3: Deploy FastAPI AI Service (Render)

1. Click **New +** → **Web Service**
2. Connect GitHub → Select `quantora` repo
3. Configure:
   - **Name**: `quantora-ai`
   - **Root Directory**: (leave empty)
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile.python`
   - **Plan**: Free
4. Add Environment Variables:
   ```
   MONGODB_URL=<your MongoDB Atlas connection string>
   REDIS_URL=redis://localhost:6379
   ENVIRONMENT=production
   ```
   > ⚠️ Do NOT commit secrets to git. Add them directly in the Render dashboard only.
5. Click **Create Web Service**
6. Note the URL: `https://quantora-ai.onrender.com`

---

## Step 4: Update Vercel Config

Update `apps/web-angular/vercel.json` with your actual Render URLs:

```json
{
  "src": "/api/(.*)",
  "dest": "https://quantora-api.onrender.com/api/$1"
},
{
  "src": "/ai/(.*)",
  "dest": "https://quantora-ai.onrender.com/ai/$1"
}
```

---

## Step 5: Deploy Angular Frontend (Vercel)

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project**
3. Import your `quantora` repo
4. Configure:
   - **Framework Preset**: Angular
   - **Root Directory**: `apps/web-angular`
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist/quantora-frontend/browser`
5. Click **Deploy**
6. Wait for deployment (~1-2 min)
7. Note the URL: `https://quantora.vercel.app`

---

## Step 6: Update CORS with Final URLs

After deployment, update CORS in both services with your actual Vercel URL:

**NestJS** (`apps/api-nest/src/main.ts`):
```typescript
origin: [
  'http://localhost:4200',
  'https://quantora.vercel.app',  // Your actual Vercel URL
],
```

**FastAPI** (`apps/ai-fastapi/main.py`):
```python
allow_origins=[
    "http://localhost:4200",
    "https://quantora.vercel.app",  # Your actual Vercel URL
],
```

Push changes → Both Render services auto-redeploy.

---

## Step 7: Verify

| Service | URL | Health Check |
|---------|-----|-------------|
| Frontend | https://quantora.vercel.app | Open in browser |
| API | https://quantora-api.onrender.com/api/health | Should return JSON |
| AI Service | https://quantora-ai.onrender.com/health | Should return JSON |
| Swagger | https://quantora-api.onrender.com/api/docs | Should show API docs |

---

## Important Notes

### Render Free Tier
- Services **spin down after 15 min** of inactivity
- First request after sleep takes **~30 sec** to wake up
- This is normal for free tier — investors will see a brief loading delay

### Vercel Free Tier
- Generous for frontend hosting
- Auto-deploys on every git push
- Custom domain support

### Supabase Free Tier
- 500MB database storage
- 50,000 monthly active users
- 500MB file storage
- More than enough for demo

---

## Updating the App

```bash
# Make changes
git add .
git commit -m "Update: description"
git push

# Vercel auto-deploys frontend
# Render auto-deploys backend (if autoDeploy: true)
```

---

## Custom Domain (Optional)

### Vercel
1. Go to Project → Settings → Domains
2. Add your domain (e.g., quantora.in)
3. Update DNS records as shown

### Render
1. Go to Service → Settings → Custom Domains
2. Add your domain
3. Update DNS records

---

*Deployment Cost: ₹0/month*
*Last Updated: 2026-07-27*
