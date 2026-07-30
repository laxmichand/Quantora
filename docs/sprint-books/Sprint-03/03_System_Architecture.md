# Sprint 3 — System Architecture

> **Document ID:** QSA-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## 1. Google OAuth Flow

```
User clicks "Google" button
    |
    v
Frontend: window.location.href = '/api/auth/google'
    |
    v
Backend: GET /api/auth/google
    | Passport GoogleAuthGuard initiates OAuth
    | Redirects to accounts.google.com/o/oauth2/v2/auth
    |   ?client_id=GOOGLE_CLIENT_ID
    |   &redirect_uri=GOOGLE_CALLBACK_URL
    |   &scope=email+profile
    |   &response_type=code
    v
Google Consent Screen
    | User selects Google account and approves
    v
Backend: GET /api/auth/google/callback?code=...
    | Passport validates code, fetches profile
    | googleLogin() finds or creates user
    | Creates LoginHistory record
    | Generates JWT + refresh tokens
    v
Backend: Redirect to FRONTEND_URL/auth/callback
    |   ?accessToken=xxx
    |   &refreshToken=xxx
    v
Frontend: /auth/callback route
    | LoginComponent.ngOnInit() calls handleOAuthCallback()
    | Parses URL params, stores tokens in localStorage
    | Navigates to /dashboard
```

---

## 2. Account Lockout Flow

```
User attempts login with wrong password
    |
    v
AuthService.validateUser()
    | Increments failedLoginAttempts
    | If attempts >= 5:
    |   Sets lockedUntil = now + 15 minutes
    |   Throws ForbiddenException("Account locked")
    v
Next login attempt:
    | Checks if lockedUntil > now
    | If locked: throws ForbiddenException
    | If expired: resets counter, allows login
v
On successful login:
    | Resets failedLoginAttempts to 0
    | Clears lockedUntil
```

---

## 3. Login History Tracking

Every login attempt (success or failure) is recorded:

| Field | Source |
|-------|--------|
| userId | Matched user or null (failed) |
| email | User-entered email |
| ip | request.ip |
| userAgent | request.headers['user-agent'] |
| success | true/false |
| provider | 'local' or 'google' |
| createdAt | Auto-timestamp |

Endpoint: `GET /api/auth/login-history?limit=10` (JWT required)

---

## 4. Database Schema Changes (Sprint 3)

### Users Table — New Columns

| Column | Type | Purpose |
|--------|------|---------|
| provider | String | 'local' or 'google' |
| providerId | String? | Google profile ID |
| failedLoginAttempts | Int | Counter for lockout |
| lockedUntil | DateTime? | Lock expiry timestamp |

### New Tables

| Table | Purpose |
|-------|---------|
| LoginHistory | Audit trail for all login attempts |
| OAuthAccount | Links multiple OAuth providers to one user |

---

## 5. Environment Architecture

### Single .env File (Root)

```
Quantora/
├── .env                    # SINGLE source of truth
│   ├── # COMMON            # NODE_ENV, REDIS_URL
│   ├── # API               # PORT, DATABASE_URL, JWT_SECRET, GOOGLE_*
│   └── # AI SERVICE        # MONGODB_URL, OPENAI_API_KEY
```

### How Apps Load It

- **API (NestJS):** `dotenv.config({ path: resolve(process.cwd(), '..', '..', '.env') })`
- **AI (FastAPI):** Reads from environment (set via Render Dashboard)
- **Frontend (Angular):** Uses proxy.conf.json, env vars injected at build time

### Render Dashboard (Secrets Only)

Non-sensitive vars in render.yaml, sensitive secrets set in Render Dashboard:
- DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- MONGODB_URL, OPENAI_API_KEY

---

## 6. Route Architecture

### Auth Routes (All under /api/auth)

| Method | Path | Guard | Auth | Purpose |
|--------|------|-------|------|---------|
| POST | /register | Public | No | Register with email |
| POST | /login | LocalAuthGuard + Public | No | Login with email |
| POST | /refresh | Public | No | Refresh tokens |
| POST | /logout | JwtAuthGuard | Yes | Revoke refresh token |
| GET | /me | JwtAuthGuard | Yes | Get profile |
| GET | /verify-email/:token | Public | No | Verify email |
| POST | /forgot-password | Public | No | Request reset |
| PATCH | /reset-password | Public | No | Reset password |
| GET | /google | GoogleAuthGuard + Public | No | Redirect to Google |
| GET | /google/callback | GoogleAuthGuard + Public | No | Google callback |
| GET | /login-history | JwtAuthGuard | Yes | Login history |
