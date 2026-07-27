# Sprint 2 — Product Requirements

> **Document ID:** QPR-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. User Stories

### US-01: Register

**As a** new visitor
**I want to** create an account with email and password
**So that** I can access the platform

**Acceptance Criteria:**
- [x] Email must be valid format
- [x] Password must be 8+ chars with upper, lower, and digit
- [x] Name is required (min 2 chars)
- [x] Duplicate email returns 409 Conflict
- [x] On success: 201 + accessToken, refreshToken, user object
- [x] User preferences auto-created with defaults

**Priority:** P0

### US-02: Login

**As a** registered user
**I want to** login with email and password
**So that** I can access my portfolio

**Acceptance Criteria:**
- [x] Invalid credentials → 401 (no enumeration)
- [x] Unverified email → 403 "Please verify your email"
- [x] Deactivated account → 403 "Account is deactivated"
- [x] Success → 200 + accessToken, refreshToken, user

**Priority:** P0

### US-03: JWT Protected Routes

**As a** logged-in user
**I want to** have my JWT validated on every request
**So that** my data stays secure

**Acceptance Criteria:**
- [x] All routes require JWT by default
- [x] `@Public()` decorator exempts specific routes
- [x] Invalid/expired JWT → 401
- [x] Valid JWT populates `request.user`

**Priority:** P0

### US-04: Token Refresh

**As a** logged-in user
**I want to** get new tokens when my access token expires
**So that** I stay logged in

**Acceptance Criteria:**
- [x] Old refresh token gets revoked (rotation)
- [x] Expired/revoked token → 401
- [x] Success → new accessToken + refreshToken

**Priority:** P0

### US-05: RBAC

**As an** admin
**I want to** restrict endpoints by role
**So that** users can't access admin features

**Acceptance Criteria:**
- [x] `@Roles('admin')` restricts to admin only
- [x] Insufficient role → 403
- [x] No role required → open to authenticated users

**Priority:** P1

### US-06: Email Verification

**As a** registered user
**I want to** verify my email via a link
**So that** I can login

**Acceptance Criteria:**
- [x] Token-based verification link
- [x] Invalid token → 401
- [x] Verified email can login

**Priority:** P1

### US-07: Password Reset

**As a** user who forgot their password
**I want to** reset it via email
**So that** I can regain access

**Acceptance Criteria:**
- [x] Request with email → always 200 (no enumeration)
- [x] Reset with valid token + new password → 200
- [x] All existing refresh tokens revoked on reset

**Priority:** P1

### US-08: User Preferences

**As a** logged-in user
**I want to** view and update my preferences
**So that** I can customize my experience

**Acceptance Criteria:**
- [x] GET `/user/preferences` returns preferences
- [x] PATCH `/user/preferences` updates allowed fields
- [x] Auto-created on registration

**Priority:** P1

### US-09: Audit Trail

**As an** admin
**I want to** see a log of all API calls
**So that** I can investigate issues

**Acceptance Criteria:**
- [x] Every API call recorded to AuditLog table
- [x] Logs: action, entity, IP, user-agent, userId
- [x] Audit failure doesn't crash request

**Priority:** P1

### US-10: Rate Limiting

**As a** developer
**I want to** protect the API from abuse
**So that** the platform stays responsive

**Acceptance Criteria:**
- [x] 60 requests per minute per IP
- [x] Exceeding limit → 429
- [x] In-memory store with periodic cleanup

**Priority:** P1

### US-11: TickerTape Header

**As a** visitor
**I want to** see a professional header with live market data
**So that** I can navigate and see prices

**Acceptance Criteria:**
- [x] Animated scrolling stock ticker
- [x] Search bar with placeholder
- [x] Navigation links + mega dropdown
- [x] Sign Up / Login CTAs when logged out
- [x] Profile dropdown when logged in

**Priority:** P2

### US-12: Dev Tooling

**As a** developer
**I want to** run `make dev` to start everything
**So that** I can start coding quickly

**Acceptance Criteria:**
- [x] `make dev` starts NestJS + Angular + FastAPI
- [x] Clear terminal output with URLs
- [x] Ctrl+C stops all services
- [x] Python version check with graceful skip

**Priority:** P2
