# Sprint 3 — Risks

> **Document ID:** QR-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## Identified Risks

| # | Risk | Severity | Mitigation | Status |
|---|------|----------|------------|--------|
| R-01 | Inline `AuthGuard('google')` silently drops routes on Render | High | Use named GoogleAuthGuard class | Mitigated |
| R-02 | BCRYPT_PEPPER is placeholder (`YOUR_BCRYPT_PEPPER`) | Medium | Set real pepper before production | Open |
| R-03 | JWT_SECRET is weak dev value | Medium | Generate 64-char random secret for production | Open |
| R-04 | Google OAuth redirect URI must match exactly in Google Cloud Console | High | Configured for both localhost and production | Mitigated |
| R-05 | Tokens in URL after OAuth callback (visible in browser history) | Low | HTTPS in production, short-lived tokens | Accepted |
| R-06 | OpenAI API key is placeholder (`sk-xxx`) | Medium | Set real key for AI features | Open |
| R-07 | 68 high-severity npm vulnerabilities (dev dependencies only) | Low | No production impact, monitor for critical | Accepted |
| R-08 | Account lockout threshold hardcoded (not configurable) | Low | Could move to env var in future | Accepted |

---

## Resolved Risks (from Sprint 1-2)

| # | Risk | Resolution |
|---|------|------------|
| R-S1-01 | Prisma 7.x breaking changes | Pinned to 5.22.0 |
| R-S1-02 | No SSL for local Redis | Docker Redis sufficient |
| R-S1-03 | MongoDB not used yet | Connected, ready for use |
| R-S2-01 | Multiple .env files confusion | Consolidated to single root .env |
| R-S2-02 | Duplicate render.yaml files | Consolidated to root render.yaml |
