# Sprint 3 — Technical Decisions

> **Document ID:** QTD-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## Decision 1: Named Guard Classes vs Inline AuthGuard()

**Context:** Using `@UseGuards(AuthGuard('google'))` inline in the controller.

**Problem:** Inline `AuthGuard('google')` caused route registration to silently fail on Render — all routes after the inline guard (`google`, `google/callback`, `login-history`) were not registered. Named classes (`JwtAuthGuard`, `LocalAuthGuard`) worked fine.

**Decision:** Create `GoogleAuthGuard` class extending `AuthGuard('google')`, matching the pattern of `JwtAuthGuard` and `LocalAuthGuard`.

**Rationale:** `@nestjs/passport` v11 with `passport` v0.7 has compatibility issues with inline `AuthGuard()` calls during NestJS route registration. Named class guards are resolved properly.

**Files:**

- Created: `apps/api-nest/src/auth/guards/google-auth.guard.ts`
- Updated: `apps/api-nest/src/auth/auth.controller.ts`

---

## Decision 2: Single Root .env File

**Context:** Originally had `apps/api-nest/.env` and root `.env` as separate files.

**Problem:** Multiple .env files caused confusion about which was the source of truth. Secrets were duplicated.

**Decision:** Consolidate to a single root `.env` file organized by app sections (COMMON, API, AI SERVICE).

**Rationale:** Simpler to maintain, no secret duplication, single source of truth. `dotenv` loaded in `main.ts` with path resolution to root.

**Files:**

- Deleted: `apps/api-nest/.env`, `apps/api-nest/.env.example`
- Updated: `.env` (root), `.env.example` (root)
- Updated: `apps/api-nest/src/main.ts` (dotenv config)

---

## Decision 3: passport-google-oauth20 Strategy

**Context:** Multiple Google OAuth Passport strategies available.

**Decision:** Use `passport-google-oauth20` v2.0.0 with `@nestjs/passport` v11.

**Rationale:** Most widely used, well-maintained, supports OpenID Connect. Works with NestJS PassportStrategy wrapper. Profile provides email, name, photos.

---

## Decision 4: OAuth Callback Redirect Pattern

**Context:** After Google callback, how to return tokens to frontend.

**Decision:** Backend redirects to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...`.

**Rationale:** Works with SPA architecture. Frontend callback route parses URL params, stores tokens, navigates to dashboard. No server-side session needed.

**Trade-off:** Tokens visible in URL (mitigated by HTTPS in production, tokens are short-lived JWTs).

---

## Decision 5: Account Lockout Configuration

**Context:** How to handle brute-force login attempts.

**Decision:** 5 failed attempts → 15-minute lockout. Counter resets on successful login.

**Rationale:** Standard security practice. 15 minutes is long enough to deter attacks but short enough not to frustrate legitimate users. Counter-based (not sliding window) for simplicity.

**Configuration:** Hardcoded in `auth.service.ts` (could be made configurable via env vars later).

---

## Decision 6: Shared DataTable Component

**Context:** Multiple pages (Stocks, Portfolio, Dashboard) need data tables.

**Decision:** Create a reusable `DataTableComponent` with Angular CDK DragDrop for column reordering.

**Rationale:** DRY principle. Column preferences persisted via `InjectionToken<string>('TABLE_ID')` to localStorage. Supports sorting, filtering, responsive design.

---

## Decision 7: Compact Design System

**Context:** Tables, cards, and UI elements were too spacious.

**Decision:** Reduce padding, font sizes, border-radius across all components.

**Rationale:** More data visible per viewport. Professional financial platform feel. Applied globally via SCSS variables.

**Changes:**

- Table th: 5px 10px / 10px font
- Table td: 5px 10px / 12px font
- Card padding: 14px / border-radius: 10px
- Tab pills: 4px 10px / 11px font
- Change badges: 2px 7px / 10.5px font
