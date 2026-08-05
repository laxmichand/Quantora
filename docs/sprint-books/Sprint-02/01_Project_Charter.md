# Sprint 2 — Identity & Security + Header Redesign + Dev Tooling

> **Document ID:** QCH-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. Sprint Overview

**Sprint Goal:** User registers, logs in, gets JWT. RBAC works. Email verified. Audit trail active. TickerTape-style header. Single-command `make dev` dev tooling.

**Duration:** July 26-27, 2026
**Status:** ✅ Complete (20/20 tasks)

---

## 2. Stakeholders

| Role      | Name         |
| --------- | ------------ |
| Developer | Laxmichandra |

---

## 3. Success Criteria

| #     | Criterion                                                  | Status |
| ----- | ---------------------------------------------------------- | ------ |
| SC-01 | Register + login + JWT flow works end-to-end               | ✅     |
| SC-02 | Email verification enforced before login allowed           | ✅     |
| SC-03 | Refresh token rotation prevents replay attacks             | ✅     |
| SC-04 | RBAC blocks unauthorized role access                       | ✅     |
| SC-05 | Every API call is audit-logged to DB                       | ✅     |
| SC-06 | Rate limiting returns 429 after 60 req/min                 | ✅     |
| SC-07 | User preferences auto-created and editable                 | ✅     |
| SC-08 | Password reset flow prevents enumeration                   | ✅     |
| SC-09 | 22+ unit tests and 17+ E2E tests passing                   | ✅     |
| SC-10 | Swagger docs for all 8 auth + 2 preferences endpoints      | ✅     |
| SC-11 | TickerTape-style header with live ticker, search, mega-nav | ✅     |
| SC-12 | `make dev` starts NestJS + Angular + FastAPI               | ✅     |
| SC-13 | 5 theme variables for header across all themes             | ✅     |

---

## 4. Key Deliverables

| Deliverable                    | Location                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| Auth module (8 endpoints)      | `apps/api-nest/src/auth/`                                      |
| Preferences module (GET/PATCH) | `apps/api-nest/src/preferences/`                               |
| RBAC guard                     | `apps/api-nest/src/common/guards/roles.guard.ts`               |
| Rate limiter                   | `apps/api-nest/src/common/guards/throttler.guard.ts`           |
| Audit interceptor              | `apps/api-nest/src/common/interceptors/audit.interceptor.ts`   |
| Logging interceptor            | `apps/api-nest/src/common/interceptors/logging.interceptor.ts` |
| Exception filter               | `apps/api-nest/src/common/filters/http-exception.filter.ts`    |
| Auth UI (login/register)       | `apps/web-angular/src/app/features/auth/`                      |
| TickerTape header              | `apps/web-angular/src/styles.scss` + `app.component.html`      |
| Dev launcher                   | `Makefile` + `scripts/dev.sh`                                  |
| Sprint-2 full doc              | `docs/sprint-books/Sprint-02/sprint-2.md`                      |
