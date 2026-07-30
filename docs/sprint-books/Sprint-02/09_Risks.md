# Sprint 2 — Risk Register

> **Document ID:** QR-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. Risk Matrix

| # | Risk | Probability | Impact | Severity | Mitigation |
|---|------|-------------|--------|----------|------------|
| R1 | JWT secret leaked in code | Low | Critical | **Critical** | `.env` gitignored, production uses Render env vars, CI scans for hardcoded secrets |
| R2 | Refresh token replay attack | Medium | High | **High** | Rotation revokes old token immediately — window of vulnerability is ~1 HTTP roundtrip |
| R3 | In-memory throttler resets on deploy | High | Low | **Low** | Deploy takes <5s, rate limit window resets — acceptable for MVP |
| R4 | bcrypt(12) too slow on low-end hardware | Low | Medium | **Medium** | ~200ms per hash — fine for auth scale. Down to 10 rounds if needed |
| R5 | Angular Material CSS missing | Low | High | **High** | Fixed — added prebuilt theme to angular.json styles array |
| R6 | Python 3.14 can't compile asyncpg | High | Medium | **Medium** | Script gracefully skips AI service, instructions to use Python 3.12 |
| R7 | Scope creep — header redesign took extra time | Medium | Low | **Low** | Absorbed in sprint, tasks expanded from 14 to 20 |

## 2. Mitigated Risks

| # | Risk | Resolution |
|---|------|------------|
| R5 | Missing Material theme | Added `node_modules/@angular/material/prebuilt-themes/indigo-pink.css` to angular.json |
| R6 | Python 3.14 incompatibility | scripts/dev.sh detects and skips AI service with clear instructions |
| R7 | Header scope creep | All 20 tasks completed on time |
