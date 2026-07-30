# Sprint 3 — Repository Structure Changes

> **Document ID:** QRS-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## New Files Added

### Backend (NestJS)

| File | Purpose |
|------|---------|
| `apps/api-nest/src/auth/guards/google-auth.guard.ts` | Named GoogleAuthGuard class |
| `apps/api-nest/src/auth/strategies/google.strategy.ts` | Passport Google OAuth strategy |

### Frontend (Angular)

| File | Purpose |
|------|---------|
| `apps/web-angular/src/app/shared/components/data-table/data-table.component.ts` | Reusable DataTable |
| `apps/web-angular/src/app/shared/components/data-table/data-table.component.html` | DataTable template |
| `apps/web-angular/src/app/shared/components/data-table/data-table.component.scss` | DataTable styles |
| `apps/web-angular/src/assets/favicon.svg` | Q lettermark favicon |

### Root

| File | Purpose |
|------|---------|
| `.env` (root) | Single consolidated env file |

---

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `apps/api-nest/src/auth/auth.controller.ts` | Added Google OAuth endpoints, login-history endpoint, GoogleAuthGuard |
| `apps/api-nest/src/auth/auth.module.ts` | Registered GoogleStrategy |
| `apps/api-nest/src/auth/auth.service.ts` | Added googleLogin(), account lockout, login history, password validation |
| `apps/api-nest/src/auth/auth.service.spec.ts` | Added 4 lockout tests (22 total) |
| `apps/api-nest/src/auth/strategies/google.strategy.ts` | Hardened with configured flag |
| `apps/api-nest/src/main.ts` | Added dotenv config, CORS origins |
| `apps/api-nest/prisma/schema.prisma` | Added provider, providerId, failedLoginAttempts, lockedUntil, LoginHistory, OAuthAccount |
| `apps/api-nest/package.json` | Added passport-google-oauth20, dotenv |

### Frontend

| File | Changes |
|------|---------|
| `apps/web-angular/src/app/core/services/auth.service.ts` | Added googleLogin(), handleOAuthCallback() |
| `apps/web-angular/src/app/features/auth/login/login.component.ts` | Added googleLogin(), handleOAuthCallback in ngOnInit |
| `apps/web-angular/src/app/features/auth/login/login.component.html` | Added Google Sign-In button |
| `apps/web-angular/src/app/features/auth/register/register.component.ts` | Added googleLogin() |
| `apps/web-angular/src/app/features/auth/register/register.component.html` | Added Google Sign-In button |
| `apps/web-angular/src/app/features/auth/auth-routing.module.ts` | Added /auth/callback route |
| `apps/web-angular/src/app/features/landing/landing.component.html` | Full redesign (Ticker Tape UX) |
| `apps/web-angular/src/app/features/landing/landing.component.scss` | Compact design system |
| `apps/web-angular/src/app/features/landing/landing.component.ts` | Scroll reveal animations |
| `apps/web-angular/src/app/features/stocks/stock-list/` | Full IN Stocks page (42 NIFTY 50) |
| `apps/web-angular/src/app/features/portfolio/` | Portfolio overview page |
| `apps/web-angular/src/app/features/dashboard/` | Dashboard redesign |
| `apps/web-angular/src/app/shared/shared.module.ts` | Added DataTable, DragDropModule |
| `apps/web-angular/src/app/app.component.html` | Header nav cleanup |
| `apps/web-angular/src/app/app.component.ts` | Added stocks to nav |
| `apps/web-angular/src/index.html` | Added favicon link |
| `apps/web-angular/src/styles.scss` | Compact design system variables |

### Root / Config

| File | Changes |
|------|---------|
| `.env` | Consolidated all env vars |
| `.env.example` | Full documentation |
| `render.yaml` | Both services, non-sensitive vars only |
| `package.json` | Added dotenv dependency |

---

## Files Deleted

| File | Reason |
|------|--------|
| `apps/api-nest/.env` | Consolidated to root .env |
| `apps/api-nest/.env.example` | Consolidated to root .env.example |
| `apps/api-nest/render.yaml` | Consolidated to root render.yaml |
| `apps/ai-fastapi/render.yaml` | Consolidated to root render.yaml |
