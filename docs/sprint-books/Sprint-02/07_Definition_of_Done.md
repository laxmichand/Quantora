# Sprint 2 — Definition of Done

> **Document ID:** QDD-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. Sprint-Level Definition of Done

A sprint task is **Done** when ALL of the following are true:

### Code Quality
- [x] Code follows coding standards
- [x] No `any` types in new code
- [x] All validation uses `class-validator` decorators
- [x] No hardcoded secrets in code
- [x] Error handling throws specific HTTP exceptions
- [x] NestJS global filters catch unhandled errors

### Testing
- [x] Service unit tests ≥ 23 passing
- [x] Controller E2E tests ≥ 26 passing
- [x] Frontend component tests passing
- [x] Cover edge cases: duplicate, expired, invalid, not found

### Security
- [x] JWT validated on every request (global guard)
- [x] Refresh token rotation active
- [x] Password hashed with bcrypt(12) + pepper
- [x] Rate limiting active (60 req/min)
- [x] Audit logging for every API call
- [x] Email verification enforced before login
- [x] RBAC restricts role-based endpoints
- [x] Password reset prevents email enumeration

### Documentation
- [x] All auth endpoints documented in Swagger
- [x] Sprint plan updated (17 sprints)
- [x] Sprint-02 folder matches Sprint-01 structure (11 files)
- [x] ADRs documented for key decisions

### Dev Experience
- [x] `make dev` starts all services
- [x] Clear startup output with URLs
- [x] Ctrl+C stops all services cleanly
- [x] .gitignore excludes IDE files

### Header
- [x] Ticker strip animates via CSS
- [x] Search bar renders with focus state
- [x] Mega-nav dropdown opens on hover
- [x] Profile dropdown works when logged in
- [x] Sign Up / Login buttons show when logged out
- [x] All 5 themes have --ticker-search-bg and --nav-hover-bg
