# Quantora REST API Documentation

> **Version**: 0.4.3 | **Base URL**: `http://localhost:3000/api` | **Swagger**: `http://localhost:3000/api/docs`

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Common Response Format](#common-response-format)
- [Status Codes](#status-codes)
- [Health Endpoints](#health-endpoints)
- [Auth Endpoints](#auth-endpoints)
- [User Preference Endpoints](#user-preference-endpoints)
- [Session Endpoints](#session-endpoints)
- [Device Endpoints](#device-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Scaffolded Endpoints (Not Implemented)](#scaffolded-endpoints-not-implemented)
- [Data Models](#data-models)
- [Endpoint Summary](#endpoint-summary)

---

## Overview

Quantora is an intelligent investing platform. All endpoints are prefixed with `/api` via NestJS global prefix configuration (`app.setGlobalPrefix('api')`).

### CORS

The API allows requests from:

| Origin                                  | Purpose             |
| --------------------------------------- | ------------------- |
| `http://localhost:4200`                 | Local Angular dev   |
| `http://localhost:80`                   | Local Docker        |
| `https://quantora.vercel.app`           | Production frontend |
| `https://quantora-web.vercel.app`       | Staging frontend    |
| `https://quantora-ih3a.onrender.com`    | Render deployment   |

> The live frontend `https://quantora-web-angular.vercel.app` is **not** yet in the allowlist (`apps/api-nest/src/main.ts`); add it there if cross-origin browser calls are needed (same-origin `/api` rewrites via `vercel.json` work without it).

> Note: if you add a new frontend origin (e.g. a Vercel preview), add it to the allowlist in `apps/api-nest/src/main.ts` or requests will be rejected.

### Rate Limiting

Rate limiting **is enforced**. A custom in-memory `ThrottlerGuard` is registered as a global `APP_GUARD`:

- Default: `60` requests / `60` seconds per IP.
- Auth endpoints (`login`, `login/mfa`, `register`, `refresh`, `forgot-password`, `reset-password`, `google`) are **always throttled** even when the controller is `@Public()`.
- Excess requests return `429 Too Many Requests`.
- Per-endpoint tuning via `@Throttle()` / configurable `THROTTLE_WINDOW_MS` / `THROTTLE_MAX` env vars.

---

## Authentication

### Cookies (primary) + Bearer (fallback)

Protected endpoints are authenticated with two HttpOnly cookies set on login:

| Cookie | Type     | Path        | Max-Age | Attributes                                 |
| ------ | -------- | ----------- | ------- | ------------------------------------------ |
| `_qta` | Access   | `/`         | 15 min  | `HttpOnly; SameSite=Strict` (`Secure` in prod) |
| `_qtr` | Refresh  | `/api/auth` | 7 days  | `HttpOnly; SameSite=Strict` (`Secure` in prod) |

The JWT strategy reads `_qta` from the cookie first, then falls back to an `Authorization: Bearer <token>` header. The refresh token is read from the `_qtr` cookie (path-restricted to `/api/auth`).

### Token design

- **Access token** (15 min): `{ sub, email, role, jti, sid, did, type: 'access' }`.
- **Refresh token** (7 days, `REFRESH_TOKEN_EXPIRY_DAYS`): `{ ..., jti, sid, did, family, type: 'refresh' }`.
- Refresh tokens are **rotated** on every `POST /api/auth/refresh`; the old token is stored as a SHA-256 hash on the session and **reuse of a rotated token revokes the session** (`token_reuse`).
- **Session binding**: access tokens are bound to a `Session` row via `sid`; revoking a session immediately invalidates its tokens regardless of remaining JWT lifetime.
- **Concurrent sessions**: `MAX_ACTIVE_SESSIONS = 2`; a new login evicts the oldest active session (`session_limit_exceeded`).
- **Blacklisting**: Redis stores revoked `jti`s; if Redis is down the system degrades gracefully (Postgres sessions remain the source of truth).

### Refresh flow

```
1. User logs in  → server sets _qta + _qtr cookies
2. Access expires → POST /api/auth/refresh with _qtr cookie → new _qta/_qtr
3. Refresh expires → user must log in again
```

### Account lockout

5 failed login attempts lock the account for 15 minutes (`lockedUntil`).

### MFA (TOTP)

Optional Google-Authenticator-style TOTP. Flow: login → `POST /api/auth/login/mfa` → `POST /api/auth/mfa/setup` → `POST /api/auth/mfa/verify` → `POST /api/auth/mfa/disable`. When MFA is enabled, `POST /api/auth/login` returns an `mfaRequired` response instead of tokens.

---

## Common Response Format

### Success

```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Status Codes

| Code  | Meaning                              |
| ----- | ------------------------------------ |
| `200` | OK — Request succeeded               |
| `201` | Created — Resource created           |
| `204` | No Content — Delete succeeded        |
| `400` | Bad Request — Invalid input          |
| `401` | Unauthorized — Missing/invalid token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource does not exist  |
| `409` | Conflict — Duplicate resource        |
| `422` | Unprocessable — Validation error     |
| `429` | Too Many Requests — Rate limited     |
| `500` | Internal Server Error                |

---

## Health Endpoints

### GET /api

**Sprint Status**: Implemented (Sprint 1)
**Auth**: Public

Returns basic service status.

**Response 200**:

```json
{
  "name": "Quantora Backend",
  "version": "0.0.1",
  "status": "running",
  "timestamp": "2026-07-27T10:00:00.000Z"
}
```

---

### GET /api/health

**Sprint Status**: Implemented (Sprint 1)
**Auth**: Public

Health check endpoint (`@nestjs/terminus`). Verifies database connectivity via Prisma.

**Response 200**:

```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } },
  "error": {},
  "details": { "database": { "status": "up" } }
}
```

**Response 503** (database down): `status: "error"` with `details.database.status: "down"`.

---

## Auth Endpoints

> All implemented (Sprints 2–4).

### POST /api/auth/register

**Auth**: Public

Register a new user account. Returns the user; auth cookies are **not** set by register — the user should log in next.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "name": "John Doe",
  "phone": "+91-9876543210"
}
```

**Request Fields**:

| Field      | Type   | Required | Constraints                                                |
| ---------- | ------ | -------- | ---------------------------------------------------------- |
| `email`    | string | Yes      | Valid email format                                         |
| `password` | string | Yes      | Min 8 chars, uppercase + lowercase + number                |
| `name`     | string | Yes      | Min 2 characters                                           |
| `phone`    | string | No       | —                                                          |

**Response 201**:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2026-07-27T10:00:00.000Z"
  }
}
```

**Response 409** (email exists): `{ "statusCode": 409, "message": "Email already registered" }`

---

### POST /api/auth/login

**Auth**: Public (throttled)

Authenticate with email + password. Sets `_qta` and `_qtr` cookies. Enforces account lockout, device fingerprinting, risk engine, and MFA challenge.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "deviceId": "optional-client-device-id",
  "fingerprint": { "browser": "chrome", "os": "macos" },
  "timezone": "Asia/Kolkata"
}
```

**Response 200** (no MFA):

```json
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "user", "name": "John Doe" },
  "requiresMfa": false
}
```

**Response 200** (MFA required — no tokens yet):

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "requiresMfa": true,
  "mfaToken": "challenge-token"
}
```

**Response 401** (invalid credentials / locked / unverified email): appropriate message.

---

### POST /api/auth/login/mfa

**Auth**: Public (throttled)

Complete login when MFA is enabled. Verifies the TOTP code against the challenge returned by login.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "mfaCode": "123456"
}
```

**Response 200**: sets `_qta`/`_qtr` cookies, returns the user.

---

### POST /api/auth/refresh

**Auth**: Public (throttled) — requires `_qtr` cookie

Rotates the refresh token and returns a new token pair as cookies. A reused (already-rotated) refresh token revokes the session.

**Response 200**: new `_qta` + `_qtr` cookies; empty body or minimal payload.

**Response 401** (missing/expired/invalid refresh token).

---

### POST /api/auth/logout

**Auth**: Protected

Invalidates the current session, clears `_qta`/`_qtr`/`refreshToken` cookies.

**Response 200**:

```json
{ "success": true }
```

---

### GET /api/auth/me

**Auth**: Protected

Return the currently authenticated user's profile.

**Response 200**:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "role": "user",
  "isActive": true,
  "isEmailVerified": true,
  "mfaEnabled": false,
  "provider": "local",
  "createdAt": "2026-07-27T10:00:00.000Z",
  "updatedAt": "2026-07-27T10:00:00.000Z"
}
```

---

### GET /api/auth/verify-email/:token

**Auth**: Public

Verify the email address using the token sent by `register`.

**Response 200**: `{ "success": true }`

---

### POST /api/auth/forgot-password

**Auth**: Public (throttled)

Send a password reset email.

**Request Body**: `{ "email": "user@example.com" }`

**Response 200**: `{ "success": true }`

---

### PATCH /api/auth/reset-password

**Auth**: Public (throttled)

Reset password using the token from email.

**Request Body**:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ss2"
}
```

**Response 200**: `{ "success": true }`

---

### GET /api/auth/google

**Auth**: Public (throttled)

Redirect to Google OAuth consent. (Disabled gracefully if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are not configured.)

### GET /api/auth/google/callback

**Auth**: Public

Google OAuth callback — finds/creates the user, sets auth cookies, redirects to `FRONTEND_URL`.

---

### MFA endpoints

| Method | URL                       | Auth      | Description                                             |
| ------ | ------------------------- | --------- | ------------------------------------------------------- |
| `POST` | `/api/auth/mfa/setup`     | Protected | Generate TOTP secret + QR code (data URL) + backup codes |
| `POST` | `/api/auth/mfa/verify`    | Protected | Activate MFA after confirming a TOTP code               |
| `POST` | `/api/auth/mfa/disable`   | Protected | Disable MFA after confirming a TOTP code                |

---

### POST /api/auth/login-history

**Auth**: Protected

Return recent login attempts for the current user (IP, device, geo, success, MFA status, risk).

**Response 200**: array of `LoginHistory` records.

---

### GET /api/auth/security-events

**Auth**: Protected

Return the user's security-alert timeline.

### POST /api/auth/security-events/:id/acknowledge

**Auth**: Protected

Acknowledge a security event. **Response 200**: `{ "success": true }`.

---

## User Preference Endpoints

### GET /api/user/preferences

**Auth**: Protected

Return the current user's preferences (auto-created on register if missing).

**Response 200**:

```json
{
  "language": "en",
  "theme": "slate",
  "dateFormat": "DD/MM/YYYY",
  "numberFormat": "indian",
  "timezone": "Asia/Kolkata",
  "defaultExchange": "NSE",
  "riskTolerance": "moderate",
  "investmentStyle": "long_term",
  "sidebarCollapsed": false,
  "defaultView": "dashboard",
  "notificationsEmail": true,
  "notificationsPush": true,
  "notificationsSms": false,
  "notifyPriceAlerts": true,
  "notifyPortfolio": true,
  "notifyNews": false,
  "notifyAiInsights": true,
  "stockListColumns": null,
  "dashboardLayout": null
}
```

### PATCH /api/user/preferences

**Auth**: Protected

Update any supported preference key (language, theme, dateFormat, timezone, notification flags, exchange, riskTolerance, sidebarCollapsed, defaultView, stockListColumns, dashboardLayout, …). Returns the updated preferences.

---

## Session Endpoints

All protected. Sessions power the Security Center.

| Method | URL                          | Description                                      |
| ------ | ---------------------------- | ------------------------------------------------ |
| `GET`  | `/api/sessions`              | List the current user's active sessions          |
| `GET`  | `/api/sessions/current`      | Current session details (with device metadata)   |
| `POST` | `/api/sessions/logout`       | Log out the current session                      |
| `POST` | `/api/sessions/logout-all`   | Revoke all sessions (log out everywhere)         |
| `POST` | `/api/sessions/logout-others`| Revoke all sessions except the current one       |
| `POST` | `/api/sessions/logout-device`| Revoke sessions for a given device               |
| `POST` | `/api/sessions/:id/logout`   | Revoke a specific session by id                  |

**Session fields**: id, current, device, ipAddress/country/city (masked), userAgent, browser/OS, loginTime, lastActivity, isTrusted, trustedUntil.

---

## Device Endpoints

### POST /api/devices/register

**Auth**: Public (path allowlist)

Register a device fingerprint before/at login. The server enriches it with geo/network info.

### Protected

| Method   | URL                      | Description                              |
| -------- | ------------------------ | ---------------------------------------- |
| `GET`    | `/api/devices`           | List the current user's devices          |
| `GET`    | `/api/devices/current`   | Current device details                   |
| `GET`    | `/api/devices/:id`       | Device details                           |
| `PATCH`  | `/api/devices/:id/trust` | Trust/untrust a device (with window)     |
| `PATCH`  | `/api/devices/:id/rename`| Rename a device                          |
| `DELETE` | `/api/devices/:id`       | Remove a device (revokes its sessions)   |

---

## Admin Endpoints

`@Roles('admin')` — require an admin-role account.

| Method   | URL                             | Description                               |
| -------- | ------------------------------- | ----------------------------------------- |
| `GET`    | `/api/admin/sessions`           | All active sessions across users          |
| `GET`    | `/api/admin/devices`            | All devices across users                  |
| `GET`    | `/api/admin/audit-logs`         | Audit log trail                           |
| `GET`    | `/api/admin/users/:userId`      | User details                              |
| `POST`   | `/api/admin/users/:userId/force-logout` | Revoke all sessions for a user     |
| `POST`   | `/api/admin/devices/:deviceId/block`    | Block a device (status=blocked)    |
| `POST`   | `/api/admin/ips/:ip/block`      | Block an IP (currently logged; Redis/dedicated table TODO) |

---

## Scaffolded Endpoints (Not Implemented)

The following controllers exist but have **no route handlers** and are **not wired** into `AppModule`. They are scaffolding for future sprints:

| Area    | Planned endpoints                                   | Sprint |
| ------- | --------------------------------------------------- | ------ |
| Users   | `GET/PATCH/DELETE /api/users`, `/api/users/:id`     | —      |
| Stocks  | `GET /api/stocks`, `GET /api/stocks/:symbol`, …     | 4      |
| Portfolio | `/api/portfolios*`, `/api/portfolios/:id/holdings*` | 5      |
| Payments | `POST /api/payments/create-order`, `/verify`, `/history` | 17 |
| AI      | `POST /api/chat`, `/api/chat/history`, `/api/scores/stock`, `/api/scores/portfolio` | 6, 8 |

> The FastAPI AI service (`apps/ai-fastapi`) currently only exposes `GET /`, `GET /health`, and `GET /api/v1/status`. All AI endpoints (analysis, chat, risk, news, forecast, screener) and the frontend's `/ai/*` proxy target are **not yet implemented**.

---

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "string (unique)",
  "name": "string",
  "phone": "string | null",
  "role": "user | pro | admin",
  "isActive": true,
  "isEmailVerified": true,
  "provider": "local | google",
  "mfaEnabled": false,
  "failedLoginAttempts": 0,
  "lockedUntil": "datetime | null",
  "lastLoginAt": "datetime | null",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

> Note: `language` no longer lives on `User` — it is stored in `UserPreference`.

### Device

```json
{
  "id": "uuid",
  "deviceId": "string (unique)",
  "fingerprintHash": "string",
  "browser": "string | null",
  "os": "string | null",
  "timezone": "string | null",
  "country": "string | null",
  "city": "string | null",
  "publicIp": "string | null",
  "vpn": false,
  "proxy": false,
  "tor": false,
  "trustedDevice": false,
  "trustedUntil": "datetime | null",
  "riskScore": 0,
  "riskLevel": "low | medium | high | critical",
  "loginCount": 0,
  "status": "active | blocked"
}
```

### Session

```json
{
  "id": "uuid",
  "sessionToken": "string (unique)",
  "accessTokenId": "string (unique)",
  "refreshTokenId": "string (unique)",
  "revoked": false,
  "revokedBy": "string | null",
  "logoutReason": "string | null",
  "loginTime": "datetime",
  "lastActivity": "datetime",
  "expiresAt": "datetime",
  "idleTimeout": "number",
  "absoluteTimeout": "number",
  "ipAddress": "string | null",
  "country": "string | null",
  "userAgent": "string | null",
  "deviceId": "string | null"
}
```

### LoginHistory

```json
{
  "id": "uuid",
  "email": "string",
  "success": true,
  "provider": "local | google",
  "failureReason": "string | null",
  "mfaMethod": "string | null",
  "mfaSuccess": "boolean | null",
  "ipAddress": "string | null",
  "userAgent": "string | null",
  "device": "string | null",
  "country": "string | null",
  "isp": "string | null",
  "vpn": false,
  "proxy": false,
  "tor": false,
  "isNewDevice": false,
  "riskScore": 0,
  "riskLevel": "low | medium | high | critical",
  "riskFactors": [],
  "sessionId": "string | null",
  "createdAt": "datetime"
}
```

### UserPreference

```json
{
  "userId": "uuid (unique)",
  "language": "en | hi",
  "theme": "slate | light | dark | indigo | emerald | rose",
  "dateFormat": "DD/MM/YYYY",
  "numberFormat": "indian",
  "timezone": "Asia/Kolkata",
  "defaultExchange": "NSE",
  "riskTolerance": "conservative | moderate | aggressive",
  "investmentStyle": "long_term",
  "sidebarCollapsed": false,
  "defaultView": "dashboard",
  "notifyPriceAlerts": true,
  "notifyPortfolio": true,
  "notifyNews": false,
  "notifyAiInsights": true
}
```

### Portfolio / Holding / Goal / Subscription / Alert / Watchlist / AuditLog

Defined in the Prisma schema (`apps/api-nest/prisma/schema.prisma`). See `docs/DATABASE.md` for the full table inventory.

---

## Endpoint Summary

| Method   | URL                                      | Sprint | Auth      | Status      |
| -------- | ---------------------------------------- | ------ | --------- | ----------- |
| `GET`    | `/api`                                   | 1      | Public    | Implemented |
| `GET`    | `/api/health`                            | 1      | Public    | Implemented |
| `POST`   | `/api/auth/register`                     | 2      | Public    | Implemented |
| `POST`   | `/api/auth/login`                        | 2      | Public    | Implemented |
| `POST`   | `/api/auth/login/mfa`                    | 4/8    | Public    | Implemented |
| `POST`   | `/api/auth/refresh`                      | 2      | Public    | Implemented |
| `POST`   | `/api/auth/logout`                       | 2      | Protected | Implemented |
| `GET`    | `/api/auth/me`                           | 2      | Protected | Implemented |
| `GET`    | `/api/auth/verify-email/:token`          | 2      | Public    | Implemented |
| `POST`   | `/api/auth/forgot-password`              | 2      | Public    | Implemented |
| `PATCH`  | `/api/auth/reset-password`               | 2      | Public    | Implemented |
| `GET`    | `/api/auth/google`                       | 3      | Public    | Implemented |
| `GET`    | `/api/auth/google/callback`              | 3      | Public    | Implemented |
| `POST`   | `/api/auth/mfa/setup`                    | 8      | Protected | Implemented |
| `POST`   | `/api/auth/mfa/verify`                   | 8      | Protected | Implemented |
| `POST`   | `/api/auth/mfa/disable`                  | 8      | Protected | Implemented |
| `POST`   | `/api/auth/login-history`                | 3      | Protected | Implemented |
| `GET`    | `/api/auth/security-events`              | 4      | Protected | Implemented |
| `POST`   | `/api/auth/security-events/:id/acknowledge` | 4   | Protected | Implemented |
| `GET`    | `/api/user/preferences`                  | 2      | Protected | Implemented |
| `PATCH`  | `/api/user/preferences`                  | 2      | Protected | Implemented |
| `GET`    | `/api/sessions`                          | 3      | Protected | Implemented |
| `GET`    | `/api/sessions/current`                  | 4      | Protected | Implemented |
| `POST`   | `/api/sessions/logout`                   | 4      | Protected | Implemented |
| `POST`   | `/api/sessions/logout-all`               | 4      | Protected | Implemented |
| `POST`   | `/api/sessions/logout-others`            | 4      | Protected | Implemented |
| `POST`   | `/api/sessions/logout-device`            | 4      | Protected | Implemented |
| `POST`   | `/api/sessions/:id/logout`               | 3      | Protected | Implemented |
| `POST`   | `/api/devices/register`                  | 3      | Public    | Implemented |
| `GET`    | `/api/devices`                           | 4      | Protected | Implemented |
| `GET`    | `/api/devices/current`                   | 4      | Protected | Implemented |
| `GET`    | `/api/devices/:id`                       | 4      | Protected | Implemented |
| `PATCH`  | `/api/devices/:id/trust`                 | 4      | Protected | Implemented |
| `PATCH`  | `/api/devices/:id/rename`                | 4      | Protected | Implemented |
| `DELETE` | `/api/devices/:id`                       | 4      | Protected | Implemented |
| `GET`    | `/api/admin/sessions`                    | 17     | Admin     | Implemented |
| `GET`    | `/api/admin/devices`                     | 17     | Admin     | Implemented |
| `GET`    | `/api/admin/audit-logs`                  | 17     | Admin     | Implemented |
| `GET`    | `/api/admin/users/:userId`               | 17     | Admin     | Implemented |
| `POST`   | `/api/admin/users/:userId/force-logout`  | 17     | Admin     | Implemented |
| `POST`   | `/api/admin/devices/:deviceId/block`     | 17     | Admin     | Implemented |
| `POST`   | `/api/admin/ips/:ip/block`               | 17     | Admin     | Implemented |
| `GET`    | `/api/users`, `/api/users/:id`           | —      | Protected | Scaffolded |
| `GET`    | `/api/stocks`, `/api/stocks/:symbol`     | 4      | Public    | Scaffolded |
| `GET`    | `/api/portfolios*`, `/holdings*`         | 5      | Protected | Scaffolded |
| `POST`   | `/api/payments/*`                        | 17     | Protected | Scaffolded |
| `POST`   | `/api/chat*`, `/api/scores/*`            | 6/8    | Protected | Scaffolded |
