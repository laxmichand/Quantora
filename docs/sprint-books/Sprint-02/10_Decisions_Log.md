# Sprint 2 — Decisions Log

> **Document ID:** QDL-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## Decisions

| # | Date | Decision | Context | Rationale | Status |
|---|------|----------|---------|-----------|--------|
| D1 | Jul 26 | JWT access tokens: 15min, refresh: 7d with rotation | Standard auth pattern | Balance security (short access) vs UX (long session) | ✅ Accepted |
| D2 | Jul 26 | bcrypt(12) + pepper for passwords | Password storage | bcrypt is well-tested, 12 rounds good security/performance tradeoff | ✅ Accepted |
| D3 | Jul 26 | Custom ThrottlerGuard (in-memory) | Rate limiting | More control, no extra dep. Fine for single instance | ✅ Accepted |
| D4 | Jul 26 | Global JwtAuthGuard with @Public() bypass | Route protection | Secure by default — every new route is protected unless explicitly marked public | ✅ Accepted |
| D5 | Jul 26 | AuditInterceptor writes inline (not async queue) | Audit logging | Simple, no message queue needed at this scale | ✅ Accepted |
| D6 | Jul 27 | CSS variables for theming over Material theming | Header design | Full control, lighter, 5 themes with variable swap | ✅ Accepted |
| D7 | Jul 27 | Makefile + dev.sh for dev tooling | Dev experience | Universal entry point, prerequisite checks, color output | ✅ Accepted |
| D8 | Jul 27 | Add Angular Material prebuilt CSS | Material rendering | Components were invisible without base theme | ✅ Accepted |
| D9 | Jul 27 | Expand sprint plan 13→17 sprints | Planning | Added AI agents, MCP, charting, broker connectors, provider standardization | ✅ Accepted |
