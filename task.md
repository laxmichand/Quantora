# Quantora — Local Task Log

Kept up to date on every problem/command. Current → Completed → Pending.

## Current Task

**Device-fingerprint enrichment + anti-tamper (in progress)**

- Fill `devices` table columns from the correct authority:
  - **Client (Angular)** sends ONLY browser-exposed fields (UA-derived + sensor fingerprint). Never sends country/state/city/ISP/IP/risk_score — those are server-computed (client could spoof them).
  - **Backend (NestJS)** derives from request: UA → browser/engine/os/cpu/device; IP → geo/ISP/VPN/proxy/TOR; headers; lifecycle fields.
  - Columns that browsers can never expose (`private_ip`, `wifi_name`, `hostname`) stay `null`.
- Reference: `DeviceFingerprintService.collect()` (client) vs `registerOrUpdateDevice()` (server, `auth.service.ts`).
- NPM candidates: `ua-parser-js` (installed), `device-detector-js`, `geoip-lite`/MaxMind, `@fingerprintjs/fingerprintjs` (client).

## Completed

### Session policy — enforce max 2 active sessions per user (committed + pushed)

- **Root cause:** login reused/overwrote sessions by device; refresh-token reuse handler revoked *other* sessions; no atomic limit.
- **Fix:**
  - `TokenService`: `MAX_ACTIVE_SESSIONS = 2`, atomic eviction (transaction + `SELECT … FOR UPDATE` row lock, oldest-first by `lastActivity`), refresh-token reuse revokes only the reused session, rotated access tokens blacklisted, evicted sessions removed from Redis.
  - `AuthService`: every login creates an independent session (no per-device reuse); eviction emits `SESSION_REVOKED` security event (`reason: MAX_ACTIVE_SESSIONS_EXCEEDED`).
  - `JwtStrategy`: validates the session is active and the access token matches the session (`accessTokenId === jti`) → revoked/evicted sessions get 401 immediately.
  - `RedisService.onModuleDestroy`: no longer crashes when Redis is down (jest teardown fix).
- **Tests:** `token.service.spec.ts` (13 unit: eviction, oldest-first, concurrency invariant, reuse-scoping, revoke helpers — 92% cov); `session-policy.e2e-spec.ts` (12 e2e: coexist, eviction, same-device re-login, refresh isolation, stale-reuse scope, logout scopes, parallel logins ≤ 2); repaired pre-existing broken `app.e2e-spec.ts` + `auth.e2e-spec.ts` (cookie-based); `jest-e2e.json` `transformIgnorePatterns` + `testTimeout`.
- **Results:** API unit 45/45; e2e 34/34; web unit 39/39; api lint + tsc + build green; web prod build green.

## Pending

- [ ] Implement device-fingerprint server-side enrichment + client field cleanup (see Current Task).
- [ ] Decide whether to persist ipInfo fields into `Device` row on register/login.

## Commands Run (recent)

| Command | Result |
| --- | --- |
| `npm run test --workspace=@quantora/api -- --runInBand` | 45/45 pass |
| `npm run test:e2e --workspace=@quantora/api -- --runInBand --forceExit` | 34/34 pass |
| `npx prettier --check …` | 2 files fixed |
| `npx eslint "apps/api-nest/src/**/*.ts"` | clean |
| `npx tsc --noEmit -p apps/api-nest/tsconfig.build.json` / `tsconfig.json` | clean |
| `npm run build --workspace=@quantora/api` | ok |
| `npx ng build --configuration production` | ok |
| `npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox` | 39/39 pass |
| AI `pytest` | skipped locally (no pytest in venv; ai app untouched) |

## Blockers / Notes

- Redis down locally → e2e must run with `--forceExit` (teardown guard added).
- e2e requires live Supabase DB + `cookieParser()` in test app setup.
- CI runs unit tests only (e2e job disabled in `ci.yml`).
