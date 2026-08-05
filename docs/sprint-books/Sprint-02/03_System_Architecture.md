# Sprint 2 — System Architecture

> **Document ID:** QSA-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. Auth Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Angular SPA  │────▶│   NestJS API      │────▶│  PostgreSQL   │
│  (AuthService)│     │   (AuthModule)    │     │  (Prisma)     │
└──────┬───────┘     └────────┬─────────┘     └──────────────┘
       │                      │
       │  POST /auth/register │  bcrypt(password + pepper, 12)
       │  POST /auth/login    │  → create user + preferences
       │  POST /auth/refresh  │  → generateTokens() → JWT (15m) + refresh (7d)
       │  POST /auth/logout   │  → revoke refresh token
       │  GET  /auth/me       │  → JWT guard → user profile
       │                      │
       │  LocalStrategy        │  → email/password validation
       │  JwtStrategy          │  → Bearer token validation
```

## 2. Global Guard Pipeline

```
Request → JwtAuthGuard → RolesGuard → ThrottlerGuard → AuditInterceptor → Controller
               │              │              │                │
               ▼              ▼              ▼                ▼
         JWT validation  Role check    60 req/min/IP     Write AuditLog
```

## 3. Header Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  app-layout (flex column, height: 100vh)                      │
├──────────────────────────────────────────────────────────────┤
│  ticker-strip (height: 30px, dark bg, animated scroll)        │
│  └── ticker-track (CSS animation: tickerScroll 45s infinite)  │
│      └── ticker-item[] (symbol + price + change %)           │
├──────────────────────────────────────────────────────────────┤
│  app-toolbar (height: 54px, white bg, flex)                   │
│  ├── toolbar-logo (logo icon + "Quantora")                    │
│  ├── toolbar-search (pill input with mat-icon)                │
│  ├── toolbar-nav (IN Stocks, ETFs, Mutual Funds, Indices...)  │
│  │   └── more-dropdown (3-col: Invest / Tools / Learn)        │
│  └── toolbar-right (Sign Up / Login or Profile dropdown)      │
├──────────────────────────────────────────────────────────────┤
│  main-content (flex: 1, overflow-y: auto)                     │
│  └── router-outlet                                            │
└──────────────────────────────────────────────────────────────┘
```

## 4. Dev Tooling Architecture

```
make dev
  ├── Check prerequisites (node, python3, docker)
  ├── Install npm deps (if missing)
  ├── Install Python deps in background
  ├── Start NestJS API (port 3000)
  ├── Start Angular (port 4200)
  └── Start FastAPI (port 8000, when deps ready)

Ctrl+C → kill all background processes → exit
```
