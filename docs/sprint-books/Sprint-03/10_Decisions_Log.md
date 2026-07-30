# Sprint 3 — Decisions Log

> **Document ID:** QDL-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

| # | Date | Decision | Rationale | Impact |
|---|------|----------|-----------|--------|
| D-01 | Jul 27 | Use passport-google-oauth20 | Most popular, well-maintained, NestJS compatible | Google OAuth works |
| D-02 | Jul 27 | Single root .env file | No duplication, single source of truth | Simplified env management |
| D-03 | Jul 27 | dotenv loaded in main.ts with path resolution | Works for monorepo structure | API reads root .env |
| D-04 | Jul 28 | Named GoogleAuthGuard class | Inline AuthGuard('google') caused route registration failure on Render | Fixed missing routes |
| D-05 | Jul 28 | Hardened GoogleStrategy with configured flag | Graceful degradation when GOOGLE_CLIENT_ID not set | No crash, warning logged |
| D-06 | Jul 28 | Landing page Ticker Tape UX | Professional financial platform feel | Investor trust |
| D-07 | Jul 28 | Quantora AI Score replacing MarketsMojo | Custom branding, no external dependency | Brand identity |
| D-08 | Jul 28 | Shared DataTable with InjectionToken | DRY principle, preference persistence | Consistent UX |
| D-09 | Jul 28 | Compact design system | More data visible per viewport | Professional feel |
| D-10 | Jul 28 | IntersectionObserver for scroll animations | No external library needed | Smooth UX |
| D-11 | Jul 28 | render.yaml non-sensitive vars only | Security best practice | No secrets in git |
| D-12 | Jul 28 | Google OAuth callback redirect pattern | Standard SPA OAuth flow | Works with Angular |
| D-13 | Jul 28 | Account lockout 5 attempts / 15 min | Industry standard | Brute-force protection |
