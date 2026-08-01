# TODO — Sprint 4 (Original Scope) & Ahead

> **Status**: The re-scoped Sprint 4 — "Full Stack Upgrade + Security Center" (MFA, sessions/devices, subscriptions/ProGuard, real index ticker, auth hardening) — shipped in `0.4.3`. The **original** Sprint 4 scope — **Market Data Platform** — is now the open sprint.
>
> Verified done (0.4.3): auth register/login/logout/refresh + Google OAuth + MFA + lockout + sessions/devices + security events + language-switcher removal + JWT secret-alignment fix (`d78345e`).

## Original Sprint 4 — Market Data Platform

- [ ] Stock master + live prices (Kafka `stock.prices` producer/consumer)
- [ ] Redis price cache (5-min TTL)
- [ ] Historical OHLCV (1 year) + fundamentals
- [ ] Daily 3:30 PM IST price-refresh scheduler
- [ ] Wire the scaffolded `StocksController` routes (`/api/stocks*`)

## CI/CD pre-requisites — need GitHub admin (not verifiable from repo)

- [ ] Add `RENDER_DEPLOY_HOOK_API` to GitHub Secrets (deploy-api job in `ci.yml` skips without it)
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets (deploy-web job in `ci.yml` skips without it)
- [ ] Verify SonarCloud scan passes — `sonar-project.properties` + `sonarcloud` job exist in `ci.yml`, but `SONAR_TOKEN` secret must be set

## Testing — missing coverage (workable)

- [ ] E2E: token refresh with **expired** token (valid + revoked already covered)
- [ ] E2E: account lockout after 5 failed attempts (unit-tested only)
- [ ] Unit tests: AuthController methods, Google OAuth callback handler, login-history endpoints (no specs exist)
- [ ] E2E: assert geo/ISP/VPN fields land in the device row — needs a public IP or a mocked `IpIntelligenceService` (loopback keeps geo null; `IPAPI_KEY` now configured in gitignored `.env`)

## FastAPI AI service (Sprint 6/8 bits — later)

- [ ] Implement real AI endpoints (currently only `GET /`, `GET /health`, `GET /api/v1/status`)
- [ ] `/ai/*` proxy target + Angular AI chat wiring
