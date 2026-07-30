# Sprint 2 — Execution Report

> **Sprint:** 2 — Identity & Security + Header Redesign + Dev Tooling
> **Date:** July 26-27, 2026
> **Status:** Complete ✅
> **Duration:** 2 days

---

## Sprint Goal

> User registers, logs in, gets JWT. RBAC works. Email verified. Audit trail active. TickerTape-style header. Single-command `make dev` dev tooling.

**Goal Met:** ✅ Yes

---

## Tasks Completed (20/20)

| #    | Task                                                   | Status | Notes                                              |
| ---- | ------------------------------------------------------ | ------ | -------------------------------------------------- |
| 2.1  | User + RefreshToken + AuditLog + UserPreference tables | ✅     | See `prisma/schema.prisma`                         |
| 2.2  | Auth module — register + login                         | ✅     | POST /auth/register + POST /auth/login             |
| 2.3  | JWT strategy + guard                                   | ✅     | Bearer extraction, 15min expiry                    |
| 2.4  | Refresh token rotation                                 | ✅     | 7d expiry, old revoked on use                      |
| 2.5  | RBAC guard                                             | ✅     | @Roles('admin') decorator                          |
| 2.6  | Email verification                                     | ✅     | Token-based, enforced at login                     |
| 2.7  | Password reset                                         | ✅     | Forgot + reset, enumeration prevention             |
| 2.8  | bcrypt(12) + pepper                                    | ✅     | Pepper from BCRYPT_PEPPER env var                  |
| 2.9  | User preferences CRUD                                  | ✅     | GET + PATCH, auto-create                           |
| 2.10 | Audit logging                                          | ✅     | Every API call logged to AuditLog                  |
| 2.11 | Rate limiting                                          | ✅     | 60 req/min per IP, 429 on exceed                   |
| 2.12 | Auth UI (Login/Register)                               | ✅     | Angular Material forms                             |
| 2.13 | Unit tests                                             | ✅     | 23 tests, all passing                              |
| 2.14 | E2E tests                                              | ✅     | 26 tests, full auth flow                           |
| 2.15 | Swagger docs                                           | ✅     | 8 auth + 2 preferences endpoints                   |
| 2.16 | Dev tooling                                            | ✅     | Makefile + scripts/dev.sh                          |
| 2.17 | Material prebuilt theme                                | ✅     | indigo-pink.css in angular.json                    |
| 2.18 | TickerTape header                                      | ✅     | Ticker strip, search, mega-nav, profile            |
| 2.19 | Theme variables                                        | ✅     | --ticker-search-bg, --nav-hover-bg across 5 themes |
| 2.20 | Sprint plan expansion                                  | ✅     | 13 → 17 sprints                                    |

---

## Test Results

| Suite                       | Tests | Status      |
| --------------------------- | ----- | ----------- |
| BE — auth.service.spec.ts   | 23    | ✅ All pass |
| BE — roles.guard.spec.ts    | 4     | ✅ All pass |
| BE — app.controller.spec.ts | 3     | ✅ All pass |
| BE — auth.e2e-spec.ts       | 26    | ✅ All pass |
| BE — app.e2e-spec.ts        | 3     | ✅ All pass |

---

## Files Changed

| File                                    | Lines            | Change                  |
| --------------------------------------- | ---------------- | ----------------------- |
| .gitignore                              | +11              | IDE exclusions added    |
| Makefile                                | +98 (new)        | Dev tooling             |
| apps/web-angular/angular.json           | +1               | Material theme CSS      |
| apps/web-angular/src/styles.scss        | +405/-255        | Header + theme refactor |
| docs/SPRINT-PLAN.md                     | +566             | 17-sprint expansion     |
| docs/sprint-books/Sprint-02/sprint-2.md | +53K (new)       | Full 34-section doc     |
| scripts/dev.sh                          | +129 (new)       | Dev launcher            |
| turbo.json.bak → turbo.json             | renamed          | Restored from backup    |
| **Total**                               | **~2,134 added** |                         |

---

## Key Metrics

| Metric                | Value                                         |
| --------------------- | --------------------------------------------- |
| Sprint tasks          | 20/20 completed                               |
| Unit tests            | 23 passing                                    |
| E2E tests             | 26 passing                                    |
| Auth endpoints        | 8                                             |
| Preferences endpoints | 2                                             |
| Themes                | 5 (slate, light, dark, indigo, emerald, rose) |
| Sprint book files     | 11                                            |
| New tools             | Makefile, dev.sh                              |
| Documentation files   | 2 new (sprint-plan + sprint book)             |

---

## Lessons Learned

1. **Test mock data needs to stay in sync with real logic** — Login test failed because `isEmailVerified` was added to service but not updated in test mock. Fixed by adding the test case.
2. **Angular Material components need prebuilt CSS** — Without `indigo-pink.css` in styles, Material icons and toolbar are invisible. Easy fix once identified.
3. **Python 3.14 has no wheels for many finance packages** — asyncpg, pandas need source compilation. Script gracefully handles this.
4. **Header redesign scope grew** — From "top nav" to full TickerTape clone with animated ticker, search, mega-nav, profile. Worth it for professional look.
