# TODO — Sprint 4 (Market Data Platform — DhanHQ Edition)

> **Status**: Re-scoped Sprint 4 — "Full Stack Upgrade + Security Center" — shipped in `0.4.3`. The open sprint is now the **original Sprint 4 (Market Data Platform)** as the **DhanHQ Edition** (see `docs/SPRINT-PLAN.md`). Provider is locked to DhanHQ; yfinance is dropped.
>
> Verified done (0.4.3): auth register/login/logout/refresh + Google OAuth + MFA + lockout + sessions/devices + security events + language-switcher removal + JWT secret-alignment fix (`d78345e`).

## Sprint 4 — DhanHQ Market Data Platform (in order)

- [ ] Gap analysis signed off (done 2026-08-01 — see `docs/SPRINT-PLAN.md` Sprint 4 table)
- [ ] `MarketDataProvider` abstraction + DhanHQ REST client (`DHAN_CLIENT_ID`, `DHAN_ACCESS_TOKEN` from env only)
- [ ] Instrument master sync (5,000+ NSE/BSE) + `Stock`/`StockPrice` Prisma models + migration
- [ ] DhanHQ WebSocket ingestion (bulk subscribe, heartbeat, reconnect, graceful shutdown)
- [ ] Tick normalizer → Kafka producer → `stock.prices` → idempotent consumer → Redis + PostgreSQL
- [ ] Redis latest-price cache (`quote:{exchange}:{symbol}`) — per-tick, not 5-min poll
- [ ] Historical OHLCV (1Y daily) batch sync + unique-constraint dedupe
- [ ] Fundamentals — verify DhanHQ provides P/E, P/B, ROE, debt; else mark `BLOCKED — DhanHQ capability limitation`
- [ ] Scheduler (3:30 PM IST, idempotent) for historical/fundamentals sync
- [ ] Wire `StocksController`: `/market/stocks`, `/market/stocks/:symbol`, `/market/quote/:symbol`, `/market/candles/:symbol`, `/market/fundamentals/:symbol`
- [ ] Angular stock list (real data) + stock detail/chart (stubs exist, currently mock)
- [ ] Unit tests + Kafka integration test (tick → normalize → Kafka → consumer → Redis → PG)

## CI/CD pre-requisites — need GitHub admin (not verifiable from repo)

- [ ] Add `RENDER_DEPLOY_HOOK_API` to GitHub Secrets (deploy-api job in `ci.yml` skips without it)
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets (deploy-web job in `ci.yml` skips without it)
- [ ] Verify SonarCloud scan passes — `sonar-project.properties` + `sonarcloud` job exist in `ci.yml`, but `SONAR_TOKEN` secret must be set

## Testing — missing coverage (workable)

- [ ] E2E: token refresh with **expired** token (valid + revoked already covered)
- [ ] E2E: account lockout after 5 failed attempts (unit-tested only)
- [ ] Unit tests: AuthController methods, Google OAuth callback handler, login-history endpoints (no specs exist)
- [ ] E2E: assert geo/ISP/VPN fields land in the device row — needs a public IP or a mocked `IpIntelligenceService` (loopback keeps geo null; `IPAPI_KEY` now configured in gitignored `.env`)

## Deferred to later sprints (NOT Sprint 4)

- Technical indicators (RSI/MACD/SMA/EMA/ADX/ATR/VWAP/Bollinger) + patterns → Sprint 6/13
- Universal screener (filter builder, saved screens) → Sprint 13
- Quantora scoring + AI analysis → Sprint 6/8
- News intelligence → Sprint 9
- Full Tickertape feature set → Sprint 13+

## Licensing note

Before public production launch, verify DhanHQ free/developer tier terms for public display/redistribution of live NSE/BSE market data. If the tier does not permit intended public use, treat as a production blocker. Do not bypass licensing restrictions.
