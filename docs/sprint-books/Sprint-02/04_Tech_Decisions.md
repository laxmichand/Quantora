# Sprint 2 — Technology Decisions (ADRs)

> **Document ID:** QTD-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## ADR-004: JWT with Refresh Rotation

**Status:** Accepted
**Date:** July 26, 2026

### Context
Need stateless authentication with ability to revoke sessions.

### Decision
Use short-lived JWT access tokens (15min) + long-lived refresh tokens (7d) stored in DB with rotation.

### Rationale
- 15min window limits damage if access token stolen
- Refresh token stored in DB with `isRevoked` flag enables server-side revocation
- Rotation means old refresh token is invalid after use — prevents replay attacks

### Consequences
- Refresh token table grows with usage — need periodic cleanup
- Requires DB lookup on every refresh (acceptable for authentication scale)

---

## ADR-005: bcrypt(12) + Pepper

**Status:** Accepted
**Date:** July 26, 2026

### Context
Need secure password storage resistant to rainbow table and brute force attacks.

### Decision
Use bcrypt with 12 salt rounds, plus a server-side pepper appended to password before hashing.

### Rationale
- bcrypt(12) takes ~200ms — slow enough to prevent brute force, fast enough for UX
- Pepper (from env var) adds protection if DB is compromised — attacker needs both DB + env
- Salt (embedded in bcrypt hash) prevents rainbow table attacks

### Consequences
- Can't change pepper without invalidating all passwords
- Pepper must be in production environment variables

---

## ADR-006: Custom ThrottlerGuard over @nestjs/throttler

**Status:** Accepted
**Date:** July 26, 2026

### Context
Need rate limiting for API protection.

### Decision
Build a custom in-memory ThrottlerGuard instead of using the @nestjs/throttler package.

### Rationale
- More control over implementation details
- No additional dependency
- In-memory is fine for single-instance MVP
- Only 59 lines — simple to maintain

### Consequences
- Won't work across multiple instances — upgrade to Redis-backed when scaling

---

## ADR-007: CSS Variables over Angular Material Theming

**Status:** Accepted
**Date:** July 27, 2026

### Context
Need a custom branded header that doesn't look like standard Material Design.

### Decision
Use CSS custom properties (variables) for all theme tokens instead of Angular Material's `mat-core()` theming.

### Rationale
- Full control over every color, no Material opinion
- 5 themes defined in a single file with simple variable swaps
- Lighter than compiling Material theme mixins
- Header components don't use Material buttons/navs anyway

### Consequences
- Material components (toolbar, icon, button) still need their own theme CSS
- Added `@angular/material/prebuilt-themes/indigo-pink.css` to `angular.json` styles

---

## ADR-008: Makefile + dev.sh for Dev Tooling

**Status:** Accepted
**Date:** July 27, 2026

### Context
Need single-command startup for local development across 3 services.

### Decision
Create a `Makefile` as the entry point and `scripts/dev.sh` as the actual launcher.

### Rationale
- `make dev` is universal across platforms and familiar to developers
- Bash script gives full control over background processes, cleanup, color output
- Can check prerequisites and install deps automatically

### Consequences
- Requires bash (macOS/Linux). Windows needs WSL or Git Bash.
- Python 3.12+ can't build some deps from source — script gracefully skips AI service
